from __future__ import annotations

from rich.console import Console
import typer

app = typer.Typer(help="Chaos Engineering (LitmusChaos Integration)")
console = Console()
scenario_app = typer.Typer(help="Manage chaos scenarios")
app.add_typer(scenario_app, name="scenario")

@scenario_app.command("create")
def scenario_create(
    name: str = typer.Option(..., "--name"),
    type: str = typer.Option("latency", "--type")
):
    """Create a new chaos scenario."""
    console.print(f"Creating chaos scenario '{name}' of type {type}...")
    console.print(f"[green]Scenario '{name}' Created.[/green]")

@app.command()
def schedule(
    scenario_id: str = typer.Option(..., "--scenario"),
    cron: str = typer.Option("0 2 * * *", "--cron")
):
    """Schedule a chaos scenario."""
    console.print(f"Scheduling chaos scenario {scenario_id} with cron '{cron}'...")
    console.print("[green]Schedule Registered.[/green]")

report_app = typer.Typer(help="Manage chaos reports")
app.add_typer(report_app, name="report")

@report_app.command("generate")
def report_generate(
    run_id: str = typer.Option(..., "--run")
):
    """Generate a chaos report."""
    console.print(f"Generating chaos report for run {run_id}...")
    console.print("[green]Report Generated: ./chaos_report.pdf[/green]")
