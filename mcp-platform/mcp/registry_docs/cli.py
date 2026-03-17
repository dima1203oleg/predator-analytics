"""CLI для реєстру та документації."""
from __future__ import annotations

import typer

app = typer.Typer(help="Реєстр сервісів / документація")


@app.command("update")
def update() -> None:
    typer.echo("[DOCS] Оновлення реєстру/доків (Backstage/MkDocs) — заглушка")


@app.command("serve")
def serve() -> None:
    typer.echo("[DOCS] Локальний сервер документів — заглушка")
