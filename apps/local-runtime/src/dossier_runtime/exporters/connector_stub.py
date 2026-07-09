from __future__ import annotations


def export_connector_stub(payload: dict) -> dict:
    return {
        "target": "connector_stub",
        "accepted": True,
        "summary": f"Prepared draft for {payload.get('run_id', 'unknown run')}",
    }
