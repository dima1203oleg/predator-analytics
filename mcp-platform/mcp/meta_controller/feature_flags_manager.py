"""Управління фічфлагами: Unleash (заглушка)."""
from __future__ import annotations

import subprocess


def enable(flag: str, env: str = "dev") -> None:
    print(f"[FLAGS] Увімкнення {flag} для {env}")
    subprocess.run(["echo", f"[FLAGS] unleash-cli enable {flag} -e {env}"], check=False)


def disable(flag: str, env: str = "dev") -> None:
    print(f"[FLAGS] Вимкнення {flag} для {env}")
    subprocess.run(["echo", f"[FLAGS] unleash-cli disable {flag} -e {env}"], check=False)
