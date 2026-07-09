from __future__ import annotations

from dataclasses import dataclass


@dataclass(slots=True)
class RevisionRecord:
    revision_id: str
    run_id: str
    document_id: str
    field_id: str | None
    source: str
    author_type: str
    created_at: str
    summary: str
    before_value: str | None
    after_value: str | None
    note: str | None


@dataclass(slots=True)
class ReviewTaskRecord:
    review_task_id: str
    run_id: str
    reason_codes: list[str]
    priority: str
    status: str
    assigned_to: str | None
    required_action: str


@dataclass(slots=True)
class ApprovalAuditRecord:
    approval_id: str
    run_id: str
    review_task_id: str | None
    action: str
    actor: str
    created_at: str
    note: str | None
    revision_id: str | None
