"""
UA Sources - Database Connection
Alias module for backwards compatibility
"""
from .core.db import engine, async_session_maker, get_db, Base, init_db, close_db

__all__ = ["engine", "async_session_maker", "get_db", "Base", "init_db", "close_db"]
