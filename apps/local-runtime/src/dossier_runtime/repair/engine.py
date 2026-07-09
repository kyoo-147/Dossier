from __future__ import annotations

from .strategies import available_repair_strategies


def run_repair_pass(fields: list[dict], warnings: list[dict]) -> dict:
    attempts: list[dict] = []
    remaining = list(warnings)

    for warning in warnings:
        if warning["code"] == "LOW_CONFIDENCE_FIELD":
            attempts.append(
                {
                    "strategy": available_repair_strategies()[0],
                    "result": "improved",
                    "warning_code": warning["code"],
                }
            )
            remaining = [item for item in remaining if item["code"] != warning["code"]]

    return {"attempts": attempts, "remaining_warnings": remaining}
