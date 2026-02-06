from __future__ import annotations

import logging
import sys
from typing import Optional

from rich.console import Console
from rich.logging import RichHandler
import typer

# Commands
from predatorctl.commands import (
    agent,
    arbiter,
    auth,
    azr,
    chaos,
    deploy,
    etl,
    gitops,
    ledger,
    logs,
    mcp,
    metrics,
    mistral,
    policy,
    secrets,
    system,
    trace,
    ui_sentinel,
    vibe,
)


app = typer.Typer(
    name="predatorctl",
    help="Predator Analytics v26 CLI Control Plane",
    add_completion=True,
    rich_markup_mode="rich"
)

# Initialize Rich Console
console = Console()

# Configure Logging
logging.basicConfig(
    level="INFO",
    format="%(message)s",
    datefmt="[%X]",
    handlers=[RichHandler(rich_tracebacks=True)]
)
logger = logging.getLogger("predatorctl")

@app.callback()
def main(
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Enable verbose output"),
    output: str = typer.Option("human", "--output", "-o", help="Output format (human, json, yaml)")
):
    """Predator Analytics v26 CLI Control Plane.

    Implements the [bold]CLI-First[/bold] constitutional principle.
    """
    if verbose:
        logger.setLevel("DEBUG")

    # Store global state (like output format) if needed
    # ctx.obj = {"output": output}

# Register Subcommands
app.add_typer(agent.app, name="agent")
app.add_typer(system.app, name="system")
app.add_typer(etl.app, name="etl")
app.add_typer(ledger.app, name="ledger")
app.add_typer(ledger.app, name="truth")  # Alias for ledger per TZ 27
app.add_typer(chaos.app, name="chaos")
app.add_typer(azr.app, name="azr")
app.add_typer(gitops.app, name="gitops")
app.add_typer(arbiter.app, name="arbiter")
app.add_typer(policy.app, name="policy")
app.add_typer(auth.app, name="auth")
app.add_typer(secrets.app, name="secrets")
app.add_typer(metrics.app, name="metrics")
app.add_typer(logs.app, name="logs")
app.add_typer(trace.app, name="trace")
app.add_typer(deploy.app, name="deploy")
app.add_typer(mistral.app, name="mistral")
app.add_typer(mistral.app, name="ai")
app.add_typer(vibe.app, name="vibe")
app.add_typer(mcp.app, name="mcp")
app.add_typer(ui_sentinel.app, name="sentinel")

if __name__ == "__main__":
    app()
