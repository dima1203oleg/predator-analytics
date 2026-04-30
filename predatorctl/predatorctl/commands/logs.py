from __future__ import annotations

from rich.console import Console
import typer

app = typer.Typer(help="Search system logs (Loki)")
console = Console()

@app.command()
def search(
    loki: str = typer.Option(..., "--loki", help="Loki query filter")
):
    """Search logs using Loki filters."""
    console.print(f"Searching Loki with filter: [cyan]{loki}[/cyan]")
    console.print("[dim]2026-01-12 18:30:01 [INFO] Service started[/dim]")
    console.print("[dim]2026-01-12 18:30:05 [DEBUG] Connection established[/dim]")

@app.command()
def tail(
    app_name: str = typer.Option(..., "--app", help="Application name"),
    lines: int = typer.Option(10, "--lines", help="Number of lines")
):
    """Tail live logs."""
    console.print(f"Tailing last {lines} lines for {app_name}...")
    console.print(f"[green]Log stream active for {app_name}...[/green]")
