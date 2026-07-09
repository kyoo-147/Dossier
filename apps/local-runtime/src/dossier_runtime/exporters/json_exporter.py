from __future__ import annotations

import json


def export_json_payload(payload: dict) -> bytes:
    return json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")
