"""CLI для AI-шару (OpenHands/AutoGen). Усі повідомлення українською."""
from __future__ import annotations

import os
import shutil
import subprocess
from typing import List

import typer

app = typer.Typer(help="AI шар: генерація, оркестрація через OpenHands/AutoGen")


def _openhands_cmd(subcommand: List[str]) -> None:
    binary = os.getenv("OPENHANDS_CLI", "openhands")
    model = os.getenv("OPENHANDS_MODEL", "codellama/CodeLlama-7b-Instruct-hf")
    api_base = os.getenv("OPENHANDS_API_BASE", "http://litellm:4000/v1")
    api_key = os.getenv("OPENHANDS_API_KEY")

    if shutil.which(binary) is None:
        typer.echo(f"[AI] Не знайдено CLI '{binary}'. Встановіть OpenHands або задайте OPENHANDS_CLI.")
        raise typer.Exit(code=1)

    cmd = [binary] + subcommand
    if model:
        cmd.extend(["--model", model])
    if api_base:
        cmd.extend(["--api-base", api_base])
    if api_key:
        cmd.extend(["--api-key", api_key])

    typer.echo(f"[AI] Виконую: {' '.join(cmd)}")
    try:
        subprocess.run(cmd, check=True)
    except subprocess.CalledProcessError as err:
        typer.echo(f"[AI] Помилка виконання OpenHands CLI: {err}")
        raise typer.Exit(code=1)


@app.command("run")
def run(task: str = typer.Argument(..., help="Опис завдання для OpenHands/AutoGen")) -> None:
    """Запустити мультиагентну сесію генерації коду через OpenHands CLI."""
    _openhands_cmd(["run", "--task", task])


@app.command("status")
def status() -> None:
    """Показати стан OpenHands/оркестрації (health)."""
    _openhands_cmd(["status"])


@app.command("plan")
def plan(task: str = typer.Argument("опис завдання", help="Завдання для планування")) -> None:
    """Згенерувати план дій агентів (OpenHands plan або еквівалентний режим)."""
    # Деякі білди OpenHands підтримують subcommand plan; якщо ні — використати run з опцією plan.
    _openhands_cmd(["plan", "--task", task])
