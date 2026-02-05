# Quick Ollama Health Check Script
Write-Host "Checking Ollama status..." -ForegroundColor Cyan

# Check if Ollama process is running
$ollamaProcess = Get-Process | Where-Object {$_.ProcessName -like "*ollama*"}
if ($ollamaProcess) {
    Write-Host "[OK] Ollama process is running (PID: $($ollamaProcess.Id))" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Ollama process not found" -ForegroundColor Red
}

# Check if port 11434 is listening
$portCheck = netstat -ano | findstr :11434
if ($portCheck) {
    Write-Host "[OK] Port 11434 is listening" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Port 11434 is not listening" -ForegroundColor Red
}

# Test Ollama API
Write-Host ""
Write-Host "Testing Ollama API..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri http://localhost:11434/api/tags -UseBasicParsing -TimeoutSec 3
    $models = $response.Content | ConvertFrom-Json
    
    Write-Host "[OK] Ollama API is responding" -ForegroundColor Green
    Write-Host ""
    Write-Host "Available models:" -ForegroundColor Yellow
    foreach ($model in $models.models) {
        $sizeGB = [math]::Round($model.size/1GB, 2)
        $modelName = $model.name
        $sizeText = "$sizeGB GB"
        Write-Host "  - $modelName ($sizeText)" -ForegroundColor White
    }
    
    # Test a simple chat request
    Write-Host ""
    Write-Host "Testing chat endpoint..." -ForegroundColor Cyan
    $chatBody = @{
        model = $models.models[0].name
        messages = @(
            @{
                role = "user"
                content = "Say hello"
            }
        )
        stream = $false
    } | ConvertTo-Json
    
    $chatResponse = Invoke-WebRequest -Uri http://localhost:11434/api/chat -Method Post -Body $chatBody -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
    $chatResult = $chatResponse.Content | ConvertFrom-Json
    
    Write-Host "[OK] Chat endpoint working" -ForegroundColor Green
    $responseText = $chatResult.message.content
    $previewLength = [Math]::Min(50, $responseText.Length)
    $preview = $responseText.Substring(0, $previewLength)
    Write-Host "Response: $preview..." -ForegroundColor Gray
    
} catch {
    Write-Host "[FAIL] Ollama API error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Make sure Ollama is installed: https://ollama.com/download/windows" -ForegroundColor White
    Write-Host "2. Start Ollama: ollama serve" -ForegroundColor White
    Write-Host "3. Pull your model: ollama pull llama3.1:8b" -ForegroundColor White
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Cyan
