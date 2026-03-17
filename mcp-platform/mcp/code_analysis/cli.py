"""CLI для аналізу коду: Tree-sitter, Semgrep, SonarQube (заглушки)."""
from __future__ import annotations

import typer

app = typer.Typer(help="Кодовий аналіз: AST, статичний аналіз, якість")


@app.command("scan")
def scan(path: str = typer.Argument(".", help="Шлях до репозиторію/модуля")) -> None:
    """Запустити аналіз (заглушка)."""
    typer.echo(f"[ANALYZE] Скануємо шлях: {path}")


@app.command("report")
def report() -> None:
    """Показати звіт (заглушка)."""
    typer.echo("[ANALYZE] Звіт: інтегруйте Semgrep/SonarQube")
