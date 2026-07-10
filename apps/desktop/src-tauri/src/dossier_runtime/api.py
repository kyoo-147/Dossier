from fastapi import FastAPI, BackgroundTasks, HTTPException, Depends
from contextlib import asynccontextmanager
from pydantic import BaseModel
from loguru import logger
import asyncio
from typing import Optional

from .database import init_db, get_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database...")
    await init_db()
    yield
    logger.info("Shutting down...")

app = FastAPI(title="Dossier Runtime API", lifespan=lifespan)

class RunPayload(BaseModel):
    document_id: str
    mode: str
    pipeline_id: str
    pipeline_version: str

class ExecutePayload(BaseModel):
    document_id: str
    file_name: str
    source_type: str
    page_count: int
    has_schema: bool

@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "0.1.0"}

@app.post("/runs")
async def create_run(payload: RunPayload):
    logger.info(f"Creating run for document {payload.document_id}")
    return {"run_id": f"run_{payload.document_id}_{payload.pipeline_id}"}

async def mock_execute_task(run_id: str, payload: ExecutePayload):
    logger.info(f"Starting long running execution for {run_id}")
    await asyncio.sleep(2)
    logger.info(f"Execution finished for {run_id}")

@app.post("/runs/{run_id}/execute")
async def execute_run(run_id: str, payload: ExecutePayload, background_tasks: BackgroundTasks):
    logger.info(f"Queuing execution for {run_id}")
    background_tasks.add_task(mock_execute_task, run_id, payload)
    return {"status": "queued"}

@app.post("/runs/{run_id}/approve")
async def approve_run(run_id: str):
    logger.info(f"Approving run {run_id}")
    return {"status": "approved"}

class RejectPayload(BaseModel):
    note: Optional[str] = None

@app.post("/runs/{run_id}/reject")
async def reject_run(run_id: str, payload: RejectPayload):
    logger.info(f"Rejecting run {run_id} with note: {payload.note}")
    return {"status": "rejected"}

@app.get("/runs/{run_id}/review")
async def list_review_tasks(run_id: str):
    return {
        "tasks": [
            {
                "field_id": "f_123",
                "status": "pending_review",
                "current_value": "Some Value",
                "confidence": 0.85
            }
        ]
    }

class EditPayload(BaseModel):
    field_id: str
    new_value: str
    note: Optional[str] = None

@app.post("/runs/{run_id}/review/edit")
async def apply_field_edit(run_id: str, payload: EditPayload):
    logger.info(f"Editing field {payload.field_id} to {payload.new_value}")
    return {"status": "edited"}

@app.post("/runs/{run_id}/export/{export_target}")
async def export_run(run_id: str, export_target: str):
    logger.info(f"Exporting run {run_id} to {export_target}")
    return {"status": "exported", "path": f"/tmp/exports/{run_id}.json"}
