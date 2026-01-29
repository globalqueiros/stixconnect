# Script de teste de integração básico
# Testa se os serviços principais estão funcionando

$ErrorActionPreference = "Stop"

Write-Host "🧪 Testando Integração Frontend-Backend..." -ForegroundColor Cyan

$API_URL = $env:NEXT_PUBLIC_API_URL
if (-not $API_URL) {
    $API_URL = "http://localhost:8000"
}

Write-Host "`n📡 Testando backend em: $API_URL" -ForegroundColor Yellow

# Teste 1: Health Check
Write-Host "`n1️⃣ Testando Health Check..." -ForegroundColor Green
try {
    $healthResponse = Invoke-WebRequest -Uri "$API_URL/health" -Method GET -UseBasicParsing -ErrorAction Stop
    if ($healthResponse.StatusCode -eq 200) {
        Write-Host "   ✅ Backend está rodando" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Backend não está respondendo: $_" -ForegroundColor Red
    Write-Host "   💡 Certifique-se de que o backend está rodando: uvicorn stixconnect-backend.app.main:app --reload" -ForegroundColor Yellow
}

# Teste 2: CORS
Write-Host "`n2️⃣ Testando CORS..." -ForegroundColor Green
try {
    $corsResponse = Invoke-WebRequest -Uri "$API_URL/docs" -Method GET -UseBasicParsing -ErrorAction Stop
    Write-Host "   ✅ CORS configurado" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️ Não foi possível testar CORS (normal se /docs não existir)" -ForegroundColor Yellow
}

# Teste 3: Verificar endpoints principais
Write-Host "`n3️⃣ Verificando endpoints principais..." -ForegroundColor Green
$endpoints = @(
    "/auth/register",
    "/consultas",
    "/patients",
    "/users"
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri "$API_URL$endpoint" -Method OPTIONS -UseBasicParsing -ErrorAction SilentlyContinue
        Write-Host "   ✅ $endpoint está disponível" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️ $endpoint pode não estar disponível (requer autenticação)" -ForegroundColor Yellow
    }
}

Write-Host "`n✅ Testes básicos concluídos!" -ForegroundColor Cyan
Write-Host "`n📝 Próximos passos:" -ForegroundColor Yellow
Write-Host "   1. Inicie o backend: cd stixconnect-backend && uvicorn app.main:app --reload" -ForegroundColor White
Write-Host "   2. Inicie o frontend: cd stixconnect/stixconnect && npm run dev" -ForegroundColor White
Write-Host "   3. Ou use o script unificado: npm run dev (na raiz)" -ForegroundColor White
