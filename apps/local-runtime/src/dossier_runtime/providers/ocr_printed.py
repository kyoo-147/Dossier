from __future__ import annotations


def ocr_printed_provider(payload: dict) -> dict:
    text = str(payload.get("text") or payload.get("content") or "")

    return {
        "text": text,
        "lines": [line.strip() for line in text.splitlines() if line.strip()],
        "tokens": text.split(),
        "alternatives": [],
        "confidence": 0.93 if text else 0.0,
    }
