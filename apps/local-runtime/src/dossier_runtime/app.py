from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI

from .runner import RuntimeRunner


def create_app(state_root: Path | None = None) -> FastAPI:
    resolved_state_root = state_root or Path(os.environ.get("DOSSIER_STATE_ROOT", ".dossier/runtime"))
    runner = RuntimeRunner(resolved_state_root)

    app = FastAPI(title="Dossier Local Runtime", version="0.1.0")
    app.state.runner = runner

    @app.get("/health")
    def health() -> dict[str, object]:
      return {
        "status": "ok",
        "providers": runner.provider_registry.list_ids(),
      }

    return app
