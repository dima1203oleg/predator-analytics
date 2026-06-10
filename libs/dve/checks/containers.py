# libs/dve/checks/containers.py
"""Модуль перевірки Docker/Kubernetes контейнерів для DVE.

Надає функцію `check_containers` з базовою логікою.
"""

import os
import subprocess
from typing import Dict

def _run_cmd(cmd: str) -> str:
    try:
        return subprocess.check_output(cmd, shell=True, text=True, stderr=subprocess.DEVNULL).strip()
    except Exception:
        return ""

def check_containers() -> Dict[str, any]:
    """Перевіряє, чи запущені очікувані контейнери.

    Очікувані назви беруться з змінної середовища `DVE_EXPECTED_CONTAINERS`
    (comma‑separated). Повертає словник з результатами.
    """
    expected = set(os.getenv("DVE_EXPECTED_CONTAINERS", "").split(",")) if os.getenv("DVE_EXPECTED_CONTAINERS") else set()
    if not expected:
        return {"status": "no_expected", "message": "Не вказані очікувані контейнери"}
    output = _run_cmd("docker ps --format '{{.Names}}'")
    running = set(output.split("\n")) if output else set()
    missing = expected - running
    return {
        "expected": list(expected),
        "running": list(running),
        "missing": list(missing),
        "status": "ok" if not missing else "error",
    }
