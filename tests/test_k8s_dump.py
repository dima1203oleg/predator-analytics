from __future__ import annotations

import pytest

from app.services.telegram_assistant import TelegramAssistant


@pytest.mark.asyncio
async def test_k8s_dump_unauthorized(monkeypatch):
    ta = TelegramAssistant(token="fake")
    ta.authorized_users = []
    ta.requesting_user_id = 111
    res = await ta._cmd_k8s_dump("")
    assert "не авторизован" in res.lower() or "не авторизовані" in res.lower()


@pytest.mark.asyncio
async def test_k8s_dump_success(monkeypatch, tmp_path):
    ta = TelegramAssistant(token="fake")
    ta.authorized_users = [111]

    # Mock user authorization check since _is_requesting_user_authorized works differently
    monkeypatch.setattr(ta, "_is_requesting_user_authorized", lambda: True)

    # Create a fake tarball and simulate script output
    tar = tmp_path / "k8s.tar.gz"
    tar.write_text("dummy")
    fake_stdout = "Compressing to: /tmp/k8s-dump-123456.tar.gz\n0.5M /tmp/k8s-dump-123456.tar.gz\n/tmp/k8s-dump-123456.tar.gz\n"

    class FakeProc:
        def __init__(self, returncode=0, stdout=""):
            self.returncode = returncode
            self.stdout = stdout
            self.stderr = ""

    def fake_run(cmd, check=False, capture_output=True, text=True, timeout=300):
        return FakeProc(returncode=0, stdout=fake_stdout)

    monkeypatch.setattr("subprocess.run", fake_run)

    res = await ta._cmd_k8s_dump("")
    assert "k8s-dump" in res or "kubernetes cluster dump" in res.lower()
