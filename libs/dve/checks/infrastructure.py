# libs/dve/checks/infrastructure.py
"""Перевірка інфраструктурних інструментів (docker, kubectl, helm, vault, keycloak)."""
import subprocess
import json
from typing import Dict

def _run_cmd(cmd: str) -> str:
    """Виконує команду в shell та повертає stdout.
    Якщо команда завершується помилкою – повертає порожній рядок.
    """
    try:
        result = subprocess.check_output(cmd, shell=True, text=True, stderr=subprocess.DEVNULL)
        return result.strip()
    except Exception:
        return ""

def check_infrastructure() -> Dict[str, str]:
    """Повертає словник з результатами базових інструментів.
    При успішному виконанні – значення "OK", інакше – "FAIL".
    """
    checks = {
        "docker": "OK" if _run_cmd("docker version") else "FAIL",
        "kubectl": "OK" if _run_cmd("kubectl version --short") else "FAIL",
        "helm": "OK" if _run_cmd("helm version") else "FAIL",
        "vault": "OK" if _run_cmd("vault status") else "FAIL",
        "keycloak": "OK" if _run_cmd("curl -sSf http://localhost:8080/auth/realms/master") else "FAIL",
    }
    return checks
