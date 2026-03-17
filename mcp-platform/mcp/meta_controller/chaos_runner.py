"""Запуск хаос-тестів: LitmusChaos (заглушка)."""
from __future__ import annotations

import subprocess


def run_experiment(name: str, namespace: str = "default") -> None:
    print(f"[CHAOS] Запуск експерименту {name} в {namespace}")
    subprocess.run(["echo", f"[CHAOS] kubectl apply -f chaos/{name}.yaml -n {namespace}"], check=False)


def get_report(experiment: str) -> str:
    print(f"[CHAOS] Звіт для {experiment}")
    return "mock_report"
