from __future__ import annotations

from dataclasses import dataclass


@dataclass(slots=True)
class ReviewTaskRecord:
    review_task_id: str
    run_id: str
    reason_codes: list[str]
    priority: str
    status: str
    assigned_to: str | None
    required_action: str
