from pathlib import Path

from dossier_runtime.runner import RuntimeRunner


def test_runner_creates_run_and_emits_event(tmp_path: Path) -> None:
    runner = RuntimeRunner(tmp_path)

    run = runner.create_run("doc_1", "quick_ocr", "quick_ocr", "0.1.0")

    assert run.status == "created"
    assert runner.events[0]["event_type"] == "run.created"
    assert runner.events[0]["sequence"] == 1
    assert runner.list_run_events(run.run_id)["events"][0]["type"] == "run.created"


def test_runner_updates_run_status_and_writes_artifact(tmp_path: Path) -> None:
    runner = RuntimeRunner(tmp_path)
    run = runner.create_run("doc_1", "quick_ocr", "quick_ocr", "0.1.0")

    updated = runner.update_status(run.run_id, "running")
    artifact_ref = runner.create_artifact(b"hello", suffix=".txt")

    assert updated.status == "running"
    assert artifact_ref.startswith("artifact://")


def test_runner_executes_from_text_artifact(tmp_path: Path) -> None:
    runner = RuntimeRunner(tmp_path)
    artifact_ref = runner.create_artifact(
        b"Invoice Number 000789\nInvoice Date 05/05/2024\nTotal Amount 7590000",
        suffix=".txt",
    )
    run = runner.create_run("doc_text", "generic_parse", "generic_parse", "0.1.0")

    result = runner.execute_run(
        run.run_id,
        {
            "document_id": "doc_text",
            "file_name": "renamed_upload.txt",
            "source_type": "text",
            "artifact_ref": artifact_ref,
            "page_count": 1,
            "has_schema": False,
        },
    )

    assert result["source"]["artifact_ref"] == artifact_ref
    assert result["source"]["text_extraction"]["status"] == "extracted"
    assert [field["schema_key"] for field in result["fields"]] == [
        "invoice.number",
        "invoice.date",
        "invoice.total_amount",
    ]


def test_runner_extracts_text_from_text_native_pdf_artifact(tmp_path: Path) -> None:
    runner = RuntimeRunner(tmp_path)
    pdf_payload = b"""%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /Contents 4 0 R >> endobj
4 0 obj << /Length 97 >> stream
BT /F1 12 Tf 72 720 Td (Invoice Number 000789) Tj T* (Invoice Date 05/05/2024) Tj T* (Total Amount 7590000) Tj ET
endstream endobj
trailer << /Root 1 0 R >>
%%EOF"""
    artifact_ref = runner.create_artifact(pdf_payload, suffix=".pdf")
    run = runner.create_run("doc_pdf", "generic_parse", "generic_parse", "0.1.0")

    result = runner.execute_run(
        run.run_id,
        {
            "document_id": "doc_pdf",
            "file_name": "renamed_upload.pdf",
            "source_type": "pdf",
            "artifact_ref": artifact_ref,
            "page_count": 1,
            "has_schema": False,
        },
    )

    assert result["source"]["text_extraction"]["status"] == "extracted"
    assert result["source"]["text_extraction"]["adapter"] in {"pypdf", "pdf_literal_text"}
    assert result["structured_parse"]["status"] == "parsed"
    assert result["structured_parse"]["adapter"] == "docling.local"
    assert result["structured_parse"]["chunks"]
    assert {field["schema_key"]: field["normalized_value"] for field in result["fields"]}[
        "invoice.total_amount"
    ] == "7590000"
    assert result["source"]["artifact_sha256"]


def test_runner_extracts_image_text_from_artifact_without_filename_fallback(tmp_path: Path) -> None:
    runner = RuntimeRunner(tmp_path)
    artifact_ref = runner.create_artifact(b"\x89PNG\r\nParacetamol 500mg\nTake one tablet after meal", suffix=".png")
    run = runner.create_run("doc_image", "generic_parse", "generic_parse", "0.1.0")

    result = runner.execute_run(
        run.run_id,
        {
            "document_id": "doc_image",
            "file_name": "invoice_000789.png",
            "source_type": "image",
            "artifact_ref": artifact_ref,
            "page_count": 1,
            "has_schema": False,
        },
    )

    assert result["source"]["text_extraction"]["status"] == "extracted"
    assert result["source"]["text_extraction"]["adapter"] == "ocr_image.local"
    assert result["source"]["text_extraction"]["provider_id"] == "ocr_image.local"
    assert {field["schema_key"]: field["normalized_value"] for field in result["fields"]}[
        "document.text"
    ] == "Paracetamol"


def test_runner_does_not_extract_image_fields_from_filename_when_artifact_has_no_text(tmp_path: Path) -> None:
    runner = RuntimeRunner(tmp_path)
    artifact_ref = runner.create_artifact(b"\x89PNG\r\n\x00\x01\x02", suffix=".png")
    run = runner.create_run("doc_image_empty", "generic_parse", "generic_parse", "0.1.0")

    result = runner.execute_run(
        run.run_id,
        {
            "document_id": "doc_image_empty",
            "file_name": "invoice_000789.png",
            "source_type": "image",
            "artifact_ref": artifact_ref,
            "page_count": 1,
            "has_schema": False,
        },
    )

    assert result["source"]["text_extraction"]["status"] == "ocr_no_text"
    assert result["fields"] == []


def test_runner_cancel_blocks_export_and_replays_events(tmp_path: Path) -> None:
    runner = RuntimeRunner(tmp_path)
    run = runner.create_run("doc_cancel", "generic_parse", "generic_parse", "0.1.0")

    canceled = runner.cancel_run(run.run_id, "test cancel")

    assert canceled["canceled"] is True
    assert canceled["run"]["status"] == "canceled"
    assert runner.list_run_events(run.run_id, after=1)["events"][-1]["type"] == "run.canceled"

    try:
        runner.export_run(run.run_id, "json")
    except RuntimeError as error:
        assert "canceled" in str(error)
    else:
        raise AssertionError("export should be blocked for canceled runs")
