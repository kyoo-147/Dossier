$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path

Push-Location $repoRoot
try {
    Write-Host "Running benchmark baseline..."
    pnpm benchmark

    Write-Host ""
    Write-Host "Starting Dossier desktop in Tauri dev mode..."
    powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "dev.ps1") -Tauri
}
finally {
    Pop-Location
}
