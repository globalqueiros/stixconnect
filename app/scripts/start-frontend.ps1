# Script para iniciar o Frontend Next.js
# Uso: .\scripts\start-frontend.ps1

Write-Host "🚀 Iniciando Frontend StixConnect..." -ForegroundColor Green

# Verificar se estamos no diretório correto
if (-not (Test-Path "stixconnect\stixconnect")) {
    Write-Host "❌ Erro: Execute este script do diretório raiz do projeto" -ForegroundColor Red
    exit 1
}

# Navegar para o diretório do frontend
Set-Location stixconnect\stixconnect

# Verificar se node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependências npm..." -ForegroundColor Yellow
    npm install
}

# Verificar se .env.local existe
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  Arquivo .env.local não encontrado!" -ForegroundColor Yellow
    Write-Host "📝 Criando .env.local..." -ForegroundColor Yellow
    @"
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=change-this-secret-in-production
"@ | Out-File -FilePath ".env.local" -Encoding UTF8
    Write-Host "✅ Arquivo .env.local criado." -ForegroundColor Green
}

# Iniciar servidor de desenvolvimento
Write-Host ""
Write-Host "✅ Iniciando servidor Next.js..." -ForegroundColor Green
Write-Host "📍 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pressione Ctrl+C para parar o servidor" -ForegroundColor Yellow
Write-Host ""

npm run dev
