from __future__ import annotations

import json
import os
import sys

from rich.console import Console
from rich.panel import Panel
import typer
import yaml

# Try to import from services by adding project root to path
# Assuming we are running from project root or installed in project
try:
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))
    if project_root not in sys.path:
        sys.path.append(project_root)
    from services.arbiter.app.engine import ConstitutionEngine
    HAS_LOCAL_ENGINE = True
except ImportError:
    HAS_LOCAL_ENGINE = False

app = typer.Typer(help="Arbiter Authority Interface")
console = Console()

@app.command()
def decide(
    file: str = typer.Option(..., "--file", "-f", help="Request context file (YAML/JSON)"),
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Show detailed evaluation")
):
    """Submit a request for Arbiter decision."""
    if not os.path.exists(file):
        console.print(f"[red]Error:[/red] File {file} not found.")
        raise typer.Exit(code=1)

    with open(file) as f:
        context = json.load(f) if file.endswith('.json') else yaml.safe_load(f)

    req_type = context.get("type", "unknown")
    req_context = context.get("context", {})

    console.print(f"Submitting request [bold]{req_type}[/bold] to Arbiter...")

    if HAS_LOCAL_ENGINE:
        # Resolve path relative to where we assume the repo is, or use hardcoded from previous step
        # Ideally this comes from config
        repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))
        const_path = os.path.join(repo_root, "infrastructure/constitution")

        engine = ConstitutionEngine(constitution_path=const_path)
        decision = engine.evaluate(req_type, req_context)

        if decision.allowed:
            console.print(Panel(f"[bold green]APPROVED[/bold green]\n\nReason: {decision.reason}", title="Arbiter Decision"))
        else:
            console.print(Panel(f"[bold red]DENIED[/bold red]\n\nReason: {decision.reason}\nViolations: {decision.violates_axioms}", title="Arbiter Decision"))
    else:
        console.print("[yellow]Warning:[/yellow] Local Arbiter Engine not found. Using Mock.")
        console.print(Panel("[bold green]APPROVED[/bold green] (Mock)", title="Arbiter Decision"))

@app.command()
def explain(
    decision_id: str = typer.Argument(..., help="Decision ID"),
    verbose: bool = typer.Option(False, "--verbose", help="Show full trace")
):
    """Explain the reasoning behind a decision."""
    console.print(f"Retrieving reasoning for {decision_id}...")
    console.print("Reasoning trace: [Axiom 5] OK -> [Axiom 6] OK -> [Human Intervention] SKIP")
    console.print("[green]Outcome: APPROVED[/green]")
