param(
    [switch]$Tauri
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$desktopRoot = Join-Path $repoRoot "apps\desktop"

Push-Location $desktopRoot
try {
    if ($Tauri) {
        pnpm tauri:dev
    }
    else {
        pnpm dev -- --host 127.0.0.1 --port 5173
    }
}
finally {
    Pop-Location
}
