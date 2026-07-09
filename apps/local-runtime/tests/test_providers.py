from dossier_runtime.providers.layout import layout_provider
from dossier_runtime.providers.ocr_printed import ocr_printed_provider
from dossier_runtime.providers.probe import probe_provider
from dossier_runtime.providers.table_parser import table_parser_provider


def test_probe_provider_recommends_schema_workflow_when_schema_present() -> None:
    result = probe_provider({"source_type": "pdf", "page_count": 2, "has_schema": True})
    assert result["recommended_mode"] == "schema_workflow"


def test_ocr_provider_extracts_invoice_text() -> None:
    result = ocr_printed_provider({"file_name": "invoice_01.pdf"})
    assert result["confidence"] > 0.9
    assert "Invoice Number" in result["text"]


def test_layout_provider_creates_regions() -> None:
    result = layout_provider({"page_count": 2})
    assert len(result["regions"]) == 2


def test_table_parser_returns_rows_for_invoice() -> None:
    result = table_parser_provider({"file_name": "invoice_01.pdf"})
    assert len(result["rows"]) == 3
