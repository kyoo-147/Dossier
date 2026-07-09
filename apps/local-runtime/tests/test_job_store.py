from pathlib import Path

from dossier_runtime.job_store import JobStore
from dossier_runtime.models import RunRecord


def test_job_store_persists_runs(tmp_path: Path) -> None:
    store = JobStore(tmp_path / "runtime.db")
    created = store.create_run(
        RunRecord(
            run_id="run_1",
            document_id="doc_1",
            mode="quick_ocr",
            pipeline_id="quick_ocr",
            pipeline_version="0.1.0",
            status="created",
            trace_id="trace_1",
        )
    )

    loaded = store.get_run(created.run_id)

    assert loaded.run_id == "run_1"
    assert loaded.status == "created"


def test_job_store_updates_status(tmp_path: Path) -> None:
    store = JobStore(tmp_path / "runtime.db")
    store.create_run(
        RunRecord(
            run_id="run_1",
            document_id="doc_1",
            mode="quick_ocr",
            pipeline_id="quick_ocr",
            pipeline_version="0.1.0",
            status="created",
            trace_id="trace_1",
        )
    )

    store.update_run_status("run_1", "running")

    loaded = store.get_run("run_1")
    assert loaded.status == "running"
