# Get System Specs for Ollama Model Recommendation

Write-Host "=== SYSTEM SPECIFICATIONS ===" -ForegroundColor Cyan
Write-Host ""

# CPU
Write-Host "CPU:" -ForegroundColor Yellow
$cpu = Get-CimInstance Win32_Processor
Write-Host "  Name: $($cpu.Name)"
Write-Host "  Cores: $($cpu.NumberOfCores)"
Write-Host "  Logical Processors: $($cpu.NumberOfLogicalProcessors)"
Write-Host ""

# RAM
Write-Host "RAM:" -ForegroundColor Yellow
$ram = (Get-CimInstance Win32_PhysicalMemory | Measure-Object -Property capacity -Sum).Sum
$ramGB = [math]::Round($ram / 1GB, 2)
Write-Host "  Total: $ramGB GB"
Write-Host ""

# GPU
Write-Host "GPU:" -ForegroundColor Yellow
$gpu = Get-CimInstance Win32_VideoController
foreach ($g in $gpu) {
    if ($g.Name -notlike "*Basic*" -and $g.Name -notlike "*Microsoft*") {
        Write-Host "  Name: $($g.Name)"
        if ($g.AdapterRAM) {
            $gpuRAM = [math]::Round($g.AdapterRAM / 1GB, 2)
            Write-Host "  VRAM: $gpuRAM GB"
        }
    }
}
Write-Host ""

# OS
Write-Host "Operating System:" -ForegroundColor Yellow
$os = Get-CimInstance Win32_OperatingSystem
Write-Host "  $($os.Caption) $($os.Version)"
Write-Host ""

# Check if CUDA/GPU is available
Write-Host "GPU Support:" -ForegroundColor Yellow
try {
    $cuda = nvidia-smi 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ NVIDIA GPU detected (CUDA available)"
        nvidia-smi --query-gpu=name,memory.total --format=csv,noheader | ForEach-Object {
            Write-Host "  $_"
        }
    } else {
        Write-Host "  ❌ No NVIDIA GPU detected"
    }
} catch {
    Write-Host "  ❌ No NVIDIA GPU detected"
}
Write-Host ""

Write-Host "=== RECOMMENDATION ===" -ForegroundColor Green
Write-Host ""

# Make recommendation based on specs
if ($ramGB -ge 32) {
    Write-Host "✅ Recommended: llama3.1:70b (Best quality, needs 32GB+ RAM)" -ForegroundColor Green
} elseif ($ramGB -ge 16) {
    Write-Host "✅ Recommended: llama3.1:8b or mistral:7b (Good balance, needs 16GB+ RAM)" -ForegroundColor Green
} elseif ($ramGB -ge 8) {
    Write-Host "✅ Recommended: llama3.2:3b or phi3:mini (Lightweight, works with 8GB RAM)" -ForegroundColor Green
} else {
    Write-Host "⚠️  Limited RAM. Recommended: phi3:mini or tinyllama (Minimal RAM usage)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "To install Ollama and pull a model:" -ForegroundColor Cyan
Write-Host "  1. Download: https://ollama.com/download" -ForegroundColor White
Write-Host "  2. Install Ollama" -ForegroundColor White
Write-Host "  3. Run: ollama pull [model-name]" -ForegroundColor White
