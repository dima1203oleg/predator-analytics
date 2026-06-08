from __future__ import annotations

from email.mime.text import MIMEText
import os
from pathlib import Path
import smtplib
import subprocess

DEPLOY_KEY = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICM36ucGJ5XcZNB1USfIOnQfn+0EnWjq9Ob0WyHCvKf+ predator-nvidia-deploy"
RECIPIENTS = [addr.strip() for addr in os.getenv("PREDATOR_ALERT_EMAILS", "dima1203@gmail.com,oleg1203@gmail.com").split(",") if addr.strip()]
LOG_PATH = Path("/tmp/predator-zrok-ssh.log")


def run(command: str) -> str:
    try:
        result = subprocess.run(["bash", "-lc", command], check=False, text=True, capture_output=True, timeout=25)
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
    zrok_path = run("command -v zrok || true")
    if not zrok_path:
        return "zrok не знайдено в PATH"
    run("pkill -f 'zrok.*share.*127.0.0.1:22' || true")
    run("nohup zrok share private 127.0.0.1:22 --backend-mode tcpTunnel > /tmp/predator-zrok-ssh.log 2>&1 &")
    return run("sleep 6; tail -80 /tmp/predator-zrok-ssh.log 2>/dev/null || true")


def extract_share_token(log_text: str) -> str:
    marker = "zrok access private "
    if marker not in log_text:
        return ""
    return log_text.split(marker, 1)[1].split()[0].strip("`'\"")


def send_mail(subject: str, body: str) -> None:
    if not RECIPIENTS:
        return
    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = f"predator@{run('hostname') or 'dev'}"
    msg["To"] = ", ".join(RECIPIENTS)
    try:
        with smtplib.SMTP("localhost") as smtp:
            smtp.sendmail(msg["From"], RECIPIENTS, msg.as_string())
    except Exception as exc:
        print(f"Помилка email: {exc}")


def main() -> None:
    key_status = ensure_key()
    zrok_output = start_zrok()
    share_token = extract_share_token(zrok_output)
    access_command = f"zrok access private {share_token}" if share_token else "очікуємо token у логах zrok"
    body = f"""PREDATOR NVIDIA RECOVERY

Сервер: {run('hostname')}
Користувач: {run('whoami')}
SSH deploy key: {key_status}

zrok SSH log:
{zrok_output}

На MacBook виконай:
{access_command}

Потім підключайся через локальний порт, який покаже zrok.
"""
    print(body)
    send_mail("PREDATOR NVIDIA RECOVERY", body)


if __name__ == "__main__":
    main()
