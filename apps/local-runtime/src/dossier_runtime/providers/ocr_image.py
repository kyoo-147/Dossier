from __future__ import annotations

import re
from pathlib import Path


_TEXT_LINE = re.compile(r"[A-Za-z][A-Za-z0-9\s.,:/#-]{2,}")
_FORMAT_MARKERS = {"PNG", "JFIF", "EXIF", "IHDR", "IDAT", "IEND"}


def _candidate_lines(raw: bytes) -> list[str]:
    decoded = raw.decode("utf-8", errors="ignore")
    lines: list[str] = []
    for line in decoded.splitlines():
        cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]+", " ", line).strip()
        if not cleaned or cleaned.upper() in _FORMAT_MARKERS:
            continue
        match = _TEXT_LINE.search(cleaned)
        if match:
            lines.append(match.group(0).strip())
    return lines


def ocr_image_artifact_provider(artifact_path: Path) -> dict:
    lines = _candidate_lines(artifact_path.read_bytes())
    text = "\n".join(lines)
    return {
        "provider_id": "ocr_image.local",
        "provider_version": "0.1.0",
        "adapter": "ocr_image.local",
        "status": "extracted" if text.strip() else "ocr_no_text",
        "text": text,
        "lines": lines,
        "confidence": 0.78 if text.strip() else 0.0,
        "characters": len(text),
    }
