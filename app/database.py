from __future__ import annotations


"""UA Sources - Database Connection
Alias module for backwards compatibility.
"""
from pathlib import Path
import sys


# Add project root to path to find libs
current_path = Path(__file__).resolve()
ROOT_DIR = Path("/app") if Path("/app").exists() else current_path.parents[3]

if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from app.libs.core.database import Base, async_session_maker, close_db, engine, get_db, init_db


__all__ = ["Base", "async_session_maker", "close_db", "engine", "get_db", "init_db"]
