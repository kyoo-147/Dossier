# Dossier

Dossier is a desktop-first, local-first agentic document intelligence platform.

Current pilot scope:

- Tauri 2 desktop shell with Rust kernel scaffold
- Python local runtime for OCR/parse/validation/review/export flow
- Shared contracts, pipeline core, provider SDK, domain packs, sample data, and benchmark harness
- Desktop-native intake, review, export-save flow, plus fixture-driven demos for healthcare, finance, and enterprise

## Workspace layout

- `apps/desktop` — React + Tauri desktop app
- `apps/desktop/src-tauri` — Rust desktop kernel
- `apps/local-runtime` — Python local runtime
- `packages/contracts` — canonical shared contracts
- `packages/pipeline-core` — run planning and review gates
- `packages/provider-sdk` — provider registration and adapter surfaces
- `packages/domain-packs` — healthcare / finance / enterprise demo packs
- `packages/sample-data` — bundled fixtures and demo data
- `tooling/benchmark` — benchmark harness
- `tooling/scripts` — Windows PowerShell developer workflow scripts

## Prerequisites

- Node.js 24+
- pnpm 11+
- Python 3.11+
- Rust / Cargo
- Windows PowerShell

## Install

```powershell
pnpm install
```

## Core commands

```powershell
pnpm test
pnpm check
pnpm build
Push-Location apps/local-runtime
python -m pytest -q
Pop-Location
```

## Developer scripts

```powershell
pnpm runtime
pnpm desktop
pnpm desktop:tauri
pnpm benchmark
pnpm demo
pnpm test:all
```

## Local runtime notes

The Rust kernel starts the Python runtime on demand in Tauri mode. For direct runtime work:

```powershell
pnpm runtime
```

That script sets:

- `PYTHONPATH=src`
- `DOSSIER_RUNTIME_HOST=127.0.0.1`
- `DOSSIER_RUNTIME_PORT=47821`
- `DOSSIER_STATE_ROOT=<repo>/.dossier/runtime`

## Demo flow

1. Run `pnpm desktop:tauri`.
2. Import a document from Inbox with `Pick from device` or use a bundled fixture.
3. Run the local pipeline from the workspace.
4. Review queued documents from `Reviewed` or browse imported files from `All Documents`.
5. Approve/export and save the produced artifact to disk.
6. Run `pnpm benchmark` to inspect the baseline fixture metrics.
