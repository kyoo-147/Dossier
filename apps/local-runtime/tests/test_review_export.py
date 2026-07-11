from pathlib import Path

from dossier_runtime.runner import RuntimeRunner


def invoice_payload(document_id: str) -> dict:
    return {
        "document_id": document_id,
        "file_name": "renamed_upload.pdf",
        "source_type": "pdf",
        "page_count": 1,
        "has_schema": True,
        "text": (
            "Invoice Number 000789\n"
            "Invoice Date 05/05/2024\n"
            "Total Amount 7590000\n"
            "May in Canon LBP 2900, 2, 1000\n"
            "Muc in Canon 303, 4, 2000"
        ),
    }


def test_schema_workflow_generates_review_and_exports(tmp_path: Path) -> None:
    runner = RuntimeRunner(tmp_path)
    run = runner.create_run("doc_1", "schema_workflow", "schema_workflow", "0.1.0")

    result = runner.execute_run(
        run.run_id,
        invoice_payload("doc_1"),
    )

    assert result["run"]["status"] == "needs_review"
    assert len(result["review_tasks"]) == 1

    edited = runner.apply_field_edit(run.run_id, "fld_total_amount", "3000", "qa-user", "corrected total")
    assert edited["fields"][2]["human_approved_value"] == "3000"
    assert edited["revisions"][0]["source"] == "human_edit"
    assert edited["approval_audit"][0]["action"] == "field_edited"

    review_listing = runner.list_review_tasks(run.run_id)
    assert len(review_listing["review_tasks"]) == 1
    assert len(review_listing["revisions"]) == 1

    approved = runner.approve_run(run.run_id, "qa-user")
    assert approved["run"]["status"] == "approved"
    assert approved["review_tasks"][0]["status"] == "approved"

    exported = runner.export_run(run.run_id, "json")
    assert exported["artifact_ref"].startswith("artifact://")


def test_reject_run_records_audit(tmp_path: Path) -> None:
    runner = RuntimeRunner(tmp_path)
    run = runner.create_run("doc_2", "schema_workflow", "schema_workflow", "0.1.0")

    runner.execute_run(
        run.run_id,
        invoice_payload("doc_2"),
    )

    rejected = runner.reject_run(run.run_id, "qa-user", "mismatch unresolved")
    assert rejected["run"]["status"] == "failed"
    assert rejected["review_tasks"][0]["status"] == "rejected"
    assert rejected["approval_audit"][0]["action"] == "rejected"
