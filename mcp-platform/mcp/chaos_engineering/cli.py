"""CLI для хаос-тестів."""
from __future__ import annotations

import typer

app = typer.Typer(help="Chaos Engineering: Litmus")


@app.command("run")
def run(experiment: str = typer.Argument("smoke", help="Назва експерименту")) -> None:
    typer.echo(f"[CHAOS] Запуск експерименту: {experiment} (заглушка)")


@app.command("report")
def report() -> None:
    typer.echo("[CHAOS] Звіт: підключіть LitmusChaos")
