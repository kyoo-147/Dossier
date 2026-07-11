from __future__ import annotations

import os
from pathlib import Path

from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel

from .runner import RuntimeRunner


class CreateRunRequest(BaseModel):
    document_id: str
    mode: str
    pipeline_id: str
    pipeline_version: str


class ExecuteRunRequest(BaseModel):
    document_id: str
    file_name: str
    source_type: str = "pdf"
    artifact_ref: str | None = None
    page_count: int = 1
    has_schema: bool = False
    text: str | None = None
    content: str | None = None


class FieldEditRequest(BaseModel):
    field_id: str
    new_value: str
    note: str | None = None


class RejectRunRequest(BaseModel):
    note: str | None = None


def create_app(state_root: Path | None = None, launch_token: str | None = None) -> FastAPI:
    resolved_state_root = state_root or Path(os.environ.get("DOSSIER_STATE_ROOT", ".dossier/runtime"))
    resolved_launch_token = launch_token if launch_token is not None else os.environ.get("DOSSIER_RUNTIME_TOKEN")
    runner = RuntimeRunner(resolved_state_root)

    def require_runtime_token(x_dossier_runtime_token: str | None = Header(default=None)) -> None:
      if not resolved_launch_token:
        return
      if x_dossier_runtime_token != resolved_launch_token:
        raise HTTPException(status_code=401, detail="invalid runtime launch token")

    app = FastAPI(
      title="Dossier Local Runtime",
      version="0.1.0",
      dependencies=[Depends(require_runtime_token)],
    )
    app.state.runner = runner

    @app.get("/health")
    def health() -> dict[str, object]:
      return {
        "status": "ok",
        "providers": runner.provider_registry.list_ids(),
      }

    @app.post("/runs")
    def create_run(request: CreateRunRequest) -> dict[str, object]:
      run = runner.create_run(
        request.document_id,
        request.mode,
        request.pipeline_id,
        request.pipeline_version,
      )
      return runner._serialize_run(run)

    @app.post("/runs/{run_id}/execute")
    def execute_run(run_id: str, request: ExecuteRunRequest) -> dict[str, object]:
      return runner.execute_run(run_id, request.model_dump())

    @app.post("/runs/{run_id}/approve")
    def approve_run(run_id: str) -> dict[str, object]:
      return runner.approve_run(run_id, "desktop-user")

    @app.post("/runs/{run_id}/reject")
    def reject_run(run_id: str, request: RejectRunRequest) -> dict[str, object]:
      return runner.reject_run(run_id, "desktop-user", request.note)

    @app.get("/runs/{run_id}/review")
    def list_review_tasks(run_id: str) -> dict[str, object]:
      return runner.list_review_tasks(run_id)

    @app.post("/runs/{run_id}/review/edit")
    def apply_field_edit(run_id: str, request: FieldEditRequest) -> dict[str, object]:
      return runner.apply_field_edit(run_id, request.field_id, request.new_value, "desktop-user", request.note)

    @app.post("/runs/{run_id}/export/{export_target}")
    def export_run(run_id: str, export_target: str) -> dict[str, object]:
      return runner.export_run(run_id, export_target)

    return app
