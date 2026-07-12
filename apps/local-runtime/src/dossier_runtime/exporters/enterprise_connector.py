"""Enterprise connector draft — webhook, ERP, HIS, LOS stubs with audit logging.

This module provides stub delivery methods for each enterprise target type.
Real HTTP dispatch is added later; for now each method:
  1. Builds a delivery audit record
  2. Returns structured delivery metadata (target, status, timestamp, attempt)
  3. Logs a connector-specific event

Callers are responsible for writing the audit record to the runner's
_approval_audit list and emitting the event.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone


CONNECTOR_TARGETS = frozenset({"webhook", "erp", "his", "los"})


def build_audit_record(
    run_id: str,
    target: str,
    *,
    status: str = "draft",
    actor: str = "system.connector_draft",
) -> dict:
    """Return a delivery audit dict compatible with ApprovalAuditRecord shape."""
    return {
        "approval_id": f"connector_{uuid.uuid4().hex[:12]}",
        "run_id": run_id,
        "review_task_id": None,
        "action": f"connector.{target}.{status}",
        "actor": actor,
        "created_at": datetime.now(tz=timezone.utc).isoformat(),
        "note": None,
        "revision_id": None,
        "delivery": {
            "target": target,
            "status": status,
            "attempt": 1,
            "connector_version": "0.1.0-draft",
        },
    }


def dispatch_webhook_draft(payload: dict) -> dict:
    """Stub: prepares a webhook POST payload. No HTTP call yet."""
    return {
        "target": "webhook",
        "status": "draft",
        "accepted": True,
        "endpoint": None,  # configured at deployment
        "summary": f"Webhook draft for {payload.get('run_id', 'unknown')}",
        "delivery": build_audit_record(payload.get("run_id", ""), "webhook")["delivery"],
    }


def dispatch_erp_draft(payload: dict) -> dict:
    return {
        "target": "erp",
        "status": "draft",
        "accepted": True,
        "system": None,
        "summary": f"ERP draft for {payload.get('run_id', 'unknown')}",
        "delivery": build_audit_record(payload.get("run_id", ""), "erp")["delivery"],
    }


def dispatch_his_draft(payload: dict) -> dict:
    return {
        "target": "his",
        "status": "draft",
        "accepted": True,
        "system": None,
        "summary": f"HIS draft for {payload.get('run_id', 'unknown')}",
        "delivery": build_audit_record(payload.get("run_id", ""), "his")["delivery"],
    }


def dispatch_los_draft(payload: dict) -> dict:
    return {
        "target": "los",
        "status": "draft",
        "accepted": True,
        "system": None,
        "summary": f"LOS draft for {payload.get('run_id', 'unknown')}",
        "delivery": build_audit_record(payload.get("run_id", ""), "los")["delivery"],
    }


DISPATCHERS = {
    "webhook": dispatch_webhook_draft,
    "erp": dispatch_erp_draft,
    "his": dispatch_his_draft,
    "los": dispatch_los_draft,
}
