"""Інтеграція з GitHub Actions (заглушка)."""
from __future__ import annotations

import subprocess


def trigger_workflow(name: str, inputs: dict[str, str] | None = None) -> None:
    print(f"[GHA] Тригер воркфлоу {name} з вхідними: {inputs}")
    cmd = ["echo", f"[GHA] Запуск {name}"]
    subprocess.run(cmd, check=False)
