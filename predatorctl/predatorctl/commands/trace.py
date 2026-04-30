from __future__ import annotations

from rich.console import Console
import typer

app = typer.Typer(help="Analyze system traces (OpenTelemetry / Jaeger)")
console = Console()

@app.command()
def analyze(
    otel: str = typer.Option(..., "--otel", help="Trace ID")
):
    """Analyze an OpenTelemetry trace."""
    console.print(f"Analyzing Trace ID: [cyan]{otel}[/cyan]")
    console.print("Span count: 12")
    console.print("Critical path: [yellow]api-gateway -> orchestrator -> arbiter[/yellow]")
    console.print("Latency: 45ms")

@app.command()
def find(
    service: str = typer.Option(..., "--service"),
    error: bool = typer.Option(False, "--error")
):
    """Find traces for a service."""
    status = "error" if error else "success"
    console.print(f"Finding {status} traces for {service}...")
    console.print("- 0x7b2f... (200 OK)")
    console.print("- 0x9a1d... (200 OK)")
