from __future__ import annotations

import hashlib
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
