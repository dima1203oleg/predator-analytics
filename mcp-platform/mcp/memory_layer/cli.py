"""CLI для шару пам’яті: Neo4j/Qdrant. Українська локалізація."""
from __future__ import annotations

import typer

app = typer.Typer(help="Пам’ять: граф залежностей + семантичний контекст")


@app.command("query")
def query(node: str = typer.Argument(..., help="ID або мітка вузла/контексту")) -> None:
    """Запит стану у Neo4j/Qdrant (заглушка)."""
    typer.echo(f"[MEMORY] Запит до графа/векторів для: {node}")


@app.command("update")
def update(node: str = typer.Argument(..., help="ID або мітка вузла"), payload: str = typer.Option("{}", help="JSON дані")) -> None:
    """Оновити запис у пам’яті (заглушка)."""
    typer.echo(f"[MEMORY] Оновлення {node} даними: {payload}")
