"""CLI для тестів: PyTest, Jest, Cypress."""
from __future__ import annotations

import typer

app = typer.Typer(help="Тести: backend/frontend/e2e")


@app.command("run")
def run() -> None:
    typer.echo("[TEST] Запуск тестів (PyTest/Jest/Cypress) — заглушка")


@app.command("report")
def report() -> None:
    typer.echo("[TEST] Звіт: підключіть генерацію репортів")
