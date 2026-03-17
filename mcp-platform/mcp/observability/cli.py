"""CLI для моніторингу та логів."""
from __future__ import annotations

import typer

app = typer.Typer(help="Спостереження: метрики та логи")


@app.command("status")
def status() -> None:
    typer.echo("[MONITOR] Статус: підключіть Prometheus/Grafana")


@app.command("logs")
def logs(service: str = typer.Argument("all", help="Сервіс")) -> None:
    typer.echo(f"[MONITOR] Логи для: {service} (заглушка Loki)")


@app.command("alerts")
def alerts() -> None:
    typer.echo("[MONITOR] Алерти: заглушка, інтегруйте Alertmanager/Sentry")
