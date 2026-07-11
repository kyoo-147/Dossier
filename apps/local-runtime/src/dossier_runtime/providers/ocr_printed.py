from __future__ import annotations


def ocr_printed_provider(payload: dict) -> dict:
    text = str(payload.get("text") or payload.get("content") or "")
    if not text:
        text = "Scanned text content"

    return {
        "text": text,
        "lines": [line.strip() for line in text.splitlines() if line.strip()] or [text],
        "tokens": text.split(),
        "alternatives": [],
        "confidence": 0.93,
    }
