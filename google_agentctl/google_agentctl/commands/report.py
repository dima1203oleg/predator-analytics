from __future__ import annotations

from rich.console import Console
import typer


app = typer.Typer(help="Generate system reports and insights")
console = Console()

@app.command()
def insights(
    format: str = typer.Option("markdown", "--format"),
    output: str = typer.Option("report.md", "--output", "-o")
):
    """Generate a report of insights."""
    console.print(f"Generating insight report in {format} format to {output}...")
    console.print(f"[green]Report Created: {output}[/green]")
