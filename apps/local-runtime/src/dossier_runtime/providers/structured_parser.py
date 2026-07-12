from __future__ import annotations

from .table_parser import table_parser_provider


def structured_parser_provider(payload: dict) -> dict:
    text = str(payload.get("text") or payload.get("content") or "")
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    tables = [table_parser_provider(payload)] if table_parser_provider(payload).get("rows") else []
    chunks = [
        {
            "chunk_id": f"chunk_{index + 1}",
            "page_id": "page_1",
            "text": line,
            "metadata": {"reading_order": index, "source": "structured_parser"},
        }
        for index, line in enumerate(lines)
    ]

    return {
        "status": "parsed" if lines or tables else "empty",
        "adapter": "docling.local",
        "provider_id": "structured_parser.docling_local",
        "provider_version": "0.1.0",
        "markdown": "# Parsed document\n\n" + "\n".join(f"- {line}" for line in lines),
        "chunks": chunks,
        "tables": tables,
        "confidence": 0.88 if lines else 0.0,
    }
