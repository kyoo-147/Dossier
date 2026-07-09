from pathlib import Path

from dossier_runtime.runner import RuntimeRunner


def test_runner_creates_run_and_emits_event(tmp_path: Path) -> None:
    runner = RuntimeRunner(tmp_path)

    run = runner.create_run("doc_1", "quick_ocr", "quick_ocr", "0.1.0")

    assert run.status == "created"
    assert runner.events[0]["event_type"] == "run.created"


def test_runner_updates_run_status_and_writes_artifact(tmp_path: Path) -> None:
    runner = RuntimeRunner(tmp_path)
    run = runner.create_run("doc_1", "quick_ocr", "quick_ocr", "0.1.0")

    updated = runner.update_status(run.run_id, "running")
    artifact_ref = runner.create_artifact(b"hello", suffix=".txt")

    assert updated.status == "running"
    assert artifact_ref.startswith("artifact://")
