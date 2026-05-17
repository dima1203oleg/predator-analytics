import os
import sys
from pathlib import Path
from unittest.mock import MagicMock

# Dynamically mock heavy packages (faker, xgboost, sdv) to prevent ModuleNotFoundError
class MockFaker:
    def __init__(self, *args, **kwargs):
        pass
    def __getattr__(self, name):
        if name == 'numerify':
            return lambda pattern: "12345678"
        elif name == 'random_int':
            return lambda *args, **kwargs: 42
        elif name == 'pyfloat':
            return lambda *args, **kwargs: 42.0
        elif name == 'boolean':
            return lambda *args, **kwargs: True
        return lambda *args, **kwargs: "mock_value"

heavy_packages = [
    'faker', 
    'xgboost', 
    'sdv', 
    'sdv.metadata', 
    'sdv.single_table', 
    'sdv.evaluation.single_table'
]

for pkg in heavy_packages:
    try:
        __import__(pkg)
    except ImportError:
        mock_mod = MagicMock()
        if pkg == 'faker':
            mock_mod.Faker = MockFaker
        sys.modules[pkg] = mock_mod

# ruff: noqa: E402, I001

# Додаємо шляхи, щоб імпорти app.* та predator_common працювали у тестах
ROOT_DIR = Path(__file__).resolve().parents[1]  # services/core-api
REPO_ROOT = ROOT_DIR.parent.parent  # корінь Predator_21
LIBS_DIR = REPO_ROOT / "libs"
PREDATOR_COMMON = LIBS_DIR / "predator-common"

# Prioritize local service code and predator_common
for path in (PREDATOR_COMMON, LIBS_DIR, REPO_ROOT, ROOT_DIR):
    path_str = str(path)
    if path_str in sys.path:
        sys.path.remove(path_str)
    sys.path.insert(0, path_str)

# Тестовий режим: вимикаємо зовнішні підключення у lifespan/health
from app.config import get_settings
os.environ["TESTING"] = "1"
get_settings.cache_clear()

# Global patch of psutil.net_connections to prevent AccessDenied on macOS/sandbox
import psutil
psutil.net_connections = lambda *args, **kwargs: []

