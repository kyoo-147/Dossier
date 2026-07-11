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


def run_fixture(runner: RuntimeRunner, fixture: dict) -> dict:
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
            "text": fixture.get("sourceText", ""),
        },
    )
    return {
        "fixtureId": fixture["fixtureId"],
        "fields": result["fields"],
        "warnings": result["warnings"],
        "review_tasks": result["review_tasks"],
        "run": result["run"],
        "events": runner.events,
    }


def main() -> None:
    fixtures = json.load(sys.stdin)
    with tempfile.TemporaryDirectory(prefix="dossier-benchmark-", ignore_cleanup_errors=True) as temp_dir:
        runner = RuntimeRunner(Path(temp_dir))
        observations = [run_fixture(runner, fixture) for fixture in fixtures]
    print(json.dumps(observations, ensure_ascii=False))


if __name__ == "__main__":
    main()
