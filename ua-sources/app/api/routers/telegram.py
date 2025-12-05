"""Telegram Router"""
from fastapi import APIRouter, Request

router = APIRouter(prefix="/telegram", tags=["Telegram"])


@router.post("/webhook")
async def telegram_webhook(request: Request):
    """Telegram webhook endpoint"""
    data = await request.json()
    return {"ok": True}


@router.get("/status")
async def get_bot_status():
    """Get bot status"""
    return {"status": "online", "webhook_set": True}
