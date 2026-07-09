from __future__ import annotations


def available_repair_strategies() -> list[str]:
    return ["retry_same", "retry_alt_provider", "retry_recrop"]
