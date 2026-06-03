import os
from pathlib import Path
import sys

"""Pytest bootstrap to ensure Predator Analytics packages resolve correctly."""


def _ensure_path(path: Path) -> None:
    path_str = str(path)
    if path.exists() and path_str not in sys.path:
        sys.path.insert(0, path_str)


if "VIRTUAL_ENV" in os.environ:
    venv_root = Path(os.environ["VIRTUAL_ENV"])
    site_packages = venv_root / "lib" / f"python{sys.version_info.major}.{sys.version_info.minor}" / "site-packages"
    _ensure_path(site_packages)


REPO_ROOT = Path(__file__).resolve().parent

# Core repo-level paths
for base in (REPO_ROOT, REPO_ROOT / "libs", REPO_ROOT / "libs" / "predator-common"):
    _ensure_path(base)


# Service-specific packages
service_paths = (
    REPO_ROOT / "services",
    REPO_ROOT / "services" / "core-api",
    REPO_ROOT / "services" / "core-api" / "app",
    REPO_ROOT / "services" / "ingestion-worker",
    REPO_ROOT / "services" / "ingestion-worker" / "app",
    REPO_ROOT / "services" / "rtb_engine",
)
for path in service_paths:
    _ensure_path(path)


# Additional helpers
extra_paths = (
    REPO_ROOT / "app" / "libs",
    REPO_ROOT / "app" / "core",
    REPO_ROOT / "libs" / "core" / "autonomy",
)
for path in extra_paths:
    _ensure_path(path)

# Ensure root imports take precedence
if str(REPO_ROOT) in sys.path:
    sys.path.remove(str(REPO_ROOT))
sys.path.insert(0, str(REPO_ROOT))

