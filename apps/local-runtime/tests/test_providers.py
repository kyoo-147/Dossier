from dossier_runtime.providers.layout import layout_provider
from dossier_runtime.providers.ocr_printed import ocr_printed_provider
from dossier_runtime.providers.probe import probe_provider
from dossier_runtime.providers.structured_parser import structured_parser_provider
from dossier_runtime.providers.table_parser import table_parser_provider


def test_probe_provider_recommends_schema_workflow_when_schema_present() -> None:
    result = probe_provider({"source_type": "pdf", "page_count": 2, "has_schema": True})
    assert result["recommended_mode"] == "schema_workflow"


def test_ocr_provider_extracts_invoice_text() -> None:
    result = ocr_printed_provider({"text": "Invoice Number 000789\nTotal Amount 7590000"})
    assert result["confidence"] > 0.9
    assert "Invoice Number" in result["text"]


def test_layout_provider_creates_regions() -> None:
    result = layout_provider({"page_count": 2})
    assert len(result["regions"]) == 2


def test_table_parser_returns_rows_for_invoice() -> None:
    result = table_parser_provider(
        {
            "text": (
                "Item, Qty, Amount\n"
                "May in Canon LBP 2900, 2, 5000000\n"
                "Muc in Canon 303, 4, 1200000\n"
                "Giay in A4 Double A, 10, 700000"
            )
        }
    )
    assert len(result["rows"]) == 3


def test_structured_parser_returns_docling_compatible_document_shape() -> None:
    result = structured_parser_provider(
        {
            "text": "Invoice Number 000789\nTotal Amount 7590000\nMay in Canon LBP 2900, 2, 7590000",
            "page_count": 1,
        }
    )

    assert result["status"] == "parsed"
    assert result["adapter"] == "docling.local"
    assert result["markdown"].startswith("# Parsed document")
    assert result["chunks"][0]["page_id"] == "page_1"
    assert result["tables"][0]["rows"][0]["amount"] == 7590000


def test_providers_do_not_infer_invoice_from_file_name_only() -> None:
    ocr = ocr_printed_provider({"file_name": "invoice_01.pdf"})
    table = table_parser_provider({"file_name": "invoice_01.pdf"})

    assert "000789" not in ocr["text"]
    assert table["rows"] == []
