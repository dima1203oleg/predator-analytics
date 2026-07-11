import os

from dotenv import load_dotenv

load_dotenv()

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
CORE_API_URL = os.getenv("CORE_API_URL", "http://localhost:3030") # UI/Proxy port or 8000 for direct API
MOCK_API_URL = os.getenv("MOCK_API_URL", "http://localhost:9080")
WEB_UI_URL = os.getenv("WEB_UI_URL", "http://194.177.1.240:3030")
