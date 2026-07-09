# Dossier benchmark harness

This harness scores bundled sample fixtures with pilot-oriented metrics:

- field-level accuracy
- required-field completion
- review rate
- straight-through processing rate
- average latency

Current scope:

- uses bundled fixtures from `@dossier/sample-data`
- reports baseline expectations for the three demo industries
- keeps the scoring contract stable so later model swaps can plug into the same evaluation surface

Commands:

```powershell
pnpm build
pnpm benchmark
```
