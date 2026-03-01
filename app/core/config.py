from __future__ import annotations


"""Shim for Core Configuration
Redirects to libs.core.config.
"""
from pathlib import Path
import sys


# Add project root to path to find libs
try:
    if Path("/app").exists():
        ROOT_DIR = Path("/app")
    else:
        # Local dev environment
        # apps/backend/app/core/config.py -> ../../../../ -> Predator_21
        ROOT_DIR = Path(__file__).resolve().parents[3]

    if str(ROOT_DIR) not in sys.path:
        sys.path.insert(0, str(ROOT_DIR))
except Exception:
    pass

# Re-export settings from shared libs
try:
    from app.libs.core.config import settings
except ImportError as e:
    # If libs is not found, we might face issue
    print(f"CRITICAL: Could not import settings from app.libs.core.config: {e}")

    # Minimal mock to avoid immediate crash during import scanning, but app will fail later
    class MockSettings:
        PROJECT_NAME = "Predator"
        VERSION = "v45"
        API_V1_STR = "/api/v1"
        SECRET_KEY = "mock"

    settings = MockSettings()
