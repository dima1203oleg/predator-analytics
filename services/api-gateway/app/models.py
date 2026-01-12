"""
Shim for Models
Redirects to libs.core.models.entities
"""
import sys
from pathlib import Path

# Provide access to libs if not in path
try:
    if Path("/app").exists():
        ROOT_DIR = Path("/app")
    else:
        # Local dev environment
        ROOT_DIR = Path(__file__).resolve().parents[3]

    if str(ROOT_DIR) not in sys.path:
        sys.path.insert(0, str(ROOT_DIR))
except Exception:
    pass

try:
    # Import everything from the unified entities file
    from libs.core.models.entities import *
except ImportError as e:
    print(f"CRITICAL: Could not import models from libs.core.models.entities: {e}")
