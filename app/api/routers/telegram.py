from __future__ import annotations


"""Telegram Router - Webhook та API для Telegram бота."""
import logging
import os

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from pydantic import BaseModel

from app.services.telegram_assistant import get_assistant, init_assistant


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/telegram", tags=["Telegram"])

# Initialize bot on startup - ТІЛЬКИ з .env
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
if BOT_TOKEN:
    init_assistant(BOT_TOKEN)
else:
    logger.warning("TELEGRAM_BOT_TOKEN not set - bot disabled")


class WebhookSetup(BaseModel):
    """Webhook setup request."""

    url: str


class MessageRequest(BaseModel):
    """Direct message request."""

    chat_id: int
    text: str
    parse_mode: str = "Markdown"


@router.post("/webhook")
async def telegram_webhook(request: Request, background_tasks: BackgroundTasks):
    """Telegram webhook endpoint
    Обробляє всі вхідні повідомлення від Telegram.
    """
    try:
        data = await request.json()
        logger.info(f"Received webhook: {data}")

        bot = get_assistant()
        if not bot:
            logger.error("Bot not initialized")
            return {"ok": False, "error": "Bot not initialized"}

        # Отримуємо chat_id
        chat_id = None
        if "message" in data:
            chat_id = data["message"]["chat"]["id"]
        elif "callback_query" in data:
            chat_id = data["callback_query"]["message"]["chat"]["id"]

        # Обробляємо в background
        async def process_and_reply():
            try:
                response = await bot.process_update(data)
                if response and chat_id:
                    # Визначаємо чи показувати меню
                    show_menu = False
                    if "message" in data:
                        text = data["message"].get("text", "").lower()
                        if text in ["/start", "/menu"]:
                            show_menu = True

                    await bot.send_message(
                        chat_id=chat_id,
                        text=response,
                        reply_markup=bot.main_menu_keyboard if show_menu else None,
                    )
            except Exception as e:
                logger.exception(f"Error in background task: {e}")
                if chat_id:
                    await bot.send_message(chat_id, f"❌ Помилка: {e!s}")

        background_tasks.add_task(process_and_reply)
        return {"ok": True}

    except Exception as e:
        logger.exception(f"Webhook error: {e}")
        return {"ok": False, "error": str(e)}


@router.get("/status")
async def get_bot_status():
    """Get bot status."""
    bot = get_assistant()
    return {
        "status": "online" if bot and bot.enabled else "offline",
        "token_set": bool(BOT_TOKEN),
        "last_ngrok": {
            "host": bot.last_ngrok.ssh_host if bot and bot.last_ngrok else None,
            "port": bot.last_ngrok.ssh_port if bot and bot.last_ngrok else None,
            "updated": bot.last_ngrok.parsed_at.isoformat() if bot and bot.last_ngrok else None,
        }
        if bot
        else None,
    }


@router.post("/setup-webhook")
async def setup_webhook(setup: WebhookSetup):
    """Setup Telegram webhook."""
    bot = get_assistant()
    if not bot:
        raise HTTPException(status_code=500, detail="Bot not initialized")

    success = await bot.set_webhook(setup.url)
    return {"ok": success, "webhook_url": setup.url}


@router.post("/delete-webhook")
async def delete_webhook():
    """Delete webhook (for polling mode)."""
    bot = get_assistant()
    if not bot:
        raise HTTPException(status_code=500, detail="Bot not initialized")

    success = await bot.delete_webhook()
    return {"ok": success}


@router.post("/send")
async def send_message(msg: MessageRequest):
    """Send message to chat."""
    bot = get_assistant()
    if not bot:
        raise HTTPException(status_code=500, detail="Bot not initialized")

    success = await bot.send_message(chat_id=msg.chat_id, text=msg.text, parse_mode=msg.parse_mode)
    return {"ok": success}


@router.get("/ngrok")
async def get_ngrok_info():
    """Get current ngrok info."""
    bot = get_assistant()
    if not bot or not bot.last_ngrok:
        return {"ngrok": None}

    return {
        "ngrok": {
            "ssh_host": bot.last_ngrok.ssh_host,
            "ssh_port": bot.last_ngrok.ssh_port,
            "http_url": bot.last_ngrok.http_url,
            "updated": bot.last_ngrok.parsed_at.isoformat(),
        }
    }


@router.get("/menu")
async def get_menu():
    """Get bot menu structure."""
    bot = get_assistant()
    if not bot:
        return {"menu": None}

    return {
        "main_menu": bot.main_menu_keyboard,
        "inline_menu": bot.inline_menu,
        "commands": list(bot.system_commands.keys()),
    }
