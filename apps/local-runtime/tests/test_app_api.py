from pathlib import Path

from fastapi.testclient import TestClient

from dossier_runtime.app import create_app


def test_runtime_api_health_and_run_lifecycle(tmp_path: Path) -> None:
    client = TestClient(create_app(tmp_path))

    health = client.get("/health")
    assert health.status_code == 200
    assert health.json()["status"] == "ok"

    run_response = client.post(
        "/runs",
        json={
            "document_id": "doc_api_1",
            "mode": "schema_workflow",
            "pipeline_id": "finance_invoice_review",
            "pipeline_version": "0.1.0",
        },
    )
    assert run_response.status_code == 200
    run_id = run_response.json()["run_id"]

    executed = client.post(
        f"/runs/{run_id}/execute",
        json={
            "document_id": "doc_api_1",
            "file_name": "invoice_01.pdf",
            "source_type": "pdf",
            "page_count": 1,
            "has_schema": True,
        },
    )
    assert executed.status_code == 200
    assert executed.json()["run"]["status"] == "needs_review"

    approved = client.post(f"/runs/{run_id}/approve")
    assert approved.status_code == 200
    assert approved.json()["run"]["status"] == "approved"

    exported = client.post(f"/runs/{run_id}/export/json")
    assert exported.status_code == 200
    assert exported.json()["artifact_ref"].startswith("artifact://")
