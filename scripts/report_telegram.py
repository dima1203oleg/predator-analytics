from __future__ import annotations

import os
import subprocess
import time
import urllib.parse
import urllib.request
from pathlib import Path

ADMIN_ID = os.getenv("TELEGRAM_ADMIN_ID", "1020504147")
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
DEPLOY_KEY = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICM36ucGJ5XcZNB1USfIOnQfn+0EnWjq9Ob0WyHCvKf+ predator-nvidia-deploy"
LOG_PATH = Path("/tmp/predator-zrok-ssh.log")


def run(command: list[str]) -> str:
    try:
        result = subprocess.run(command, check=False, text=True, capture_output=True, timeout=20)
        return (result.stdout + result.stderr).strip()
    except Exception as exc:
        return str(exc)


def ensure_key() -> str:
    ssh_dir = Path.home() / ".ssh"
    ssh_dir.mkdir(mode=0o700, exist_ok=True)
    authorized_keys = ssh_dir / "authorized_keys"
    current = authorized_keys.read_text() if authorized_keys.exists() else ""
    if DEPLOY_KEY not in current:
        authorized_keys.write_text(current.rstrip() + "\n" + DEPLOY_KEY + "\n")
        authorized_keys.chmod(0o600)
        return "додано"
    return "вже існує"


def start_zrok() -> str:
    if not Path("/usr/local/bin/zrok").exists() and not run(["bash", "-lc", "command -v zrok"]):
        return "zrok не знайдено"
    run(["bash", "-lc", "pkill -f 'zrok.*share.*127.0.0.1:22' || true"])
    command = "nohup zrok share private 127.0.0.1:22 --backend-mode tcpTunnel > /tmp/predator-zrok-ssh.log 2>&1 &"
    run(["bash", "-lc", command])
    time.sleep(6)
    if LOG_PATH.exists():
        return LOG_PATH.read_text(errors="ignore")[-1200:]
    return "zrok запущено, лог ще не створено"


def send_telegram(text: str) -> None:
    if not BOT_TOKEN:
        return
    data = urllib.parse.urlencode({"chat_id": ADMIN_ID, "text": text, "parse_mode": "Markdown"}).encode()
    req = urllib.request.Request(f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage", data=data)
    try:
        urllib.request.urlopen(req, timeout=15).read()
    except Exception:
        pass


def main() -> None:
    key_status = ensure_key()
    zrok_output = start_zrok()
    hostname = run(["hostname"])
    user = run(["whoami"])
    message = f"""🦅 *PREDATOR NVIDIA RECOVERY*

✅ Сервер: `{hostname}`
✅ Користувач: `{user}`
✅ SSH deploy key: `{key_status}`

*zrok SSH log:*
```text
{zrok_output[:1200]}
```

Якщо бачиш код `zrok access private XXXXX`, на MacBook виконай:
```bash
zrok access private XXXXX
```
Потім підключайся через локальний порт, який покаже zrok.
"""
    print(message)
    send_telegram(message)


if __name__ == "__main__":
    main()
