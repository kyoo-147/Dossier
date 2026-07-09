from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any


def utc_now_iso() -> str:
    return datetime.now(UTC).isoformat()


@dataclass(slots=True)
class RunRecord:
    run_id: str
    document_id: str
    mode: str
    pipeline_id: str
    pipeline_version: str
    status: str
    trace_id: str
    started_at: str = field(default_factory=utc_now_iso)
    finished_at: str | None = None


@dataclass(slots=True)
class RuntimeEvent:
    event_type: str
    trace_id: str
    run_id: str | None
    document_id: str | None
    emitted_at: str
    payload: dict[str, Any]
