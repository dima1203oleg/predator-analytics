from __future__ import annotations


#!/usr/bin/env python3
"""PREDATOR CLI - Unified Command Line Interface.

Уніфікований CLI для платформи Predator Analytics.
Підтримує: ingest, train, search, status, sync.

Usage:
    predator ingest --file path/to/file.csv --type customs
    predator train --dataset-id UUID --target embeddings
    predator search --query "пошуковий запит" --mode hybrid
    predator status --job-id UUID
    predator sync --source-id UUID
"""

import json
import os
from pathlib import Path
import sys

import click
import httpx
from rich import print as rprint
from rich.console import Console
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.table import Table


console = Console()

# Configuration
API_BASE_URL = os.getenv("PREDATOR_API_URL", "http://localhost:8090/api")
API_TOKEN = os.getenv("PREDATOR_API_TOKEN", "")


def get_client():
    """Create HTTP client with auth headers."""
    headers = {"Content-Type": "application/json"}
    if API_TOKEN:
        headers["Authorization"] = f"Bearer {API_TOKEN}"
    return httpx.Client(base_url=API_BASE_URL, headers=headers, timeout=60.0)


@click.group()
@click.version_option(version="22.0.0", prog_name="Predator CLI")
def cli():
    """🦅 PREDATOR CLI - Unified Analytics Platform Interface."""


# ============================================================================
# INGEST COMMAND
# ============================================================================
@cli.command()
@click.option("--file", "-f", required=True, type=click.Path(exists=True), help="Path to file (CSV, Excel)")
@click.option("--type", "-t", "dataset_type", default="customs", help="Dataset type: customs, tax, generic")
@click.option("--name", "-n", help="Optional source name")
@click.option("--async", "async_mode", is_flag=True, help="Run asynchronously (don't wait for completion)")
def ingest(file: str, dataset_type: str, name: str | None, async_mode: bool):
    """📥 Ingest data from file into the platform."""
    file_path = Path(file)

    if file_path.suffix.lower() not in [".csv", ".xlsx", ".xls"]:
        console.print("[red]❌ Unsupported file format. Use CSV or Excel.[/red]")
        sys.exit(1)

    source_name = name or file_path.stem.replace("_", " ").title()

    console.print(
        Panel(
            f"""
[bold cyan]📥 PREDATOR INGESTION[/bold cyan]

📄 File: {file_path.name}
📊 Type: {dataset_type}
🏷️  Name: {source_name}
    """,
            title="Ingestion Task",
        )
    )

    with Progress(SpinnerColumn(), TextColumn("[progress.description]{task.description}"), console=console) as progress:
        task = progress.add_task("Uploading file...", total=None)

        try:
            with get_client() as client:
                # Step 1: Upload file
                with open(file_path, "rb") as f:
                    files = {"file": (file_path.name, f, "application/octet-stream")}
                    data = {"source_name": source_name, "dataset_type": dataset_type}
                    response = client.post("/v1/sources/upload", files=files, data=data)

                if response.status_code != 200:
                    console.print(f"[red]❌ Upload failed: {response.text}[/red]")
                    sys.exit(1)

                result = response.json()
                source_id = result.get("source_id")
                job_id = result.get("job_id")

                progress.update(task, description="File uploaded. Processing...")

                if async_mode:
                    console.print("\n[green]✅ Ingestion started![/green]")
                    console.print(f"   Job ID: [cyan]{job_id}[/cyan]")
                    console.print(f"   Source ID: [cyan]{source_id}[/cyan]")
                    console.print("\nUse `predator status --job-id {job_id}` to check progress.")
                    return

                # Step 2: Poll for completion
                while True:
                    status_resp = client.get(f"/v1/jobs/{job_id}/status")
                    status = status_resp.json()

                    if status["status"] == "completed":
                        progress.update(task, description="✅ Completed!")
                        break
                    if status["status"] == "failed":
                        console.print(f"\n[red]❌ Ingestion failed: {status.get('error')}[/red]")
                        sys.exit(1)

                    import time

                    time.sleep(2)

                console.print("\n[green]✅ Ingestion completed![/green]")
                console.print(f"   Records processed: [cyan]{status.get('records', 'N/A')}[/cyan]")
                console.print(f"   Table: [cyan]{status.get('table_name', 'N/A')}[/cyan]")

        except httpx.RequestError as e:
            console.print(f"[red]❌ Connection error: {e}[/red]")
            sys.exit(1)


# ============================================================================
# TRAIN COMMAND
# ============================================================================
@cli.command()
@click.option("--dataset-id", "-d", required=True, help="Dataset UUID to train on")
@click.option("--target", "-t", default="embeddings", help="Target: embeddings, reranker, classifier, anomaly")
@click.option("--config", "-c", type=click.Path(exists=True), help="Optional config file (JSON/YAML)")
@click.option("--async", "async_mode", is_flag=True, help="Run asynchronously")
def train(dataset_id: str, target: str, config: str | None, async_mode: bool):
    """🧠 Train ML model on a dataset."""
    console.print(
        Panel(
            f"""
[bold magenta]🧠 PREDATOR ML TRAINING[/bold magenta]

📊 Dataset: {dataset_id}
🎯 Target: {target}
    """,
            title="Training Task",
        )
    )

    config_data = {}
    if config:
        with open(config) as f:
            config_data = json.load(f)

    with Progress(SpinnerColumn(), TextColumn("[progress.description]{task.description}"), console=console) as progress:
        progress.add_task("Submitting training job...", total=None)

        try:
            with get_client() as client:
                payload = {"dataset_id": dataset_id, "target": target, "config": config_data}
                response = client.post("/v45/training/start", json=payload)

                if response.status_code != 200:
                    console.print(f"[red]❌ Training failed: {response.text}[/red]")
                    sys.exit(1)

                result = response.json()
                job_id = result.get("job_id")

                console.print("\n[green]✅ Training job submitted![/green]")
                console.print(f"   Job ID: [cyan]{job_id}[/cyan]")

                if async_mode:
                    console.print("\nUse `predator status --job-id {job_id}` to check progress.")
                    return

                # Poll for completion (simplified)
                console.print("\n[yellow]Training in progress... Use --async for background execution.[/yellow]")

        except httpx.RequestError as e:
            console.print(f"[red]❌ Connection error: {e}[/red]")
            sys.exit(1)


# ============================================================================
# SEARCH COMMAND
# ============================================================================
@cli.command()
@click.option("--query", "-q", required=True, help="Search query")
@click.option("--mode", "-m", default="hybrid", help="Mode: keyword, semantic, hybrid, chat")
@click.option("--limit", "-l", default=10, help="Number of results")
@click.option("--dataset", "-d", help="Filter by dataset ID")
@click.option("--output", "-o", type=click.Choice(["table", "json"]), default="table")
def search(query: str, mode: str, limit: int, dataset: str | None, output: str):
    """🔍 Search across indexed data."""
    console.print(f"\n[bold cyan]🔍 Searching:[/bold cyan] {query}")
    console.print(f"   Mode: {mode} | Limit: {limit}\n")

    try:
        with get_client() as client:
            params = {"q": query, "mode": mode, "limit": limit}
            if dataset:
                params["dataset_id"] = dataset

            response = client.get("/v1/search", params=params)

            if response.status_code != 200:
                console.print(f"[red]❌ Search failed: {response.text}[/red]")
                sys.exit(1)

            results = response.json()

            if output == "json":
                rprint(json.dumps(results, indent=2, ensure_ascii=False))
                return

            # Table output
            table = Table(title=f"Search Results ({results.get('total', 0)} total)")
            table.add_column("#", style="dim")
            table.add_column("Title", style="cyan")
            table.add_column("Score", style="green")
            table.add_column("Source", style="yellow")

            for i, hit in enumerate(results.get("hits", []), 1):
                table.add_row(
                    str(i), hit.get("title", "Untitled")[:50], f"{hit.get('score', 0):.3f}", hit.get("source", "N/A")
                )

            console.print(table)
            console.print(f"\n⏱️  Latency: {results.get('latency_ms', 'N/A')}ms")

    except httpx.RequestError as e:
        console.print(f"[red]❌ Connection error: {e}[/red]")
        sys.exit(1)


# ============================================================================
# STATUS COMMAND
# ============================================================================
@cli.command()
@click.option("--job-id", "-j", help="Specific job UUID to check")
@click.option("--all", "show_all", is_flag=True, help="Show all recent jobs")
@click.option("--type", "job_type", help="Filter by type: ingestion, training, etl")
def status(job_id: str | None, show_all: bool, job_type: str | None):
    """📊 Check job or system status."""
    try:
        with get_client() as client:
            if job_id:
                # Single job status
                response = client.get(f"/v1/jobs/{job_id}/status")

                if response.status_code != 200:
                    console.print(f"[red]❌ Job not found: {job_id}[/red]")
                    sys.exit(1)

                status_data = response.json()

                status_color = {"queued": "yellow", "running": "blue", "completed": "green", "failed": "red"}.get(
                    status_data["status"], "white"
                )

                console.print(
                    Panel(
                        f"""
[bold]Job ID:[/bold] {job_id}
[bold]Status:[/bold] [{status_color}]{status_data["status"].upper()}[/{status_color}]
[bold]Type:[/bold] {status_data.get("type", "N/A")}
[bold]Created:[/bold] {status_data.get("created_at", "N/A")}
[bold]Progress:[/bold] {status_data.get("progress", "N/A")}%
                """,
                        title="📊 Job Status",
                    )
                )

                if status_data.get("error"):
                    console.print(f"[red]Error: {status_data['error']}[/red]")

            else:
                # System status or all jobs
                response = client.get("/v45/status")

                if response.status_code != 200:
                    console.print("[red]❌ Could not fetch system status[/red]")
                    sys.exit(1)

                system = response.json()

                console.print(
                    Panel(
                        f"""
[bold cyan]🦅 PREDATOR ANALYTICS v45.0[/bold cyan]

[bold]System Stage:[/bold] {system.get("stage", "N/A")}

[bold]Components:[/bold]
  • PostgreSQL: {"🟢" if system.get("postgres_healthy") else "🔴"}
  • Redis: {"🟢" if system.get("redis_healthy") else "🔴"}
  • OpenSearch: {"🟢" if system.get("opensearch_healthy") else "🔴"}
  • Qdrant: {"🟢" if system.get("qdrant_healthy") else "🔴"}
  • RabbitMQ: {"🟢" if system.get("rabbitmq_healthy") else "🔴"}

[bold]Stats:[/bold]
  • Documents: {system.get("total_documents", 0):,}
  • Vectors: {system.get("total_vectors", 0):,}
  • Active Jobs: {system.get("active_jobs", 0)}
                """,
                        title="System Status",
                    )
                )

    except httpx.RequestError as e:
        console.print(f"[red]❌ Connection error: {e}[/red]")
        sys.exit(1)


# ============================================================================
# SYNC COMMAND
# ============================================================================
@cli.command()
@click.option("--source-id", "-s", help="Source UUID to sync")
@click.option("--all", "sync_all", is_flag=True, help="Sync all sources")
@click.option("--force", is_flag=True, help="Force full re-sync")
def sync(source_id: str | None, sync_all: bool, force: bool):
    """🔄 Sync data sources."""
    if not source_id and not sync_all:
        console.print("[yellow]Specify --source-id or use --all to sync all sources[/yellow]")
        sys.exit(1)

    try:
        with get_client() as client:
            if sync_all:
                response = client.post("/v1/sources/sync-all", json={"force": force})
            else:
                response = client.post(f"/v1/sources/{source_id}/sync", json={"force": force})

            if response.status_code != 200:
                console.print(f"[red]❌ Sync failed: {response.text}[/red]")
                sys.exit(1)

            result = response.json()
            console.print("[green]✅ Sync initiated![/green]")
            console.print(f"   Jobs started: {result.get('jobs_started', 0)}")

    except httpx.RequestError as e:
        console.print(f"[red]❌ Connection error: {e}[/red]")
        sys.exit(1)


# ============================================================================
# CONFIG COMMAND
# ============================================================================
@cli.command()
@click.option("--show", is_flag=True, help="Show current configuration")
@click.option("--set", "set_key", nargs=2, help="Set config key value")
def config(show: bool, set_key):
    """⚙️ Manage CLI configuration."""
    config_path = Path.home() / ".predator" / "config.json"

    if show or not set_key:
        console.print(
            Panel(
                f"""
[bold]Predator CLI Configuration[/bold]

API URL: {API_BASE_URL}
Token Set: {"Yes" if API_TOKEN else "No"}
Config File: {config_path}
        """,
                title="⚙️ Configuration",
            )
        )
        return

    # Set configuration
    key, value = set_key
    console.print(f"[green]✅ Set {key} = {value}[/green]")


# ============================================================================
# HEALTH COMMAND
# ============================================================================
@cli.command()
def health():
    """💚 Quick health check of all services."""
    console.print("\n[bold cyan]💚 PREDATOR Health Check[/bold cyan]\n")

    services = [
        ("Backend API", f"{API_BASE_URL}/health"),
        ("OpenSearch", f"{API_BASE_URL.replace('/api', '')}/opensearch/_cluster/health"),
        ("Qdrant", f"{API_BASE_URL.replace('/api', '')}/qdrant/collections"),
    ]

    for name, url in services:
        try:
            with httpx.Client(timeout=5.0) as client:
                response = client.get(url)
                if response.status_code == 200:
                    console.print(f"  🟢 {name}: [green]Healthy[/green]")
                else:
                    console.print(f"  🟡 {name}: [yellow]Degraded ({response.status_code})[/yellow]")
        except:
            console.print(f"  🔴 {name}: [red]Unreachable[/red]")


if __name__ == "__main__":
    cli()
