param(
    [string]$RuntimeHost = "127.0.0.1",
    [int]$Port = 47821,
    [string]$StateRoot = "",
    [string]$Token = ""
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$runtimeRoot = Join-Path $repoRoot "apps\local-runtime"

if ([string]::IsNullOrWhiteSpace($StateRoot)) {
    $StateRoot = Join-Path $repoRoot ".dossier\runtime"
}

Push-Location $runtimeRoot
try {
    $env:PYTHONPATH = "src"
    $env:DOSSIER_RUNTIME_HOST = $RuntimeHost
    $env:DOSSIER_RUNTIME_PORT = "$Port"
    $env:DOSSIER_STATE_ROOT = $StateRoot
    if (-not [string]::IsNullOrWhiteSpace($Token)) {
        $env:DOSSIER_RUNTIME_TOKEN = $Token
    }
    python -m dossier_runtime
}
finally {
    Pop-Location
}
