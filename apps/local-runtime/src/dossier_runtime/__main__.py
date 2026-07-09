from __future__ import annotations

import os

import uvicorn


def main() -> None:
    host = os.environ.get("DOSSIER_RUNTIME_HOST", "127.0.0.1")
    port = int(os.environ.get("DOSSIER_RUNTIME_PORT", "47821"))
    uvicorn.run("dossier_runtime.app:create_app", factory=True, host=host, port=port, log_level="info")


if __name__ == "__main__":
    main()
