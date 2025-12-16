"""
Shim for Core Configuration
Redirects to libs.core.config
"""
import sys
from pathlib import Path

# Add project root to path to find libs
# Current: apps/backend/app/core/config.py
# Root is 4 levels up
ROOT_DIR = Path(__file__).resolve().parents[4]
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from libs.core.config import settings, Settings, get_settings
