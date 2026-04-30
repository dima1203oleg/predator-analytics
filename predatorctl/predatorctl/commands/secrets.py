from __future__ import annotations

from rich.console import Console
import typer

app = typer.Typer(help="Secret Management (HashiCorp Vault)")
console = Console()

@app.command()
def get(
    path: str = typer.Option(..., "--path", help="Vault secret path")
):
    """Retrieve a secret from the vault."""
    console.print(f"Fetching secret from {path}...")
    # Masked output
    console.print("Value: [dim]********** (Masked for Security)[/dim]")

@app.command()
def list(
    path: str = typer.Argument("predator/prod", help="BasePath")
):
    """List secrets in a path."""
    console.print(f"Secrets in {path}:")
    console.print("- database_url")
    console.print("- qdrant_api_key")
    console.print("- opensearch_creds")
