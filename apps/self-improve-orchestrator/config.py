"""
Predator Analytics v23.0 - Autonomous Orchestrator Configuration
FREE TIER API Configuration for LLM Council
"""
import os

# ============================================================================
# LLM COUNCIL - FREE TIER APIS
# ============================================================================

# Chairman (Decision Maker) - Google Gemini Free
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = "gemini-flash-latest"  # Free tier (Working)

# Critic/Coder - Groq Free
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = "llama-3.3-70b-versatile"  # Fast & Free

# Analyst - DeepSeek Free
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_MODEL = "deepseek-chat"

# Local Fallback - Ollama
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = "qwen2.5-coder:7b"

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
