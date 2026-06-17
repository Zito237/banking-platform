# ============================================================
# start-all.ps1 — Demarrage de tous les microservices
# Lance chaque service avec H2 FICHIER (les donnees persistent
# entre les redemarrages).
# Usage : .\start-all.ps1
# ============================================================

$ROOT = "C:\Users\nandj\banking-platform"
$JAVA = "C:\Program Files\Microsoft\jdk-21.0.11.10-hotspot\bin\java.exe"

# Dossiers de donnees H2 (crees automatiquement si absents)
New-Item -ItemType Directory -Force -Path "$ROOT\data\auth"        | Out-Null
New-Item -ItemType Directory -Force -Path "$ROOT\data\operator"    | Out-Null
New-Item -ItemType Directory -Force -Path "$ROOT\data\account"     | Out-Null
New-Item -ItemType Directory -Force -Path "$ROOT\data\customer"    | Out-Null
New-Item -ItemType Directory -Force -Path "$ROOT\data\transaction" | Out-Null
New-Item -ItemType Directory -Force -Path "$ROOT\data\loan"        | Out-Null

function Start-Service {
    param($Name, $Port, $Jar, $WorkDir, $ExtraArgs)

    # Verifie si le port est deja occupe
    $existing = netstat -ano | Select-String ":$Port " | Where-Object { $_ -match "LISTENING" }
    if ($existing) {
        Write-Host "[SKIP] $Name deja actif sur :$Port" -ForegroundColor Yellow
        return
    }

    $jvmArgs = $ExtraArgs + @("-jar", $Jar)
    Start-Process -FilePath $JAVA `
        -ArgumentList $jvmArgs `
        -WorkingDirectory $WorkDir `
        -RedirectStandardOutput "$ROOT\logs\$Name.log" `
        -RedirectStandardError  "$ROOT\logs\$Name-err.log" `
        -WindowStyle Hidden
    Write-Host "[OK] $Name demarre sur :$Port" -ForegroundColor Green
}

New-Item -ItemType Directory -Force -Path "$ROOT\logs" | Out-Null

# H2 flags communs (fichier persistant + schema mis a jour sans tout effacer)
$H2_FLAGS_BASE = @(
    "-Dspring.jpa.hibernate.ddl-auto=update"
)

function H2FileArgs($dbName) {
    return $H2_FLAGS_BASE + @("-Dspring.datasource.url=jdbc:h2:file:$ROOT/data/$dbName;AUTO_SERVER=TRUE;DB_CLOSE_DELAY=-1")
}

Write-Host "`n=== Demarrage de la plateforme bancaire ===" -ForegroundColor Cyan

# 1. Discovery Server (Eureka) — pas de DB
Start-Service "discovery-server" 8761 `
    "$ROOT\backend-java\discovery-server\discovery-server\target\discovery-server-0.0.1-SNAPSHOT.jar" `
    "$ROOT\backend-java\discovery-server\discovery-server" `
    @()

Start-Sleep -Seconds 15

# 2. Config Server — profil native, lit config-repo local directement
Start-Service "config-server" 8888 `
    "$ROOT\backend-java\config-server\config-server\target\config-server-0.0.1-SNAPSHOT.jar" `
    "$ROOT\backend-java\config-server\config-server" `
    @(
        "-Dspring.profiles.active=native",
        "-Dspring.cloud.config.server.native.search-locations=file:///$ROOT/config-repo"
    )

Start-Sleep -Seconds 15

# 3. Auth Service
Start-Service "auth-service" 8081 `
    "$ROOT\backend-java\auth-service\auth-service\target\auth-service-0.0.1-SNAPSHOT.jar" `
    "$ROOT\backend-java\auth-service\auth-service" `
    (H2FileArgs "auth")

# 4. Operator Service
Start-Service "operator-service" 8082 `
    "$ROOT\backend-java\operator-service\operator-service\target\operator-service-1.0.0.jar" `
    "$ROOT\backend-java\operator-service\operator-service" `
    (H2FileArgs "operator")

# 5. Account Service
Start-Service "account-service" 8083 `
    "$ROOT\backend-java\account-service\account-service\target\account-service-0.0.1-SNAPSHOT.jar" `
    "$ROOT\backend-java\account-service\account-service" `
    (H2FileArgs "account")

# 6. Customer Service
Start-Service "customer-service" 8084 `
    "$ROOT\backend-java\customer-service\customer-service\target\customer-service-1.0.0.jar" `
    "$ROOT\backend-java\customer-service\customer-service" `
    (H2FileArgs "customer")

# 7. Transaction Service
Start-Service "transaction-service" 8085 `
    "$ROOT\backend-java\transaction-service\transaction-service\target\transaction-service-0.0.1-SNAPSHOT.jar" `
    "$ROOT\backend-java\transaction-service\transaction-service" `
    (H2FileArgs "transaction")

# 8. Loan Service
Start-Service "loan-service" 8086 `
    "$ROOT\backend-java\loan-service\loan-service\target\loan-service-1.0.0.jar" `
    "$ROOT\backend-java\loan-service\loan-service" `
    (H2FileArgs "loan")

Start-Sleep -Seconds 5

# 9. API Gateway — pas de DB
Start-Service "api-gateway" 8080 `
    "$ROOT\backend-java\api-gateway\api-gateway\target\api-gateway-0.0.1-SNAPSHOT.jar" `
    "$ROOT\backend-java\api-gateway\api-gateway" `
    @()

Write-Host "`nTous les services ont ete lances." -ForegroundColor Cyan
Write-Host "Attends ~60 secondes que tous soient prets, puis ouvre http://localhost:5173" -ForegroundColor White
Write-Host "Logs disponibles dans : $ROOT\logs\" -ForegroundColor Gray
