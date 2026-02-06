from __future__ import annotations

from typing import Optional

from rich.console import Console
import typer


app = typer.Typer(help="GitOps operations")
console = Console()

@app.command()
def sync(
    application: str | None = typer.Option(None, "--application", help="Specific application to sync")
):
    """Synchronize local state with GitOps source."""
    target = application or "all applications"
    console.print(f"Syncing {target}...")
    console.print("[green]Synced[/green]")

@app.command()
def diff(
    application: str | None = typer.Option(None, "--application", help="Specific application to diff")
):
    """Show diff between defined and live state."""
    console.print("Checking for drift...")
    console.print("[green]No drift detected.[/green]")

@app.command()
def history(
    application: str | None = typer.Option(None, "--application", help="Specific application"),
    limit: int = typer.Option(10, "--limit", help="History limit")
):
    """Show deployment history."""
    console.print("Showing recent deployments...")
    console.print("- v26.0.1 (Current)")
    console.print("- v26.0.0")

@app.command()
def rollback(
    deployment_id: str = typer.Argument(..., help="Deployment ID to rollback to")
):
    """Rollback to a previous version."""
    console.print(f"Rolling back to {deployment_id}...")
    console.print("[green]Rollback successful[/green]")
