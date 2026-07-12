from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title="Dossier Cloud Gateway")


class EvaluationUsageRequest(BaseModel):
    tenant_id: str
    release_id: str
    metrics: dict[str, float] = Field(default_factory=dict)


@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/catalog")
def list_catalog():
    return {
        "models": [
            {
                "id": "local_docling",
                "name": "Docling-compatible Local Parser",
                "type": "local_adapter",
                "capabilities": ["structured_parse", "rag_chunks", "tables"],
                "requires_network": False,
            },
            {
                "id": "local_image_ocr",
                "name": "Dossier Local Image OCR",
                "type": "local_adapter",
                "capabilities": ["image_ocr", "scan_ocr"],
                "requires_network": False,
            },
            {
                "id": "cloud_docling",
                "name": "Docling (Cloud)",
                "type": "remote",
                "capabilities": ["structured_parse", "tables"],
                "requires_network": True,
            },
            {
                "id": "cloud_paddle",
                "name": "PaddleOCR (Cloud)",
                "type": "remote",
                "capabilities": ["ocr", "layout"],
                "requires_network": True,
            },
        ]
    }


@app.get("/license")
def get_license(tenant_id: str = "tenant_demo"):
    return {
        "tenant_id": tenant_id,
        "plan": "enterprise_pilot",
        "status": "active",
        "features": {
            "local_first_processing": True,
            "domain_packs": ["finance", "healthcare", "enterprise"],
            "evidence_export": True,
            "optional_cloud_catalog": True,
        },
        "limits": {
            "pilot_days": 56,
            "evaluation_upload_optional": True,
        },
    }


@app.get("/policy")
def get_policy(tenant_id: str = "tenant_demo"):
    return {
        "tenant_id": tenant_id,
        "deployment_mode": "local_first_hybrid",
        "external_ai": {
            "allowed": False,
            "requires_admin_approval": True,
            "data_egress_warning": True,
        },
        "audit": {
            "export_bundle_required": True,
            "include_provider_versions": True,
            "include_review_decisions": True,
        },
        "retention": {
            "local_artifacts": "customer_controlled",
            "gateway_usage": "ephemeral",
        },
    }


@app.post("/usage/evaluation")
def record_evaluation_usage(request: EvaluationUsageRequest):
    return {
        "accepted": True,
        "tenant_id": request.tenant_id,
        "release_id": request.release_id,
        "metric_keys": sorted(request.metrics.keys()),
        "storage": "ephemeral",
        "runtime_dependency": "optional",
    }
