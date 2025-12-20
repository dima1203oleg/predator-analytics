"""
WinSURF Bridge: Core DB Alias
Maps app.core.db to app.database (which maps to libs.core.database)
Ensures boot-safety across legacy ingestion modules.
"""
from app.database import (
    engine,
    async_session_maker,
    get_db,
    Base,
    init_db,
    close_db
)

__all__ = ["engine", "async_session_maker", "get_db", "Base", "init_db", "close_db"]
