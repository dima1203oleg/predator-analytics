import tempfile
import os
import asyncio
import pytest

from app.services.telegram_assistant import TelegramAssistant, NgrokInfo


@pytest.mark.asyncio
async def test_parse_ngrok_message():
    ta = TelegramAssistant(token="fake")
    sample = """
    🔗 Ngrok URLs
    SSH: tcp://7.tcp.eu.ngrok.io:15102
    HTTP: https://example.ngrok-free.dev
    """
    info = ta.parse_ngrok_message(sample)
    assert isinstance(info, NgrokInfo)
    assert info.ssh_host == "7.tcp.eu.ngrok.io"
    assert info.ssh_port == 15102


@pytest.mark.asyncio
async def test_update_ssh_config(tmp_path):
    ta = TelegramAssistant(token="fake")
    tmpfile = tmp_path / "ssh_config"
    content = """Host dev-ngrok
    HostName old.example.com
    Port 1234
    User root
    IdentityFile ~/.ssh/id_rsa
    StrictHostKeyChecking no
    """
    tmpfile.write_text(content)
    ta.ssh_config_path = str(tmpfile)
    ngrok_info = NgrokInfo(ssh_host="7.tcp.eu.ngrok.io", ssh_port=15102, http_url="https://x", raw_message="x", parsed_at=None)
    ok, message = await ta.update_ssh_config(ngrok_info)
    assert ok
    new_content = tmpfile.read_text()
    assert "HostName 7.tcp.eu.ngrok.io" in new_content
    assert "Port 15102" in new_content


@pytest.mark.asyncio
async def test_auto_deploy_toggle():
    ta = TelegramAssistant(token="fake")
    # ensure default matches env
    orig = ta.auto_deploy_on_up
    # Set requesting user as unauthorized - should fail
    ta.requesting_user_id = 1234
    ta.authorized_users = []
    r = await ta._cmd_auto_deploy('status')
    assert 'AUTO_DEPLOY_ON_UP' in r
    r2 = await ta._cmd_auto_deploy('on')
    # Localized message: 'Only authorized users can change automation settings'
    assert 'Тільки авторизовані' in r2
    # authorize and toggle
    ta.authorized_users = [1234]
    r3 = await ta._cmd_auto_deploy('on')
    assert 'встановлено у: true' in r3
    r4 = await ta._cmd_auto_deploy('off')
    assert 'встановлено у: false' in r4


def test_get_argocd_credentials_env(monkeypatch):
    from app.services.telegram_assistant import TelegramAssistant
    monkeypatch.setenv('ARGOCD_NVIDIA_URL', 'https://argocd-nvidia.example.com')
    monkeypatch.setenv('ARGOCD_NVIDIA_TOKEN', 'fake-token')
    ta = TelegramAssistant(token='fake')
    server, token = ta._get_argocd_credentials('nvidia')
    assert server == 'https://argocd-nvidia.example.com'
    assert token == 'fake-token'


@pytest.mark.asyncio
async def test_auto_deploy_persistence(tmp_path, monkeypatch):
    from app.services.telegram_assistant import TelegramAssistant
    state_file = tmp_path / "state.json"
    monkeypatch.setenv('PREDATOR_TELEGRAM_STATE', str(state_file))
    ta = TelegramAssistant(token='fake')
    ta.authorized_users = [123]
    ta.requesting_user_id = 123
    res = await ta._cmd_auto_deploy('on')
    assert 'встановлено у: true' in res
    # Ensure file persisted
    assert state_file.exists()
    content = state_file.read_text()
    assert 'auto_deploy_on_up' in content


@pytest.mark.asyncio
async def test_argocd_rollback_command(monkeypatch):
    from app.services.telegram_assistant import TelegramAssistant
    # ensure ArgoCD credentials are present for rollback
    monkeypatch.setenv('ARGOCD_NVIDIA_URL', 'https://argocd-nvidia.example.com')
    monkeypatch.setenv('ARGOCD_NVIDIA_TOKEN', 'fake-token')
    ta = TelegramAssistant(token='fake')
    # not authorized
    ta.authorized_users = []
    ta.requesting_user_id = 9999
    r = await ta._cmd_argocd_rollback('predator-nvidia')
    assert 'не авторизовані' in r.lower() or 'не авторизовані' in r

    # authorized and confirm: monkeypatch the call
    ta.authorized_users = [9999]
    called = {'rb': False}

    async def fake_call(server, token, method, path='', json_payload=None):
        if 'rollback' in path:
            called['rb'] = True
            return True, {'status': 'ok'}
        return True, {}

    monkeypatch.setattr(ta, '_call_argocd_api', fake_call)
    r2 = await ta._cmd_argocd_rollback('confirm predator-nvidia')
    assert 'Rollback requested' in r2 or 'rollback requested' in r2
