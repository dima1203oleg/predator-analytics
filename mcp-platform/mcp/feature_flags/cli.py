"""CLI для фічфлагів Unleash."""
from __future__ import annotations

import typer

app = typer.Typer(help="Фічфлаги")


@app.command("enable")
def enable(flag: str = typer.Argument(..., help="Назва фічфлага")) -> None:
    typer.echo(f"[FLAGS] Увімкнено: {flag} (заглушка)")


@app.command("disable")
def disable(flag: str = typer.Argument(..., help="Назва фічфлага")) -> None:
    typer.echo(f"[FLAGS] Вимкнено: {flag} (заглушка)")
