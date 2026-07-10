import os
import uvicorn
from .api import app
from .config import settings

def main():
    host = os.getenv("DOSSIER_RUNTIME_HOST", "127.0.0.1")
    port = int(os.getenv("DOSSIER_RUNTIME_PORT", "47821"))
    
    print(f"Starting dossier_runtime on {host}:{port}")
    print(f"State root: {settings.state_root}")
    
    uvicorn.run(
        "dossier_runtime.api:app",
        host=host,
        port=port,
        reload=False,
        log_level="info",
        workers=1
    )

if __name__ == "__main__":
    main()
