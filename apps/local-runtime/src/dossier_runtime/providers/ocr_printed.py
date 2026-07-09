from __future__ import annotations


def ocr_printed_provider(payload: dict) -> dict:
    file_name = payload.get("file_name", "document.pdf").lower()
    text = (
        "Invoice Number 000789 Total Amount 7590000"
        if "invoice" in file_name or "hoa" in file_name
        else "Scanned text content"
    )
    return {
        "text": text,
        "lines": text.split(" Total "),
        "tokens": text.split(),
        "alternatives": [],
        "confidence": 0.93,
    }
