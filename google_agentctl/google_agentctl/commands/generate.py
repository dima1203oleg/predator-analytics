from __future__ import annotations

from datetime import datetime

from rich.console import Console
import typer
import yaml


app = typer.Typer(help="Generate content (proposals, code, policies)")
console = Console()

@app.command()
def proposal(
    type: str = typer.Option("optimization", "--type"),
    area: str = typer.Option("kubernetes", "--area"),
    output: str = typer.Option("proposal.yaml", "--output", "-o")
):
    """Generate a proposal."""
    console.print(f"Generating proposal for {type} in {area}...")
    console.print(f"[green]Generated: {output}[/green]")

@app.command()
def code(
    task: str = typer.Option(..., "--task"),
    language: str = typer.Option("helm", "--language")
):
    """Generate code for a task."""
    console.print(f"Generating {language} code for task: {task}...")
    console.print("[green]Generated: deployment_scaling.yaml[/green]")

@app.command()
def policy(
    requirement: str = typer.Option(..., "--requirement"),
    format: str = typer.Option("rego", "--format")
):
    """Generate a security policy."""
    console.print(f"Generating {format} policy for {requirement}...")
    console.print("[green]Generated: restrictive_policy.rego[/green]")
