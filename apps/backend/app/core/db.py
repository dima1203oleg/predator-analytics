"""
Shim for Core Database
Redirects to libs.core.database
"""
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[4]
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from libs.core.database import engine, async_session_maker, Base, get_db, init_db, close_db
