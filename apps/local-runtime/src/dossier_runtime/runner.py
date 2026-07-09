from __future__ import annotations

import uuid
from pathlib import Path

from .artifacts import ArtifactStore
from .job_store import JobStore
from .models import RunRecord, utc_now_iso
from .provider_registry import ProviderRegistry


class RuntimeRunner:
    def __init__(self, state_root: Path) -> None:
      self._state_root = state_root
      self._job_store = JobStore(state_root / "runtime.db")
      self._artifact_store = ArtifactStore(state_root / "artifacts")
      self._provider_registry = ProviderRegistry()
      self._events: list[dict] = []

    @property
    def events(self) -> list[dict]:
      return list(self._events)

    @property
    def provider_registry(self) -> ProviderRegistry:
      return self._provider_registry

    def create_run(self, document_id: str, mode: str, pipeline_id: str, pipeline_version: str) -> RunRecord:
      run = RunRecord(
        run_id=f"run_{uuid.uuid4().hex[:12]}",
        document_id=document_id,
        mode=mode,
        pipeline_id=pipeline_id,
        pipeline_version=pipeline_version,
        status="created",
        trace_id=f"trace_{uuid.uuid4().hex[:12]}",
      )
      self._job_store.create_run(run)
      self._emit("run.created", run.trace_id, run.run_id, run.document_id, {"status": run.status})
      return run

    def update_status(self, run_id: str, status: str, *, terminal: bool = False) -> RunRecord:
      finished_at = utc_now_iso() if terminal else None
      self._job_store.update_run_status(run_id, status, finished_at)
      run = self._job_store.get_run(run_id)
      self._emit("run.status_changed", run.trace_id, run.run_id, run.document_id, {"status": status})
      return run

    def create_artifact(self, payload: bytes, suffix: str = ".bin") -> str:
      return self._artifact_store.put_bytes(payload, suffix=suffix)

    def _emit(
      self,
      event_type: str,
      trace_id: str,
      run_id: str | None,
      document_id: str | None,
      payload: dict,
    ) -> None:
      self._events.append(
        {
          "event_type": event_type,
          "trace_id": trace_id,
          "run_id": run_id,
          "document_id": document_id,
          "emitted_at": utc_now_iso(),
          "payload": payload,
        }
      )
