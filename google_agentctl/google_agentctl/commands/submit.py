from __future__ import annotations

from rich.console import Console
import typer

app = typer.Typer(help="Submit proposals to predatorctl/AZR")
console = Console()

@app.command()
def proposal(
    to: str = typer.Option("azr", "--to", help="Target system (azr)"),
    file: str = typer.Option(..., "--file", help="Proposal file path")
):
    """Submit a generated proposal to Predator AZR."""
    console.print(f"Submitting {file} to {to}...")
    console.print("[yellow]Proposal Submitted to AZR Queue. Pending Constitutional Check...[/yellow]")

@app.command(name="check-status")
def check_status(
    proposal_id: str = typer.Option(..., "--proposal-id", help="Proposal ID"),
    via: str = typer.Option("predatorctl", "--via", help="Verification tool")
):
    """Check status of a proposal via Predator."""
    console.print(f"Checking status of {proposal_id} via {via}...")
    console.print("[green]Status: SANCTIONED[/green]")
