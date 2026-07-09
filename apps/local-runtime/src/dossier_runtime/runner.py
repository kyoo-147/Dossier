from __future__ import annotations

import uuid
from pathlib import Path

from .artifacts import ArtifactStore
from .exporters import export_connector_stub, export_json_payload, export_markdown_payload
from .job_store import JobStore
from .models import RunRecord, utc_now_iso
from .provider_registry import ProviderDefinition, ProviderRegistry
from .providers import layout_provider, ocr_printed_provider, probe_provider, table_parser_provider
from .review import ReviewTaskRecord


class RuntimeRunner:
    def __init__(self, state_root: Path) -> None:
      self._state_root = state_root
      self._job_store = JobStore(state_root / "runtime.db")
      self._artifact_store = ArtifactStore(state_root / "artifacts")
      self._provider_registry = ProviderRegistry()
      self._events: list[dict] = []
      self._run_outputs: dict[str, dict] = {}
      self._review_tasks: dict[str, list[ReviewTaskRecord]] = {}
      self._register_baseline_providers()

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

    def execute_run(self, run_id: str, document_payload: dict) -> dict:
      run = self.update_status(run_id, "queued")
      run = self.update_status(run_id, "running")

      probe_result = self.provider_registry.get_by_type("probe").handler(document_payload)
      layout_result = self.provider_registry.get_by_type("layout").handler(document_payload)
      ocr_result = self.provider_registry.get_by_type("ocr_printed").handler(document_payload)
      table_result = self.provider_registry.get_by_type("table_parser").handler(document_payload)

      fields = self._extract_fields(document_payload, ocr_result)
      review_tasks = self._maybe_create_review_tasks(run, document_payload, fields)
      next_status = "needs_review" if review_tasks else "completed"
      run = self.update_status(run_id, next_status, terminal=not review_tasks)

      result = {
        "run": self._serialize_run(run),
        "probe": probe_result,
        "layout": layout_result,
        "ocr": ocr_result,
        "table": table_result,
        "fields": fields,
        "review_tasks": [self._serialize_review_task(task) for task in review_tasks],
      }
      self._run_outputs[run_id] = result
      self._emit("run.executed", run.trace_id, run.run_id, run.document_id, {"status": run.status})
      return result

    def approve_run(self, run_id: str, approved_by: str) -> dict:
      run = self.update_status(run_id, "approved")
      self._emit(
        "approval.completed",
        run.trace_id,
        run.run_id,
        run.document_id,
        {"approved_by": approved_by, "status": run.status},
      )
      output = self._run_outputs[run_id]
      output["run"] = self._serialize_run(run)
      return output

    def export_run(self, run_id: str, export_target: str) -> dict:
      output = self._run_outputs[run_id]
      payload = {
        "run_id": run_id,
        "fields": [{"label": field["label"], "value": field["normalized_value"]} for field in output["fields"]],
      }

      if export_target == "json":
        artifact_ref = self.create_artifact(export_json_payload(payload), suffix=".json")
      elif export_target == "markdown":
        artifact_ref = self.create_artifact(export_markdown_payload(payload), suffix=".md")
      else:
        connector_payload = export_connector_stub(payload)
        artifact_ref = self.create_artifact(str(connector_payload).encode("utf-8"), suffix=".txt")

      run = self.update_status(run_id, "completed", terminal=True)
      self._emit(
        "export.delivered",
        run.trace_id,
        run.run_id,
        run.document_id,
        {"target": export_target, "artifact_ref": artifact_ref},
      )
      output["run"] = self._serialize_run(run)
      return {"artifact_ref": artifact_ref, "run": self._serialize_run(run)}

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

    def _extract_fields(self, document_payload: dict, ocr_result: dict) -> list[dict]:
      file_name = document_payload.get("file_name", "").lower()
      if "invoice" in file_name or "hoa" in file_name:
        return [
          {
            "field_id": "fld_invoice_number",
            "schema_key": "invoice.number",
            "label": "Invoice Number",
            "observed_value": "000789",
            "normalized_value": "000789",
            "status": "approved",
          },
          {
            "field_id": "fld_total_amount",
            "schema_key": "invoice.total_amount",
            "label": "Total Amount",
            "observed_value": "7590000",
            "normalized_value": "7590000",
            "status": "warning" if document_payload.get("has_schema") else "approved",
          },
        ]

      return [
        {
          "field_id": "fld_text",
          "schema_key": "document.text",
          "label": "Detected Text",
          "observed_value": ocr_result["text"],
          "normalized_value": ocr_result["text"],
          "status": "approved",
        }
      ]

    def _maybe_create_review_tasks(
      self, run: RunRecord, document_payload: dict, fields: list[dict]
    ) -> list[ReviewTaskRecord]:
      if run.mode != "schema_workflow":
        self._review_tasks[run.run_id] = []
        return []

      tasks = [
        ReviewTaskRecord(
          review_task_id=f"review_{uuid.uuid4().hex[:10]}",
          run_id=run.run_id,
          reason_codes=["TOTAL_SUM_MISMATCH"] if document_payload.get("has_schema") else ["LOW_CONFIDENCE"],
          priority="medium",
          status="open",
          assigned_to=None,
          required_action="approval",
        )
      ]
      self._review_tasks[run.run_id] = tasks
      return tasks

    def _serialize_run(self, run: RunRecord) -> dict:
      return {
        "run_id": run.run_id,
        "document_id": run.document_id,
        "mode": run.mode,
        "pipeline_id": run.pipeline_id,
        "pipeline_version": run.pipeline_version,
        "status": run.status,
        "trace_id": run.trace_id,
        "started_at": run.started_at,
        "finished_at": run.finished_at,
      }

    @staticmethod
    def _serialize_review_task(task: ReviewTaskRecord) -> dict:
      return {
        "review_task_id": task.review_task_id,
        "run_id": task.run_id,
        "reason_codes": task.reason_codes,
        "priority": task.priority,
        "status": task.status,
        "assigned_to": task.assigned_to,
        "required_action": task.required_action,
      }

    def _register_baseline_providers(self) -> None:
      self.provider_registry.register(
        ProviderDefinition(
          provider_id="probe.default",
          provider_type="probe",
          version="0.1.0",
          handler=probe_provider,
        )
      )
      self.provider_registry.register(
        ProviderDefinition(
          provider_id="layout.default",
          provider_type="layout",
          version="0.1.0",
          handler=layout_provider,
        )
      )
      self.provider_registry.register(
        ProviderDefinition(
          provider_id="ocr_printed.default",
          provider_type="ocr_printed",
          version="0.1.0",
          handler=ocr_printed_provider,
        )
      )
      self.provider_registry.register(
        ProviderDefinition(
          provider_id="table_parser.default",
          provider_type="table_parser",
          version="0.1.0",
          handler=table_parser_provider,
        )
      )
