import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base, Mapped, mapped_column
from sqlalchemy import String, Integer, JSON, event
from typing import Dict, Any

from .config import settings

Base = declarative_base()

class DocumentRun(Base):
    __tablename__ = "runs"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    document_id: Mapped[str] = mapped_column(String, index=True)
    pipeline_id: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String)
    result_data: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=True)

class ExtractedField(Base):
    __tablename__ = "fields"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    run_id: Mapped[str] = mapped_column(String, index=True)
    field_key: Mapped[str] = mapped_column(String)
    value: Mapped[str] = mapped_column(String, nullable=True)
    confidence: Mapped[float] = mapped_column(nullable=True)

class Observation(Base):
    __tablename__ = "observations"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    run_id: Mapped[str] = mapped_column(String, index=True)
    event_type: Mapped[str] = mapped_column(String)
    payload: Mapped[Dict[str, Any]] = mapped_column(JSON)

os.makedirs(settings.state_root, exist_ok=True)
db_path = os.path.join(settings.state_root, "dossier.db")
DATABASE_URL = f"sqlite+aiosqlite:///{db_path}"

engine = create_async_engine(
    DATABASE_URL, 
    echo=False,
)

@event.listens_for(engine.sync_engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.execute("PRAGMA cache_size=-64000")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
