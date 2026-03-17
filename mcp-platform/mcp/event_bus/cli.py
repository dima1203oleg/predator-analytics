"""CLI для подій: NATS JetStream."""
from __future__ import annotations

import typer

app = typer.Typer(help="Подієва шина NATS")


@app.command("publish")
def publish(subject: str = typer.Argument(..., help="Тема"), payload: str = typer.Option("{}", help="JSON дані")) -> None:
    typer.echo(f"[EVENTS] Публікуємо у {subject}: {payload}")


@app.command("subscribe")
def subscribe(subject: str = typer.Argument(..., help="Тема")) -> None:
    typer.echo(f"[EVENTS] Підписка на {subject} (заглушка)")
