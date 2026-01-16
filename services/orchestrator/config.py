"""
Predator Analytics v23.0 - Autonomous Orchestrator Configuration
FREE TIER API Configuration for LLM Council
"""
import os

from libs.core.config import settings

# ============================================================================
# LLM COUNCIL - CENTRALIZED CONFIGURATION
# ============================================================================

# Chairman (Decision Maker)
GEMINI_API_KEY = settings.GEMINI_API_KEY
GEMINI_MODEL = settings.GEMINI_MODEL

# Critic/Coder
GROQ_API_KEY = settings.GROQ_API_KEY
GROQ_MODEL = settings.GROQ_MODEL

# Analyst
DEEPSEEK_API_KEY = settings.DEEPSEEK_API_KEY
# Fallback to config model if specific DEEPSEEK model not in settings
DEEPSEEK_MODEL = "deepseek-chat"

# Local Fallback
OLLAMA_BASE_URL = settings.LLM_OLLAMA_BASE_URL
OLLAMA_MODEL = settings.OLLAMA_MODEL
MISTRAL_API_KEY = settings.MISTRAL_API_KEY
MISTRAL_MODEL = settings.MISTRAL_MODEL
DEEPSEEK_API_KEY = settings.DEEPSEEK_API_KEY

# ============================================================================
# TELEGRAM BOT CONTROL PLANE
# ============================================================================
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_ADMIN_ID = os.getenv("TELEGRAM_ADMIN_ID", "")  # Your user ID

# ============================================================================
# ORCHESTRATOR SETTINGS
# ============================================================================
LOOP_INTERVAL_SECONDS = 60  # 1 minute per cycle (fast testing mode)
MAX_ITERATIONS_PER_DAY = 288  # Safety limit
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")  # Use DB 0
POSTGRES_URL = os.getenv("DATABASE_URL", "postgresql://predator:predator_password@postgres:5432/predator_db")

# Stop Signal Key
STOP_SIGNAL_KEY = "orchestrator:stop_signal"
UI_STOP_SIGNAL_KEY = "orchestrator:ui_stop"

# ============================================================================
# PATHS
# ============================================================================
PROJECT_ROOT = "/app"  # Inside Docker container
CODEBASE_PATH = f"{PROJECT_ROOT}/app"
TEST_PATH = f"{PROJECT_ROOT}/tests"
DOCS_PATH = f"{PROJECT_ROOT}/docs"

# ============================================================================
# QUALITY GATES
# ============================================================================
MIN_TEST_COVERAGE = 0.70
MIN_LIGHTHOUSE_SCORE = 0.85
MAX_DEPLOYMENT_FAILURES = 3
