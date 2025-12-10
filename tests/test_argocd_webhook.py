import os
import pytest
from fastapi.testclient import TestClient
from app.main import app as fastapi_app

from app.services.telegram_assistant import get_assistant, init_assistant
from app.api.routers.argocd_webhook import process_argocd_event


def test_argocd_webhook_trigger_rollback(monkeypatch, tmp_path):
    # Setup a fake assistant
    # Ensure env toggles and ArgoCD credentials are in place before assistant init
    monkeypatch.setenv('AUTO_ROLLBACK_ON_DEGRADE', 'true')
    monkeypatch.setenv('ARGOCD_NVIDIA_URL', 'https://argocd-nvidia.example.com')
    monkeypatch.setenv('ARGOCD_NVIDIA_TOKEN', 'fake-token')
    init_assistant("fake-token")
    bot = get_assistant()
    bot.default_chat_id = 12345

    # Monkeypatch helper methods
    called = {"sent": [], "rollback": False}

    async def fake_send(chat_id, text):
        called["sent"].append((chat_id, text))
        return True

    async def fake_call_argocd_api(server, token, method, path="", json_payload=None):
        # Simulate rollback success
        if method == 'POST' and 'rollback' in path:
            called["rollback"] = True
            return True, {"status": "ok"}
        return True, {"status": "ok"}

    monkeypatch.setattr(bot, "_send_telegram_message", fake_send)
    monkeypatch.setattr(bot, "_call_argocd_api", fake_call_argocd_api)

    # Set env to enable auto rollback
    monkeypatch.setenv('AUTO_ROLLBACK_ON_DEGRADE', 'true')

    payload = {
        "application": {
            "metadata": {"name": "predator-nvidia"},
            "status": {
                "health": {"status": "Degraded"},
                "sync": {"status": "Synced"}
            }
        }
    }
    # Directly call the helper and assert rollback was attempted
    import asyncio
    asyncio.get_event_loop().run_until_complete(process_argocd_event(payload, bot))
    # Check that rollback was recorded by our fake call
    assert called['rollback'] is True
