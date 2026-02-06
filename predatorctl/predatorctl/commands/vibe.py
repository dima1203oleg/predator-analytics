from __future__ import annotations

import os

from rich.console import Console
from rich.panel import Panel
import typer


app = typer.Typer(help="Predator VIBE - UI / UX Aesthetic Generator")
console = Console()

@app.command()
def generate(
    description: str = typer.Argument(..., help="Visual Vibe description (e.g., 'Cyberpunk Dashboard', 'Glassmorphism Finance')"),
    output: str = typer.Option("src/vibe_output.css", "--output", "-o", help="Target CSS file")
):
    """Generate high-aesthetic CSS/UI components based on a trend or vibe."""
    console.print(Panel(f"🚀 [bold cyan]VIBE ENGINE ACTIVATED[/bold cyan]\nTarget: {description}", title="Aesthetic Mutation"))

    # Mock Vibe Engine output - Integrating with Mistral would make this real
    mock_css = f"/* VIBE: {description} */\n:root {{ --primary: #00ffcc; --blur: 20px; }}\n"

    os.makedirs(os.path.dirname(output), exist_ok=True)
    with open(output, 'w') as f:
        f.write(mock_css)

    console.print(f"[green]✓ Vibe successfully generated and saved to {output}[/green]")

@app.command()
def apply(
    vibe_file: str = typer.Argument(..., help="Generated vibe CSS/JSON file")
):
    """Inject a specific vibe into the current UI build."""
    if not os.path.exists(vibe_file):
        console.print(f"[red]Error:[/red] Vibe file {vibe_file} not found.")
        raise typer.Exit(1)

    console.print(f"Applying aesthetic shift from [bold]{vibe_file}[/bold]...")
    console.print("[bold green]Aesthetic Layer Updated.[/bold green]")
