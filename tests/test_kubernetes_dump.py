import os
import tempfile
import subprocess
import pytest

from app.services.telegram_assistant import TelegramAssistant


def test_k8s_script_exists():
    script = os.path.join(os.getcwd(), 'scripts', 'k8s_cluster_dump.sh')
    assert os.path.exists(script)
    # we may not need execute bit, but ensure it can be invoked with bash
    res = subprocess.run(['bash', script, '--output-dir', '/tmp'], capture_output=True, text=True)
    assert res.returncode == 0


@pytest.mark.asyncio
async def test_k8s_dump_command(monkeypatch, tmp_path):
    ta = TelegramAssistant(token='fake')
    ta.authorized_users = [1234]
    ta.requesting_user_id = 1234

    # prepare a fake dump file - the script would print its path
    fake_file = tmp_path / 'k8s-dump.log'
    fake_file.write_text('CLUSTER_DUMP_LINE\nsecret: hidden')

    class DummyCompleted:
        def __init__(self, returncode=0, stdout=''): 
            self.returncode = returncode
            self.stdout = stdout
            self.stderr = ''

    def fake_run(cmd, capture_output=True, text=True, timeout=300):
        # emulate the bash script output: file path then size line
        return DummyCompleted(0, f"{str(fake_file)}\n123K {str(fake_file)}\n")

    monkeypatch.setattr('subprocess.run', fake_run)
    res = await ta._cmd_k8s_dump('')
    assert 'Kubernetes cluster dump' in res or 'k8s' in res.lower()
    assert str(fake_file) in res


@pytest.mark.asyncio
async def test_k8s_dump_unauthorized(monkeypatch):
    ta = TelegramAssistant(token='fake')
    ta.authorized_users = []
    ta.requesting_user_id = 9999
    res = await ta._cmd_k8s_dump('')
    assert 'Тільки авторизовані' in res or 'не авторизовані' in res
