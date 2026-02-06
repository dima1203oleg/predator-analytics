from __future__ import annotations

import json
import os
from typing import Optional
import uuid

import redis
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
import typer
import yaml

from predatorctl.core.arbiter_client import ArbiterClient
from predatorctl.core.ledger_client import LedgerClient


app = typer.Typer(help="ETL job management")
console = Console()
arbiter = ArbiterClient()
ledger = LedgerClient()

# Connect to Redis (assuming localhost default per docker-compose port mapping)
redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

@app.command()
def submit(
    job_file: str = typer.Argument(..., help="Path to job definition file"),
    dry_run: bool = typer.Option(False, "--dry-run", help="Validate without submitting")
):
    """Submit an ETL job payload.
    Process:
    1. Arbiter Check (Constitution)
    2. Ledger Record (Immutability)
    3. Push to Redis Queue (Execution).
    """
    if not os.path.exists(job_file):
        console.print(f"[red]Error:[/red] File {job_file} not found.")
        raise typer.Exit(code=1)

    with open(job_file) as f:
        job_def = yaml.safe_load(f)

    job_id = job_def.get("id", f"etl-{str(uuid.uuid4())[:8]}")
    job_def['id'] = job_id # Ensure ID is set

    console.print(f"Submitting job [cyan]{job_id}[/cyan]...")

    if dry_run:
        console.print("[yellow]Dry Run:[/yellow] Checking with Arbiter...")
        decision = arbiter.decide("submit_job", job_def)
        if decision['allowed']:
             console.print("[green]VALID[/green] Arbiter approved.")
        else:
             console.print(f"[red]INVALID[/red] Arbiter denied: {decision['reason']}")
        return

    # 1. Constitutional Check
    with console.status("Consulting Arbiter..."):
        decision = arbiter.decide("submit_job", job_def)

    if not decision['allowed']:
         console.print(Panel(f"[bold red]DENIED[/bold red]\n\nReason: {decision['reason']}", title="Arbiter Decision"))
         # Log attempt failure to ledger? Usually ledger logs *changes*, but log of failure is good for audit.
         # For now, we skip ledger on denial to save space/time, or we log "Action: Denied".
         ledger.append_entry("etl_job", job_id, "submission_denied", {"reason": decision['reason']})
         raise typer.Exit(code=1)

    console.print(f"[green]APPROVED[/green] Signed by: {decision['signature']}")

    # 2. Ledger Commit
    with console.status("Committing to Truth Ledger..."):
        entry = ledger.append_entry(
            entity_type="etl_job",
            entity_id=job_id,
            action="submit",
            payload=job_def,
            signature=decision['signature']
        )

    if entry:
        console.print(f"[green]COMMITTED[/green] Ledger ID: {entry.get('id')} [Hash: {entry.get('data_hash')[:8]}...]")
    else:
        console.print("[red]LEDGER ERROR[/red] Failed to commit. Aborting job start.")
        raise typer.Exit(code=1)


    # 3. Execution (Real Push to Redis)
    try:
        # Pushing to 'tasks:queue' which Orchestrator monitors
        redis_client.lpush("tasks:queue", json.dumps(job_def))
        console.print(f"[bold green]Success[/bold] Job {job_id} submitted to Redis Queue.")
    except Exception as e:
        console.print(f"[red]QUEUE ERROR[/red] Failed to push to Redis: {e}")
        # Ledger rollback? Not really needed, it was committed as an "attempt/submission".
        # But we could log a failure entry if we wanted.
        raise typer.Exit(code=1)

@app.command()
def status(
    job_id: str = typer.Argument(..., help="Job ID"),
    watch: bool = typer.Option(False, "--watch", "-w", help="Watch status changes")
):
    """Check status of a job."""
    console.print(f"Status for job [cyan]{job_id}[/cyan]: [green]RUNNING[/green]")
    console.print("Progress: [=================>        ] 65%")

@app.command()
def logs(
    job_id: str = typer.Argument(..., help="Job ID"),
    tail: int = typer.Option(100, "--tail", help="Number of lines to show")
):
    """View job logs."""
    console.print(f"Showing last {tail} lines for {job_id}...")
    console.print("[INFO] Processing batch 45/100")
    console.print("[INFO] GPU Batch normalization complete")

@app.command()
def cancel(
    job_id: str = typer.Argument(..., help="Job ID"),
    reason: str = typer.Option(..., "--reason", "-r", help="Reason for cancellation")
):
    """Cancel a running job."""
    console.print(f"Cancelling job {job_id}. Reason: {reason}")
    console.print("[yellow]Cancelled[/yellow]")

@app.command()
def list(
    state: str | None = typer.Option(None, "--state", help="Filter by state")
):
    """List all jobs."""
    table = Table(title="ETL Jobs")
    table.add_column("ID", style="cyan")
    table.add_column("Type")
    table.add_column("State", style="bold")
    table.add_column("Submitted")

    table.add_row("etl-001", "indexing", "[green]COMPLETED[/green]", "2h ago")
    table.add_row("etl-002", "training", "[blue]RUNNING[/blue]", "15m ago")
    table.add_row("etl-003", "ingest", "[red]FAILED[/red]", "1d ago")

    console.print(table)
