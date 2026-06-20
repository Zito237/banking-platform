# ============================================================
# start-all.ps1 — Demarrage de tous les microservices
# Lance chaque service avec H2 FICHIER (les donnees persistent
# entre les redemarrages).
# Usage : .\start-all.ps1
# ============================================================

# Chemin racine du projet (portable, fonctionne sur toutes les machines)
$ROOT = $PSScriptRoot

# JAVA : cherche d'abord dans le PATH, sinon fallback JDK Microsoft
$javaCmd = (Get-Command java.exe -ErrorAction SilentlyContinue)
$JAVA = $null
if ($javaCmd) { $JAVA = $javaCmd.Source }

if (-not $JAVA) {
    $JAVA_DEFAULT = "C:\Program Files\Microsoft\jdk-21.0.11.10-hotspot\bin\java.exe"
    if (Test-Path $JAVA_DEFAULT) { $JAVA = $JAVA_DEFAULT }
}

if (-not $JAVA) {
    throw "java.exe introuvable. Installez un JDK et ajoutez java au PATH, ou ajustez le chemin JDK dans start-all.ps1."
}

# Dossiers de donnees H2 (crees automatiquement si absents)
$DATA_DIRS = @('auth','operator','account','customer','transaction','loan')
foreach ($d in $DATA_DIRS) {
    New-Item -ItemType Directory -Force -Path (Join-Path $ROOT "data\$d") | Out-Null
}

# Dossier logs
$LOG_DIR = Join-Path $ROOT 'logs'
New-Item -ItemType Directory -Force -Path $LOG_DIR | Out-Null

function Start-Service {
    param($Name, $Port, $Jar, $WorkDir, $ExtraArgs)

    $existing = netstat -ano | Select-String ":$Port " | Where-Object { $_ -match "LISTENING" }
    if ($existing) {
        Write-Host "[SKIP] $Name deja actif sur :$Port" -ForegroundColor Yellow
        return
    }

    if (-not (Test-Path $Jar)) {
        throw "[ERROR] Jar introuvable pour ${Name}: ${Jar}"
    }

    $jvmArgs = $ExtraArgs + @('-jar', $Jar)

    Start-Process -FilePath $JAVA `
        -ArgumentList $jvmArgs `
        -WorkingDirectory $WorkDir `
        -RedirectStandardOutput (Join-Path $LOG_DIR "$Name.log") `
        -RedirectStandardError  (Join-Path $LOG_DIR "$Name-err.log") `
        -WindowStyle Hidden | Out-Null

    Write-Host "[OK] $Name demarre (port :$Port)" -ForegroundColor Green
}

function H2FileArgs($dbName, $user) {
    return @(
        "-Dspring.jpa.hibernate.ddl-auto=update",
        "-Dspring.datasource.url=jdbc:h2:file:$ROOT/data/$dbName;AUTO_SERVER=TRUE;DB_CLOSE_DELAY=-1",
        "-Dspring.datasource.driver-class-name=org.h2.Driver",
        "-Dspring.datasource.username=$user",
        "-Dspring.datasource.password="
    )
}

Write-Host "`n=== Demarrage de la plateforme bancaire (ROOT=$ROOT) ===" -ForegroundColor Cyan

# 1. Discovery Server (Eureka) — pas de DB
Start-Service "discovery-server" 8761 `
    (Join-Path $ROOT 'backend-java\discovery-server\discovery-server\target\discovery-server-0.0.1-SNAPSHOT.jar') `
    (Join-Path $ROOT 'backend-java\discovery-server\discovery-server') `
    @()

Start-Sleep -Seconds 15

# 2. Config Server
Start-Service "config-server" 8888 `
    (Join-Path $ROOT 'backend-java\config-server\config-server\target\config-server-0.0.1-SNAPSHOT.jar') `
    (Join-Path $ROOT 'backend-java\config-server\config-server') `
    @(
        '-Dspring.profiles.active=native',
        "-Dspring.cloud.config.server.native.search-locations=file:///$ROOT/config-repo"
    )

Start-Sleep -Seconds 15

# 3. Auth Service
Start-Service "auth-service" 8081 `
    (Join-Path $ROOT 'backend-java\auth-service\auth-service\target\auth-service-0.0.1-SNAPSHOT.jar') `
    (Join-Path $ROOT 'backend-java\auth-service\auth-service') `
    (H2FileArgs "auth" "au")

# 4. Operator Service
Start-Service "operator-service" 8082 `
    (Join-Path $ROOT 'backend-java\operator-service\operator-service\target\operator-service-1.0.0.jar') `
    (Join-Path $ROOT 'backend-java\operator-service\operator-service') `
    (H2FileArgs "operator" "op")

# 5. Account Service
Start-Service "account-service" 8083 `
    (Join-Path $ROOT 'backend-java\account-service\account-service\target\account-service-0.0.1-SNAPSHOT.jar') `
    (Join-Path $ROOT 'backend-java\account-service\account-service') `
    (H2FileArgs "account" "ac")

# 6. Customer Service
Start-Service "customer-service" 8084 `
    (Join-Path $ROOT 'backend-java\customer-service\customer-service\target\customer-service-1.0.0.jar') `
    (Join-Path $ROOT 'backend-java\customer-service\customer-service') `
    (H2FileArgs "customer" "cu")

# 7. Transaction Service
Start-Service "transaction-service" 8085 `
    (Join-Path $ROOT 'backend-java\transaction-service\transaction-service\target\transaction-service-0.0.1-SNAPSHOT.jar') `
    (Join-Path $ROOT 'backend-java\transaction-service\transaction-service') `
    (H2FileArgs "transaction" "tr")

# 8. Loan Service
Start-Service "loan-service" 8086 `
    (Join-Path $ROOT 'backend-java\loan-service\loan-service\target\loan-service-1.0.0.jar') `
    (Join-Path $ROOT 'backend-java\loan-service\loan-service') `
    (H2FileArgs "loan" "lo")

Start-Sleep -Seconds 5

# 9. API Gateway — pas de DB
Start-Service "api-gateway" 8080 `
    (Join-Path $ROOT 'backend-java\api-gateway\api-gateway\target\api-gateway-0.0.1-SNAPSHOT.jar') `
    (Join-Path $ROOT 'backend-java\api-gateway\api-gateway') `
    @()

# 10. Notification Service (Node.js / NestJS) — port 9002
$notifPort = 9002
$notifExisting = netstat -ano | Select-String ":$notifPort " | Where-Object { $_ -match "LISTENING" }
if ($notifExisting) {
    Write-Host "[SKIP] notification-service deja actif sur :$notifPort" -ForegroundColor Yellow
} else {
    Start-Process -FilePath "node" `
        -ArgumentList (Join-Path $ROOT 'services-node\notification-service\dist\main.js') `
        -WorkingDirectory (Join-Path $ROOT 'services-node\notification-service') `
        -RedirectStandardOutput (Join-Path $LOG_DIR 'notification-service.log') `
        -RedirectStandardError  (Join-Path $LOG_DIR 'notification-service-err.log') `
        -WindowStyle Hidden
    Write-Host "[OK] notification-service demarre sur :$notifPort" -ForegroundColor Green
}

# 11. Audit Service (Node.js / NestJS) — port 9003
$auditPort = 9003
$auditExisting = netstat -ano | Select-String ":$auditPort " | Where-Object { $_ -match "LISTENING" }
if ($auditExisting) {
    Write-Host "[SKIP] audit-service deja actif sur :$auditPort" -ForegroundColor Yellow
} else {
    Start-Process -FilePath "node" `
        -ArgumentList (Join-Path $ROOT 'services-node\audit-service\dist\src\main.js') `
        -WorkingDirectory (Join-Path $ROOT 'services-node\audit-service') `
        -RedirectStandardOutput (Join-Path $LOG_DIR 'audit-service.log') `
        -RedirectStandardError  (Join-Path $LOG_DIR 'audit-service-err.log') `
        -WindowStyle Hidden
    Write-Host "[OK] audit-service demarre sur :$auditPort" -ForegroundColor Green
}

# 12. Reporting Service (Python / FastAPI) — port 9004
$reportPort = 9004
$reportExisting = netstat -ano | Select-String ":$reportPort " | Where-Object { $_ -match "LISTENING" }
if ($reportExisting) {
    Write-Host "[SKIP] reporting-service deja actif sur :$reportPort" -ForegroundColor Yellow
} else {
    Start-Process -FilePath "python" `
        -ArgumentList "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "9004" `
        -WorkingDirectory (Join-Path $ROOT 'services-python\service_reporting') `
        -RedirectStandardOutput (Join-Path $LOG_DIR 'reporting-service.log') `
        -RedirectStandardError  (Join-Path $LOG_DIR 'reporting-service-err.log') `
        -WindowStyle Hidden
    Write-Host "[OK] reporting-service demarre sur :$reportPort" -ForegroundColor Green
}

Write-Host "`nTous les services ont ete lances." -ForegroundColor Cyan
Write-Host "Attends ~60 secondes que tous soient prets, puis ouvre http://localhost:5173" -ForegroundColor White
Write-Host "Logs disponibles dans : $LOG_DIR" -ForegroundColor Gray
