# Script de health check pós-deploy (PowerShell)

Write-Host "🔍 Verificando saúde dos serviços..." -ForegroundColor Cyan
Write-Host ""

$allOk = $true

# Frontend
Write-Host -NoNewline "Frontend (porta 3000): "
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ OK" -ForegroundColor Green
    } else {
        Write-Host "✗ FALHOU (Status: $($response.StatusCode))" -ForegroundColor Red
        $allOk = $false
    }
} catch {
    Write-Host "✗ FALHOU" -ForegroundColor Red
    $allOk = $false
}

# Backend
Write-Host -NoNewline "Backend (porta 8000): "
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -Method GET -TimeoutSec 5 -UseBasicParsing
    $body = $response.Content | ConvertFrom-Json
    if ($body.status -eq "ok") {
        Write-Host "✓ OK" -ForegroundColor Green
    } else {
        Write-Host "✗ FALHOU" -ForegroundColor Red
        $allOk = $false
    }
} catch {
    Write-Host "✗ FALHOU" -ForegroundColor Red
    $allOk = $false
}

# API Auth
Write-Host -NoNewline "API Auth (/auth/me): "
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/auth/me" -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction SilentlyContinue
    Write-Host "✓ OK (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 401) {
        Write-Host "✓ OK (401 esperado sem token)" -ForegroundColor Green
    } else {
        Write-Host "✗ FALHOU" -ForegroundColor Red
        $allOk = $false
    }
}

Write-Host ""
if ($allOk) {
    Write-Host "✅ Todos os serviços estão funcionando!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ Alguns serviços falharam!" -ForegroundColor Red
    exit 1
}
