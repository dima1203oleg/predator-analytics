from __future__ import annotations

"""WinSURF Bridge: Core DB Alias
Maps app.core.db to app.database (which maps to libs.core.database)
Ensures boot-safety across legacy ingestion modules.
"""
from app.database import Base, async_session_maker, close_db, engine, get_db, init_db

__all__ = ["Base", "async_session_maker", "close_db", "engine", "get_db", "init_db"]
