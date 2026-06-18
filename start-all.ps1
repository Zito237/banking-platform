# ============================================================
# start-all.ps1 — Demarrage de tous les microservices
# Lance chaque service avec H2 FICHIER (les donnees persistent
# entre les redemarrages).
# Usage : .\start-all.ps1
# ============================================================

# IMPORTANT: Projet de groupe => on évite les chemins absolus machine.
# On considère que start-all.ps1 est dans la racine du projet.
$ROOT = $PSScriptRoot

# JAVA : tenter d'abord java.exe dans le PATH
$javaCmd = (Get-Command java.exe -ErrorAction SilentlyContinue)
$JAVA = $null
if ($javaCmd) {
    $JAVA = $javaCmd.Source
}

# Sinon : chemin JDK par défaut (optionnel, ajustable)
if (-not $JAVA) {
    $JAVA_DEFAULT = "C:\\Program Files\\Microsoft\\jdk-21.0.11.10-hotspot\\bin\\java.exe"
    if (Test-Path $JAVA_DEFAULT) {
        $JAVA = $JAVA_DEFAULT
    }
}

if (-not $JAVA) {
    throw "java.exe introuvable. Installez un JDK et ajoutez java au PATH, ou ajustez le chemin JDK dans start-all.ps1."
}

# Dossiers de donnees H2 (crees automatiquement si absents)
$DATA_DIRS = @('auth','operator','account','customer','transaction','loan')
foreach ($d in $DATA_DIRS) {
    New-Item -ItemType Directory -Force -Path (Join-Path $ROOT ("data\\$d")) | Out-Null
}

# Logs
$LOG_DIR = Join-Path $ROOT 'logs'
New-Item -ItemType Directory -Force -Path $LOG_DIR | Out-Null

function Start-Service {
    param($Name, $Port, $Jar, $WorkDir, $ExtraArgs)

    # Verifie si le port est deja occupe
    $existing = netstat -ano | Select-String (":$Port ") | Where-Object { $_ -match "LISTENING" }
    if ($existing) {
        Write-Host "[SKIP] $Name deja actif sur :$Port" -ForegroundColor Yellow
        return
    }

    if (-not (Test-Path $Jar)) {
        throw "[ERROR] Jar introuvable pour ${Name}: ${Jar}"
    }
    if (-not (Test-Path $WorkDir)) {
        throw "[ERROR] WorkingDirectory introuvable pour ${Name}: ${WorkDir}"
    }

    $jvmArgs = $ExtraArgs + @('-jar', $Jar)

    try {
        Start-Process -FilePath $JAVA `
            -ArgumentList $jvmArgs `
            -WorkingDirectory $WorkDir `
            -RedirectStandardOutput (Join-Path $LOG_DIR ("$Name.log")) `
            -RedirectStandardError  (Join-Path $LOG_DIR ("$Name-err.log")) `
            -WindowStyle Hidden | Out-Null

        Write-Host "[OK] $Name demarre (port :$Port)" -ForegroundColor Green
    }
    catch {
        throw "[ERROR] Impossible de demarrer $Name sur :$Port. Detail: $($_.Exception.Message)"
    }
}

Write-Host "`n=== Demarrage de la plateforme bancaire (ROOT=$ROOT) ===" -ForegroundColor Cyan

# 1. Discovery Server (Eureka) — pas de DB
Start-Service 'discovery-server' 8761 `
    (Join-Path $ROOT 'backend-java\\discovery-server\\discovery-server\\target\\discovery-server-0.0.1-SNAPSHOT.jar') `
    (Join-Path $ROOT 'backend-java\\discovery-server\\discovery-server') `
    @()

Start-Sleep -Seconds 15

# 2. Config Server
Start-Service 'config-server' 8888 `
    (Join-Path $ROOT 'backend-java\\config-server\\config-server\\target\\config-server-0.0.1-SNAPSHOT.jar') `
    (Join-Path $ROOT 'backend-java\\config-server\\config-server') `
    @(
        '-Dspring.profiles.active=native',
        ("-Dspring.cloud.config.server.native.search-locations=file:///$ROOT/config-repo")
    )

Start-Sleep -Seconds 15

# 3. Auth Service
Start-Service 'auth-service' 8081 `
    (Join-Path $ROOT 'backend-java\\auth-service\\auth-service\\target\\auth-service-0.0.1-SNAPSHOT.jar') `
    (Join-Path $ROOT 'backend-java\\auth-service\\auth-service') `
    @(
        '-Dspring.jpa.hibernate.ddl-auto=update',
        ("-Dspring.datasource.url=jdbc:h2:file:${ROOT}\\data\\auth;AUTO_SERVER=TRUE;DB_CLOSE_DELAY=-1")
    )

# 4. Operator Service
Start-Service 'operator-service' 8082 `
    (Join-Path $ROOT 'backend-java\\operator-service\\operator-service\\target\\operator-service-1.0.0.jar') `
    (Join-Path $ROOT 'backend-java\\operator-service\\operator-service') `
    @(
        '-Dspring.jpa.hibernate.ddl-auto=update',
        ("-Dspring.datasource.url=jdbc:h2:file:${ROOT}\\data\\operator;AUTO_SERVER=TRUE;DB_CLOSE_DELAY=-1")
    )

# 5. Account Service
Start-Service 'account-service' 8083 `
    (Join-Path $ROOT 'backend-java\\account-service\\account-service\\target\\account-service-0.0.1-SNAPSHOT.jar') `
    (Join-Path $ROOT 'backend-java\\account-service\\account-service') `
    @(
        '-Dspring.jpa.hibernate.ddl-auto=update',
        ("-Dspring.datasource.url=jdbc:h2:file:$ROOT\\data\\account;AUTO_SERVER=TRUE;DB_CLOSE_DELAY=-1")
    )

# 6. Customer Service
Start-Service 'customer-service' 8084 `
    (Join-Path $ROOT 'backend-java\\customer-service\\customer-service\\target\\customer-service-1.0.0.jar') `
    (Join-Path $ROOT 'backend-java\\customer-service\\customer-service') `
    @(
        '-Dspring.jpa.hibernate.ddl-auto=update',
        ("-Dspring.datasource.url=jdbc:h2:file:$ROOT\\data\\customer;AUTO_SERVER=TRUE;DB_CLOSE_DELAY=-1")
    )

# 7. Transaction Service
Start-Service 'transaction-service' 8085 `
    (Join-Path $ROOT 'backend-java\\transaction-service\\transaction-service\\target\\transaction-service-0.0.1-SNAPSHOT.jar') `
    (Join-Path $ROOT 'backend-java\\transaction-service\\transaction-service') `
    @(
        '-Dspring.jpa.hibernate.ddl-auto=update',
        ("-Dspring.datasource.url=jdbc:h2:file:$ROOT\\data\\transaction;AUTO_SERVER=TRUE;DB_CLOSE_DELAY=-1")
    )

# 8. Loan Service
Start-Service 'loan-service' 8086 `
    (Join-Path $ROOT 'backend-java\\loan-service\\loan-service\\target\\loan-service-1.0.0.jar') `
    (Join-Path $ROOT 'backend-java\\loan-service\\loan-service') `
    @(
        '-Dspring.jpa.hibernate.ddl-auto=update',
        ("-Dspring.datasource.url=jdbc:h2:file:$ROOT\\data\\loan;AUTO_SERVER=TRUE;DB_CLOSE_DELAY=-1")
    )

Start-Sleep -Seconds 5

# 9. API Gateway — pas de DB
Start-Service 'api-gateway' 8080 `
    (Join-Path $ROOT 'backend-java\\api-gateway\\api-gateway\\target\\api-gateway-0.0.1-SNAPSHOT.jar') `
    (Join-Path $ROOT 'backend-java\\api-gateway\\api-gateway') `
    @()

Write-Host "`nTous les services ont ete lances (si aucun exception n'a ete leve)." -ForegroundColor Cyan
Write-Host "Attends ~60 secondes que tous soient prets, puis ouvre http://localhost:5173" -ForegroundColor White
Write-Host "Logs disponibles dans : $LOG_DIR" -ForegroundColor Gray

