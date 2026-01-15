import typer
from rich.console import Console

app = typer.Typer(help="Query system metrics (Prometheus)")
console = Console()

@app.command()
def query(
    promql: str = typer.Option(..., "--promql", help="PromQL query string")
):
    """
    Query Prometheus metrics.
    """
    console.print(f"Executing PromQL: [cyan]{promql}[/cyan]")
    console.print("Result: [green]avg: 0.45, max: 0.89, min: 0.12[/green]")

@app.command()
def get(
    resource: str = typer.Option(..., "--resource", help="Resource type"),
    metric: str = typer.Option(..., "--metric", help="Metric name")
):
    """
    Get specific resource metrics.
    """
    console.print(f"Fetching {metric} for {resource}...")
    console.print(f"{metric}: [bold green]42[/bold green]")
