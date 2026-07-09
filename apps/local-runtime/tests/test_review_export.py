from pathlib import Path

from dossier_runtime.runner import RuntimeRunner


def test_schema_workflow_generates_review_and_exports(tmp_path: Path) -> None:
    runner = RuntimeRunner(tmp_path)
    run = runner.create_run("doc_1", "schema_workflow", "schema_workflow", "0.1.0")

    result = runner.execute_run(
        run.run_id,
        {
            "document_id": "doc_1",
            "file_name": "invoice_01.pdf",
            "source_type": "pdf",
            "page_count": 1,
            "has_schema": True,
        },
    )

    assert result["run"]["status"] == "needs_review"
    assert len(result["review_tasks"]) == 1

    approved = runner.approve_run(run.run_id, "qa-user")
    assert approved["run"]["status"] == "approved"

    exported = runner.export_run(run.run_id, "json")
    assert exported["artifact_ref"].startswith("artifact://")
