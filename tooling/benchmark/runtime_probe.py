from __future__ import annotations

import json
import sys
import tempfile
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
RUNTIME_SRC = REPO_ROOT / "apps" / "local-runtime" / "src"

if str(RUNTIME_SRC) not in sys.path:
    sys.path.insert(0, str(RUNTIME_SRC))

from dossier_runtime.runner import RuntimeRunner  # noqa: E402


def artifact_payload_for_fixture(fixture: dict) -> bytes:
    source_text = fixture.get("sourceText", "")
    suffix = Path(fixture["fileName"]).suffix.lower()
    if suffix == ".pdf":
        escaped_lines = [
            line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
            for line in source_text.splitlines()
        ]
        text_ops = " T* ".join(f"({line}) Tj" for line in escaped_lines if line)
        stream = f"BT /F1 12 Tf 72 720 Td {text_ops} ET"
        return f"""%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /Contents 4 0 R >> endobj
4 0 obj << /Length {len(stream)} >> stream
{stream}
endstream endobj
trailer << /Root 1 0 R >>
%%EOF""".encode("utf-8")
    return source_text.encode("utf-8")


def run_fixture(runner: RuntimeRunner, fixture: dict) -> dict:
    suffix = Path(fixture["fileName"]).suffix or ".txt"
    artifact_ref = runner.create_artifact(artifact_payload_for_fixture(fixture), suffix=suffix)
    run = runner.create_run(
        fixture["fixtureId"],
        fixture["mode"],
        f"{fixture['industry']}_{fixture['mode']}",
        "0.1.0",
    )
    result = runner.execute_run(
        run.run_id,
        {
            "document_id": fixture["fixtureId"],
            "file_name": fixture["fileName"],
            "source_type": "image" if fixture["fileName"].lower().endswith((".jpg", ".jpeg", ".png")) else "pdf",
            "page_count": 1,
            "has_schema": fixture["mode"] == "schema_workflow",
            "artifact_ref": artifact_ref,
        },
    )
    export_ref = None
    exported = False
    if result["run"]["status"] == "needs_review":
        result = runner.approve_run(run.run_id, "benchmark")
    if result["run"]["status"] in {"completed", "approved"}:
        exported_payload = runner.export_run(run.run_id, "json")
        export_ref = exported_payload["artifact_ref"]
        exported = True
    return {
        "fixtureId": fixture["fixtureId"],
        "fields": result["fields"],
        "warnings": result["warnings"],
        "review_tasks": result["review_tasks"],
        "run": result["run"],
        "source": result.get("source", {}),
        "events": runner.list_run_events(run.run_id)["events"],
        "exported": exported,
        "export_artifact_ref": export_ref,
    }


def main() -> None:
    fixtures = json.load(sys.stdin)
    with tempfile.TemporaryDirectory(prefix="dossier-benchmark-", ignore_cleanup_errors=True) as temp_dir:
        runner = RuntimeRunner(Path(temp_dir))
        observations = [run_fixture(runner, fixture) for fixture in fixtures]
    print(json.dumps(observations, ensure_ascii=False))


if __name__ == "__main__":
    main()
