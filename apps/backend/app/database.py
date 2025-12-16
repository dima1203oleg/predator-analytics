"""
UA Sources - Database Connection
Alias module for backwards compatibility
"""
import sys
from pathlib import Path

# Add project root to path to find libs
ROOT_DIR = Path(__file__).resolve().parents[3]
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from libs.core.database import engine, async_session_maker, get_db, Base, init_db, close_db

__all__ = ["engine", "async_session_maker", "get_db", "Base", "init_db", "close_db"]
