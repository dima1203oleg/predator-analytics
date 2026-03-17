"""Моніторинг: Prometheus/Loki/Sentry (заглушка)."""
from __future__ import annotations

import subprocess


def prometheus_query(query: str) -> str:
    print(f"[MONITOR] Prometheus запит: {query}")
    return "mock_result"


def loki_logs(service: str) -> str:
    print(f"[MONITOR] Loki логи для {service}")
    return "mock_logs"


def sentry_alert(message: str) -> None:
    print(f"[MONITOR] Sentry алерт: {message}")
    subprocess.run(["echo", f"[MONITOR] sentry-cli send-event '{message}'"], check=False)
