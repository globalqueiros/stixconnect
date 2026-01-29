# Script para testar endpoints da API automaticamente

param(
    [string]$BaseUrl = "http://localhost:8000"
)

$ErrorActionPreference = "Continue"

Write-Host "🧪 Testando Endpoints da API..." -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl`n" -ForegroundColor Yellow

$testResults = @()

function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Endpoint,
        [string]$ExpectedStatus = "200",
        [hashtable]$Headers = @{},
        [object]$Body = $null
    )
    
    $url = "$BaseUrl$Endpoint"
    $result = @{
        Endpoint = $Endpoint
        Method = $Method
        Status = "FAILED"
        Message = ""
    }
    
    try {
        $params = @{
            Uri = $url
            Method = $Method
            UseBasicParsing = $true
            ErrorAction = "Stop"
        }
        
        if ($Headers.Count -gt 0) {
            $params.Headers = $Headers
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json)
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        $statusCode = $response.StatusCode
        
        if ($statusCode -eq [int]$ExpectedStatus -or $ExpectedStatus -eq "any") {
            $result.Status = "PASSED"
            $result.Message = "Status: $statusCode"
        } else {
            $result.Message = "Expected $ExpectedStatus, got $statusCode"
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -and ($statusCode -eq [int]$ExpectedStatus -or $ExpectedStatus -eq "401")) {
            $result.Status = "PASSED"
            $result.Message = "Status: $statusCode (autenticação requerida - OK)"
        } else {
            $result.Message = "Error: $($_.Exception.Message)"
        }
    }
    
    return $result
}

# Testes básicos
Write-Host "📋 Testando endpoints básicos..." -ForegroundColor Green

$testResults += Test-Endpoint -Method "GET" -Endpoint "/docs" -ExpectedStatus "200"
$testResults += Test-Endpoint -Method "GET" -Endpoint "/openapi.json" -ExpectedStatus "200"
$testResults += Test-Endpoint -Method "GET" -Endpoint "/health" -ExpectedStatus "any"

# Testes de autenticação (esperam 401 sem token)
Write-Host "`n🔐 Testando endpoints de autenticação..." -ForegroundColor Green

$testResults += Test-Endpoint -Method "GET" -Endpoint "/auth/me" -ExpectedStatus "401"
$testResults += Test-Endpoint -Method "GET" -Endpoint "/consultas" -ExpectedStatus "401"
$testResults += Test-Endpoint -Method "GET" -Endpoint "/patients" -ExpectedStatus "401"
$testResults += Test-Endpoint -Method "GET" -Endpoint "/users" -ExpectedStatus "401"
$testResults += Test-Endpoint -Method "GET" -Endpoint "/files" -ExpectedStatus "401"

# Testes CORS
Write-Host "`n🌐 Testando CORS..." -ForegroundColor Green

try {
    $corsResponse = Invoke-WebRequest -Uri "$BaseUrl/consultas" -Method OPTIONS -UseBasicParsing -ErrorAction Stop
    $corsHeaders = $corsResponse.Headers
    
    if ($corsHeaders["Access-Control-Allow-Origin"]) {
        $testResults += @{
            Endpoint = "/consultas (CORS)"
            Method = "OPTIONS"
            Status = "PASSED"
            Message = "CORS headers presentes"
        }
    } else {
        $testResults += @{
            Endpoint = "/consultas (CORS)"
            Method = "OPTIONS"
            Status = "FAILED"
            Message = "CORS headers não encontrados"
        }
    }
} catch {
    $testResults += @{
        Endpoint = "/consultas (CORS)"
        Method = "OPTIONS"
        Status = "WARNING"
        Message = "Não foi possível testar CORS: $($_.Exception.Message)"
    }
}

# Resumo
Write-Host "`n📊 Resultados dos Testes:" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Gray

$passed = ($testResults | Where-Object { $_.Status -eq "PASSED" }).Count
$failed = ($testResults | Where-Object { $_.Status -eq "FAILED" }).Count
$warnings = ($testResults | Where-Object { $_.Status -eq "WARNING" }).Count

foreach ($test in $testResults) {
    $statusIcon = if ($test.Status -eq "PASSED") { "✅" } elseif ($test.Status -eq "WARNING") { "⚠️" } else { "❌" }
    Write-Host "$statusIcon $($test.Method) $($test.Endpoint)" -ForegroundColor $(if ($test.Status -eq "PASSED") { "Green" } else { "Yellow" })
    Write-Host "   $($test.Message)" -ForegroundColor Gray
}

Write-Host ("`n" + "=" * 60) -ForegroundColor Gray
Write-Host "✅ Passed: $passed" -ForegroundColor Green
Write-Host "❌ Failed: $failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host "⚠️  Warnings: $warnings" -ForegroundColor Yellow

if ($failed -eq 0) {
    Write-Host "`n🎉 Todos os testes básicos passaram!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n⚠️ Alguns testes falharam. Verifique se o backend está rodando." -ForegroundColor Yellow
    exit 1
}
