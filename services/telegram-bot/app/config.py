import os

from dotenv import load_dotenv

load_dotenv()

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "8562512293:AAEbO8iKWf4ZX_7STXSDDU8h-xpSQzTTrtE")
CORE_API_URL = os.getenv("CORE_API_URL", "http://localhost:3030") # UI/Proxy port or 8000 for direct API
MOCK_API_URL = os.getenv("MOCK_API_URL", "http://localhost:9080")
