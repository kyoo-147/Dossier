import sys
from pathlib import Path

from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from main import app


def test_gateway_exposes_pilot_license_and_policy() -> None:
    client = TestClient(app)

    license_response = client.get("/license", params={"tenant_id": "tenant_demo"})
    policy_response = client.get("/policy", params={"tenant_id": "tenant_demo"})

    assert license_response.status_code == 200
    assert license_response.json()["tenant_id"] == "tenant_demo"
    assert license_response.json()["plan"] == "enterprise_pilot"
    assert license_response.json()["features"]["local_first_processing"] is True

    assert policy_response.status_code == 200
    assert policy_response.json()["deployment_mode"] == "local_first_hybrid"
    assert policy_response.json()["external_ai"]["allowed"] is False
    assert policy_response.json()["audit"]["export_bundle_required"] is True


def test_gateway_accepts_optional_evaluation_usage_without_controlling_local_runtime() -> None:
    client = TestClient(app)

    response = client.post(
        "/usage/evaluation",
        json={
            "tenant_id": "tenant_demo",
            "release_id": "local-c22d352",
            "metrics": {
                "field_level_accuracy": 1.0,
                "required_field_completion": 1.0,
                "evidence_coverage": 1.0,
                "export_success_rate": 1.0,
            },
        },
    )

    assert response.status_code == 200
    assert response.json()["accepted"] is True
    assert response.json()["storage"] == "ephemeral"
    assert response.json()["runtime_dependency"] == "optional"
