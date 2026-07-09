from __future__ import annotations


def probe_provider(payload: dict) -> dict:
    source_type = payload.get("source_type", "pdf")
    page_count = payload.get("page_count", 1)
    has_schema = payload.get("has_schema", False)

    if has_schema:
        recommended_mode = "schema_workflow"
        doc_type = "form"
    elif source_type == "image" and page_count == 1:
        recommended_mode = "quick_ocr"
        doc_type = "unknown"
    else:
        recommended_mode = "generic_parse"
        doc_type = "invoice"

    return {
        "doc_type": doc_type,
        "complexity": "medium" if page_count > 1 else "low",
        "recommended_mode": recommended_mode,
    }
