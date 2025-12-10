import pytest
import os
from app.services.telegram_assistant import TelegramAssistant


@pytest.mark.asyncio
async def test_auto_rollback_toggle():
    ta = TelegramAssistant(token='fake')
    ta.requesting_user_id = 111
    ta.authorized_users = [111]

    resp = await ta._cmd_auto_rollback('status')
    assert 'AUTO_ROLLBACK_ON_DEGRADE' in resp or 'AUTO_ROLLBACK_ON_DEGRADE' in resp

    resp_on = await ta._cmd_auto_rollback('on')
    assert 'встановлено у: true' in resp_on

    resp_off = await ta._cmd_auto_rollback('off')
    assert 'встановлено у: false' in resp_off


@pytest.mark.asyncio
async def test_auto_rollback_persistence(tmp_path, monkeypatch):
    state_file = tmp_path / 'state.json'
    monkeypatch.setenv('PREDATOR_TELEGRAM_STATE', str(state_file))

    ta = TelegramAssistant(token='fake')
    ta.authorized_users = [123]
    ta.requesting_user_id = 123

    res = await ta._cmd_auto_rollback('on')
    assert 'встановлено у: true' in res
    assert state_file.exists()
    assert 'auto_rollback_on_degrade' in state_file.read_text()
