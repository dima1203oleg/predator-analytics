"""CLI для безпеки: Vault/OPA/сканери."""
from __future__ import annotations

import typer

app = typer.Typer(help="Безпека: Vault, OPA, скани")


@app.command("secrets")
def secrets_get(key: str = typer.Argument(..., help="Ключ секрету")) -> None:
    typer.echo(f"[SEC] Отримати секрет: {key} (заглушка, використовуйте Vault)")


@app.command("policy")
def policy_check() -> None:
    typer.echo("[SEC] Політики OPA: заглушка, підключіть OPA")
