"""
Ingestion Models - Re-export from core
"""
import sys
from pathlib import Path
from enum import Enum

# Ensure libs is importable
if Path("/app").exists():
    ROOT_DIR = Path("/app")
else:
    ROOT_DIR = Path(__file__).resolve().parents[4]

if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

class IngestionStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

# Re-export FileRegistry from canonical location
from libs.core.models.entities import FileRegistry

__all__ = ["IngestionStatus", "FileRegistry"]
