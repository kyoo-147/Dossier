from fastapi import FastAPI

app = FastAPI(title="Dossier Cloud Gateway")

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/catalog")
def list_catalog():
    return {
        "models": [
            {"id": "cloud_docling", "name": "Docling (Cloud)", "type": "remote"},
            {"id": "cloud_paddle", "name": "PaddleOCR (Cloud)", "type": "remote"},
        ]
    }
