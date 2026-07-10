import os
import hashlib
import shutil
from typing import Optional
from pathlib import Path
from .config import settings

ARTIFACTS_DIR = os.path.join(settings.state_root, "artifacts")

def ensure_store():
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)

def hash_file(filepath: str) -> str:
    hasher = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(8192):
            hasher.update(chunk)
    return hasher.hexdigest()

def import_file(source_path: str) -> str:
    """
    Imports a file into the immutable artifact store and returns its content-addressed ID (hash).
    """
    ensure_store()
    
    file_hash = hash_file(source_path)
    extension = Path(source_path).suffix
    
    artifact_id = f"{file_hash}{extension}"
    target_path = os.path.join(ARTIFACTS_DIR, artifact_id)
    
    if not os.path.exists(target_path):
        shutil.copy2(source_path, target_path)
        
    return artifact_id

def get_artifact_path(artifact_id: str) -> Optional[str]:
    path = os.path.join(ARTIFACTS_DIR, artifact_id)
    if os.path.exists(path):
        return path
    return None
