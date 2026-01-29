# Script para iniciar o Backend FastAPI
# Uso: .\scripts\start-backend.ps1

Write-Host "🚀 Iniciando Backend StixConnect..." -ForegroundColor Green

# Verificar se estamos no diretório correto
if (-not (Test-Path "stixconnect-backend")) {
    Write-Host "❌ Erro: Execute este script do diretório raiz do projeto" -ForegroundColor Red
    exit 1
}

# Navegar para o diretório do backend
Set-Location stixconnect-backend

# Verificar se o ambiente virtual existe
if (-not (Test-Path "venv")) {
    Write-Host "📦 Criando ambiente virtual Python..." -ForegroundColor Yellow
    python -m venv venv
}

# Ativar ambiente virtual
Write-Host "🔧 Ativando ambiente virtual..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# Verificar se requirements.txt existe
if (-not (Test-Path "requirements.txt")) {
    Write-Host "❌ Erro: requirements.txt não encontrado" -ForegroundColor Red
    exit 1
}

# Verificar se as dependências estão instaladas
Write-Host "📥 Verificando dependências..." -ForegroundColor Yellow
$fastapiInstalled = pip show fastapi 2>$null
if (-not $fastapiInstalled) {
    Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
    pip install -r requirements.txt
}

# Verificar se .env existe
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Arquivo .env não encontrado!" -ForegroundColor Yellow
    Write-Host "📝 Copiando env.example para .env..." -ForegroundColor Yellow
    if (Test-Path "..\env.example") {
        Copy-Item "..\env.example" ".env"
        Write-Host "✅ Arquivo .env criado. Por favor, edite com suas credenciais." -ForegroundColor Green
    } else {
        Write-Host "⚠️  env.example não encontrado. Criando .env básico..." -ForegroundColor Yellow
        @"
SECRET_KEY=change-this-secret-key-in-production-minimum-32-characters
ZOOM_ACCOUNT_ID=
ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=
DATABASE_URL=sqlite:///./stixconnect.db
"@ | Out-File -FilePath ".env" -Encoding UTF8
    }
}

# Iniciar servidor
Write-Host ""
Write-Host "✅ Iniciando servidor FastAPI..." -ForegroundColor Green
Write-Host "📍 API: http://localhost:8000" -ForegroundColor Cyan
Write-Host "📚 Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pressione Ctrl+C para parar o servidor" -ForegroundColor Yellow
Write-Host ""

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
