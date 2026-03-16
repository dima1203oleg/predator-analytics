import os
import sys
from pathlib import Path

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
