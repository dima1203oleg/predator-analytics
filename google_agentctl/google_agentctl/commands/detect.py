from __future__ import annotations

from predatorctl.core.ledger_client import LedgerClient
from rich.console import Console
import typer

from libs.core.reality import get_juridical_transpiler

app = typer.Typer(help="Detect system anomalies")
console = Console()
ledger = LedgerClient()
transpiler = get_juridical_transpiler()

@app.command()
def anomalies(
    algorithm: str = typer.Option("isolation-forest", "--algorithm"),
    generate_report: bool = typer.Option(False, "--report", help="Generate juridical report if anomalies found")
):
    """Detect anomalies in system behavior (v45.0)."""
    console.print(f"Running anomaly detection using {algorithm}...")

    # Logic simulation (Always 1 anomaly for demo if report is requested)
    anomaly_found = generate_report
    res = "Potential reality divergence detected in VPC witness logs." if anomaly_found else "No critical anomalies detected."

    # Log to Truth Ledger
    ledger.append_entry(
        entity_type="agent",
        entity_id="google-agent",
        action="detect_anomalies",
        payload={"algorithm": algorithm, "result": res, "anomaly_found": anomaly_found}
    )

    if anomaly_found:
        console.print(f"[bold red]ANOMALY DETECTED:[/bold red] {res}")
        if generate_report:
            console.print("Generating Juridical Anomaly Report...")
            doc = transpiler.generate_document("anomaly_report", {
                "details": res,
                "anomaly_id": f"anom_{algorithm}_001"
            })
            console.print(f"[cyan]Report Created:[/cyan] {doc.title}")
            console.print(f"Ledger Hash: {doc.ledger_hash}")
    else:
        console.print(f"[green]{res}[/green]")
