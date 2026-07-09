from __future__ import annotations

import sqlite3
from pathlib import Path

from .models import RunRecord


class JobStore:
    def __init__(self, db_path: Path) -> None:
      self._db_path = db_path
      self._db_path.parent.mkdir(parents=True, exist_ok=True)
      self._initialize()

    def _connect(self) -> sqlite3.Connection:
      return sqlite3.connect(self._db_path)

    def _initialize(self) -> None:
      with self._connect() as connection:
        connection.execute(
          """
          CREATE TABLE IF NOT EXISTS runs (
            run_id TEXT PRIMARY KEY,
            document_id TEXT NOT NULL,
            mode TEXT NOT NULL,
            pipeline_id TEXT NOT NULL,
            pipeline_version TEXT NOT NULL,
            status TEXT NOT NULL,
            trace_id TEXT NOT NULL,
            started_at TEXT NOT NULL,
            finished_at TEXT
          )
          """
        )

    def create_run(self, run: RunRecord) -> RunRecord:
      with self._connect() as connection:
        connection.execute(
          """
          INSERT INTO runs (
            run_id,
            document_id,
            mode,
            pipeline_id,
            pipeline_version,
            status,
            trace_id,
            started_at,
            finished_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          """,
          (
            run.run_id,
            run.document_id,
            run.mode,
            run.pipeline_id,
            run.pipeline_version,
            run.status,
            run.trace_id,
            run.started_at,
            run.finished_at,
          ),
        )
      return run

    def update_run_status(self, run_id: str, status: str, finished_at: str | None = None) -> None:
      with self._connect() as connection:
        connection.execute(
          """
          UPDATE runs
          SET status = ?, finished_at = COALESCE(?, finished_at)
          WHERE run_id = ?
          """,
          (status, finished_at, run_id),
        )

    def get_run(self, run_id: str) -> RunRecord:
      with self._connect() as connection:
        row = connection.execute(
          """
          SELECT run_id, document_id, mode, pipeline_id, pipeline_version, status, trace_id, started_at, finished_at
          FROM runs
          WHERE run_id = ?
          """,
          (run_id,),
        ).fetchone()

      if row is None:
        raise KeyError(run_id)

      return RunRecord(*row)
