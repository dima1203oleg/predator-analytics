import os
import pytest
import subprocess
from app.services.telegram_assistant import TelegramAssistant


@pytest.mark.asyncio
async def test_k8s_dump_unauthorized(monkeypatch):
    ta = TelegramAssistant(token='fake')
    ta.authorized_users = []
    ta.requesting_user_id = 111
    res = await ta._cmd_k8s_dump('')
    assert 'не авторизован' in res.lower() or 'не авторизовані' in res.lower()


@pytest.mark.asyncio
async def test_k8s_dump_success(monkeypatch, tmp_path):
    ta = TelegramAssistant(token='fake')
    ta.authorized_users = [111]
    ta.requesting_user_id = 111

    # Create a fake tarball and simulate script output
    tar = tmp_path / 'k8s.tar.gz'
    tar.write_text('dummy')
    fake_stdout = 'Compressing to: /tmp/k8s-dump-123456.tar.gz\n0.5M /tmp/k8s-dump-123456.tar.gz\n/tmp/k8s-dump-123456.tar.gz\n'

    class FakeProc:
        def __init__(self):
            self.returncode = 0
            self.stdout = fake_stdout
            self.stderr = ''

    def fake_run(cmd, capture_output, text, timeout):
        return FakeProc()

    monkeypatch.setattr(subprocess, 'run', fake_run)

    res = await ta._cmd_k8s_dump('')
    assert 'k8s-dump' in res or 'kubernetes cluster dump' in res.lower()
