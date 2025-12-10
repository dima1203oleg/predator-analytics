"""Telegram Bot Service"""
import logging

logger = logging.getLogger(__name__)


class TelegramBotService:
    """Telegram bot service"""
    
    def __init__(self, token: str = None):
        self.token = token
        self.enabled = bool(token)
    
    async def send_message(self, chat_id: int, text: str):
        """Send message"""
        if not self.enabled:
            return None
        
        try:
            import httpx
            url = f"https://api.telegram.org/bot{self.token}/sendMessage"
            logger.info(f"Sending message to {chat_id}: {text}")
            async with httpx.AsyncClient() as client:
                await client.post(url, json={"chat_id": chat_id, "text": text})
            return True
        except Exception as e:
            logger.error(f"Failed to send telegram message: {e}")
            return False
    
    async def set_webhook(self, url: str):
        """Set webhook"""
        return True


telegram_bot = TelegramBotService()
