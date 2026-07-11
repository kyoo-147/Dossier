from __future__ import annotations

import hashlib
import shutil
from pathlib import Path


class ArtifactStore:
    def __init__(self, root: Path) -> None:
      self._root = root
      self._root.mkdir(parents=True, exist_ok=True)

    def put_bytes(self, payload: bytes, suffix: str = ".bin") -> str:
      digest = hashlib.sha256(payload).hexdigest()
      target = self._root / f"{digest}{suffix}"
      if not target.exists():
        target.write_bytes(payload)
      return f"artifact://{target.name}"

    def put_file(self, source_path: Path) -> str:
      digest = hashlib.sha256(source_path.read_bytes()).hexdigest()
      suffix = source_path.suffix or ".bin"
      target = self._root / f"{digest}{suffix}"
      if not target.exists():
        shutil.copy2(source_path, target)
      return f"artifact://{target.name}"

    def resolve_ref(self, artifact_ref: str) -> Path:
      artifact_name = artifact_ref.split("/")[-1]
      if not artifact_ref.startswith("artifact://") or not artifact_name or "/" in artifact_name or "\\" in artifact_name:
        raise ValueError(f"invalid artifact ref: {artifact_ref}")
      return self._root / artifact_name
