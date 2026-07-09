from __future__ import annotations


def export_markdown_payload(payload: dict) -> bytes:
    lines = ["# Dossier Export", ""]
    fields = payload.get("fields", [])
    for field in fields:
        lines.append(f"- {field['label']}: {field['value']}")
    return "\n".join(lines).encode("utf-8")
