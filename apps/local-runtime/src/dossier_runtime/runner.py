from __future__ import annotations

import uuid
from pathlib import Path

from .artifacts import ArtifactStore
from .extraction import extract_fields
from .exporters import export_connector_stub, export_json_payload, export_markdown_payload
from .job_store import JobStore
from .models import RunRecord, utc_now_iso
from .provider_registry import ProviderDefinition, ProviderRegistry
from .providers import layout_provider, ocr_printed_provider, probe_provider, table_parser_provider
from .repair import run_repair_pass
from .review import ApprovalAuditRecord, ReviewTaskRecord, RevisionRecord
from .validation import validate_fields


class RuntimeRunner:
    def __init__(self, state_root: Path) -> None:
      self._state_root = state_root
      self._job_store = JobStore(state_root / "runtime.db")
      self._artifact_store = ArtifactStore(state_root / "artifacts")
      self._provider_registry = ProviderRegistry()
      self._events: list[dict] = []
      self._run_outputs: dict[str, dict] = {}
      self._review_tasks: dict[str, list[ReviewTaskRecord]] = {}
      self._revisions: dict[str, list[RevisionRecord]] = {}
      self._approval_audit: dict[str, list[ApprovalAuditRecord]] = {}
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

      fields = extract_fields(document_payload, ocr_result, table_result)
      warnings = validate_fields(document_payload, fields, table_result)
      repair_result = run_repair_pass(fields, warnings)
      final_warnings = repair_result["remaining_warnings"]
      review_tasks = self._maybe_create_review_tasks(run, document_payload, final_warnings)
      next_status = "needs_review" if review_tasks else "completed"
      run = self.update_status(run_id, next_status, terminal=not review_tasks)

      result = {
        "run": self._serialize_run(run),
        "probe": probe_result,
        "layout": layout_result,
        "ocr": ocr_result,
        "table": table_result,
        "fields": fields,
        "warnings": final_warnings,
        "repair": repair_result,
        "review_tasks": [self._serialize_review_task(task) for task in review_tasks],
        "revisions": [self._serialize_revision(revision) for revision in self._revisions.get(run_id, [])],
        "approval_audit": [self._serialize_approval(record) for record in self._approval_audit.get(run_id, [])],
      }
      self._run_outputs[run_id] = result
      self._emit("run.executed", run.trace_id, run.run_id, run.document_id, {"status": run.status})
      return result

    def approve_run(self, run_id: str, approved_by: str) -> dict:
      run = self.update_status(run_id, "approved")
      self._set_review_tasks_status(run_id, "approved")
      self._approval_audit.setdefault(run_id, []).append(
        ApprovalAuditRecord(
          approval_id=f"approval_{uuid.uuid4().hex[:10]}",
          run_id=run_id,
          review_task_id=self._review_tasks.get(run_id, [None])[0].review_task_id if self._review_tasks.get(run_id) else None,
          action="approved",
          actor=approved_by,
          created_at=utc_now_iso(),
          note=None,
          revision_id=None,
        )
      )
      self._emit(
        "approval.completed",
        run.trace_id,
        run.run_id,
        run.document_id,
        {"approved_by": approved_by, "status": run.status},
      )
      output = self._run_outputs[run_id]
      output["run"] = self._serialize_run(run)
      output["review_tasks"] = [self._serialize_review_task(task) for task in self._review_tasks.get(run_id, [])]
      output["approval_audit"] = [self._serialize_approval(record) for record in self._approval_audit.get(run_id, [])]
      return output

    def reject_run(self, run_id: str, rejected_by: str, note: str | None = None) -> dict:
      run = self.update_status(run_id, "failed", terminal=True)
      self._set_review_tasks_status(run_id, "rejected")
      self._approval_audit.setdefault(run_id, []).append(
        ApprovalAuditRecord(
          approval_id=f"approval_{uuid.uuid4().hex[:10]}",
          run_id=run_id,
          review_task_id=self._review_tasks.get(run_id, [None])[0].review_task_id if self._review_tasks.get(run_id) else None,
          action="rejected",
          actor=rejected_by,
          created_at=utc_now_iso(),
          note=note,
          revision_id=None,
        )
      )
      output = self._run_outputs[run_id]
      output["run"] = self._serialize_run(run)
      output["review_tasks"] = [self._serialize_review_task(task) for task in self._review_tasks.get(run_id, [])]
      output["approval_audit"] = [self._serialize_approval(record) for record in self._approval_audit.get(run_id, [])]
      self._emit("approval.rejected", run.trace_id, run.run_id, run.document_id, {"status": run.status, "note": note})
      return output

    def list_review_tasks(self, run_id: str) -> dict:
      return {
        "review_tasks": [self._serialize_review_task(task) for task in self._review_tasks.get(run_id, [])],
        "revisions": [self._serialize_revision(revision) for revision in self._revisions.get(run_id, [])],
        "approval_audit": [self._serialize_approval(record) for record in self._approval_audit.get(run_id, [])],
      }

    def apply_field_edit(
      self,
      run_id: str,
      field_id: str,
      new_value: str,
      edited_by: str,
      note: str | None = None,
    ) -> dict:
      output = self._run_outputs[run_id]
      field = next((item for item in output["fields"] if item["field_id"] == field_id), None)
      if field is None:
        raise KeyError(f"field not found: {field_id}")

      before_value = field.get("human_approved_value") or field.get("normalized_value")
      field["human_approved_value"] = new_value
      field["normalized_value"] = new_value
      field["status"] = "approved"
      field["warning_codes"] = []

      output["warnings"] = [
        warning for warning in output["warnings"] if field["label"].lower() not in warning["message"].lower()
      ]

      revision = RevisionRecord(
        revision_id=f"revision_{uuid.uuid4().hex[:10]}",
        run_id=run_id,
        document_id=output["run"]["document_id"],
        field_id=field_id,
        source="human_edit",
        author_type="user",
        created_at=utc_now_iso(),
        summary=f"Updated {field['label']}",
        before_value=before_value,
        after_value=new_value,
        note=note,
      )
      self._revisions.setdefault(run_id, []).append(revision)
      self._approval_audit.setdefault(run_id, []).append(
        ApprovalAuditRecord(
          approval_id=f"approval_{uuid.uuid4().hex[:10]}",
          run_id=run_id,
          review_task_id=self._review_tasks.get(run_id, [None])[0].review_task_id if self._review_tasks.get(run_id) else None,
          action="field_edited",
          actor=edited_by,
          created_at=utc_now_iso(),
          note=note,
          revision_id=revision.revision_id,
        )
      )

      if not output["warnings"]:
        self._set_review_tasks_status(run_id, "resolved")
        if output["run"]["status"] == "needs_review":
          run = self.update_status(run_id, "completed", terminal=False)
          output["run"] = self._serialize_run(run)

      output["review_tasks"] = [self._serialize_review_task(task) for task in self._review_tasks.get(run_id, [])]
      output["revisions"] = [self._serialize_revision(item) for item in self._revisions.get(run_id, [])]
      output["approval_audit"] = [self._serialize_approval(item) for item in self._approval_audit.get(run_id, [])]
      self._emit(
        "review.field_edited",
        output["run"]["trace_id"],
        run_id,
        output["run"]["document_id"],
        {"field_id": field_id, "edited_by": edited_by, "revision_id": revision.revision_id},
      )
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

    def _maybe_create_review_tasks(
      self, run: RunRecord, document_payload: dict, warnings: list[dict]
    ) -> list[ReviewTaskRecord]:
      if run.mode != "schema_workflow" and not warnings:
        self._review_tasks[run.run_id] = []
        return []

      tasks = [
        ReviewTaskRecord(
          review_task_id=f"review_{uuid.uuid4().hex[:10]}",
          run_id=run.run_id,
          reason_codes=[warning["code"] for warning in warnings] or ["APPROVAL_REQUIRED"],
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

    @staticmethod
    def _serialize_revision(revision: RevisionRecord) -> dict:
      return {
        "revision_id": revision.revision_id,
        "run_id": revision.run_id,
        "document_id": revision.document_id,
        "field_id": revision.field_id,
        "source": revision.source,
        "author_type": revision.author_type,
        "created_at": revision.created_at,
        "summary": revision.summary,
        "before_value": revision.before_value,
        "after_value": revision.after_value,
        "note": revision.note,
      }

    @staticmethod
    def _serialize_approval(record: ApprovalAuditRecord) -> dict:
      return {
        "approval_id": record.approval_id,
        "run_id": record.run_id,
        "review_task_id": record.review_task_id,
        "action": record.action,
        "actor": record.actor,
        "created_at": record.created_at,
        "note": record.note,
        "revision_id": record.revision_id,
      }

    def _set_review_tasks_status(self, run_id: str, status: str) -> None:
      for task in self._review_tasks.get(run_id, []):
        task.status = status

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
