$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path

Push-Location $repoRoot
try {
    pnpm test
    pnpm check
    pnpm build

    Push-Location (Join-Path $repoRoot "apps\local-runtime")
    try {
        python -m pytest -q
    }
    finally {
        Pop-Location
    }

    Push-Location (Join-Path $repoRoot "apps\desktop\src-tauri")
    try {
        cargo test -q
        cargo check -q
        cargo build -q
    }
    finally {
        Pop-Location
    }
}
finally {
    Pop-Location
}
