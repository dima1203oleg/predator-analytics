"""ArgoCD Webhook Router
Receives webhooks from ArgoCD and notifies Telegram bot (and optionally triggers auto-rollback)
"""
import os
import logging
from typing import Any, Dict
from fastapi import APIRouter, Request, BackgroundTasks, HTTPException

from ...services.telegram_assistant import get_assistant

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/argocd", tags=["Argocd"])


@router.post("/webhook")
async def argocd_webhook(request: Request, background_tasks: BackgroundTasks):
    """Receives ArgoCD webhooks and notifies the Telegram assistant.
    Example payload contains `application.metadata.name` and `status`/`operationState` details.
    """
    try:
        payload: Dict[str, Any] = await request.json()
    except Exception as e:
        logger.error(f"Failed to parse ArgoCD webhook payload: {e}")
        raise HTTPException(status_code=400, detail="Invalid JSON")

    logger.info("Received ArgoCD webhook: %s", payload.get('application', {}).get('metadata', {}).get('name'))
    assistant = get_assistant()
    if not assistant:
        logger.warning("Telegram assistant not initialized; ignoring webhook")
        return {"ok": False, "error": "assistant not available"}

    # Background processing
    async def process_event():
        try:
            await process_argocd_event(payload, assistant)
        except Exception as e:
            logger.error(f"Error handling ArgoCD webhook event: {e}")
            try:
                if assistant and (assistant.default_chat_id or assistant.requesting_user_id):
                    await assistant._send_telegram_message(assistant.default_chat_id or assistant.requesting_user_id, f"❌ Error handling ArgoCD event: {e}")
            except Exception:
                logger.error('Failed to send webhook error notification')

    background_tasks.add_task(process_event)
    return {"ok": True}


async def process_argocd_event(payload: Dict[str, Any], assistant) -> None:
    """Process a single ArgoCD webhook payload and notify assistant, optionally trigger rollback.
    This is a public helper so tests can call it directly.
    """
    app = payload.get('application', {}).get('metadata', {}).get('name') or payload.get('application', {}).get('name')
    status = payload.get('application', {}).get('status', {})
    op_state = payload.get('operationState') or status.get('operationState')
    health = status.get('health', {}).get('status') if status.get('health') else None
    sync = status.get('sync', {}).get('status') if status.get('sync') else None

    message = f"📣 ArgoCD Webhook — app: {app if app else 'unknown'}\n"
    if sync:
        message += f"• Sync: {sync}\n"
    if health:
        message += f"• Health: {health}\n"
    if op_state and isinstance(op_state, dict):
        phase = op_state.get('phase')
        if phase:
            message += f"• Phase: {phase}\n"

    # Send notification to default chat if configured
    chat = assistant.default_chat_id or assistant.requesting_user_id
    if chat:
        await assistant._send_telegram_message(chat, message)

    # If unhealthy and configured for auto rollback (use assistant toggle if present)
    auto_rb = getattr(assistant, 'auto_rollback_on_degrade', None)
    if auto_rb is None:
        auto_rb = os.getenv('AUTO_ROLLBACK_ON_DEGRADE', 'false').lower() in ('1', 'true', 'yes')
    if auto_rb and app and health and health.lower() != 'healthy':
        await assistant._send_telegram_message(chat, f"⚠️ App {app} unhealthy; attempting rollback...")
        server, token = assistant._get_argocd_credentials('nvidia')
        ok, res = await assistant._call_argocd_api(server, token, 'POST', f'/applications/{app}/rollback', json_payload={"revision": "previous"})
        if ok:
            await assistant._send_telegram_message(chat, f"✅ Rollback requested for {app}")
        else:
            await assistant._send_telegram_message(chat, f"❌ Rollback failed for {app}: {res}")
