from __future__ import annotations

import os

from rich.console import Console
from rich.markdown import Markdown
import typer

app = typer.Typer(help="Mistral AI Intelligence Interface")
console = Console()

def get_mistral_client():
    from mistralai.client import MistralClient
    api_key = os.getenv("MISTRAL_API_KEY")
    if not api_key:
        console.print("[bold red]Error:[/bold red] MISTRAL_API_KEY environment variable not set.")
        raise typer.Exit(1)
    return MistralClient(api_key=api_key)

@app.command()
def ask(
    prompt: str = typer.Argument(..., help="Question or instructions for Mistral"),
    model: str = typer.Option("mistral-large-latest", help="Model name")
):
    """Query the Mistral AI brain."""
    client = get_mistral_client()
    from mistralai.models.chat_completion import ChatMessage

    console.print(f"🧠 [italic]Querying Mistral ({model})...[/italic]")

    messages = [ChatMessage(role="user", content=prompt)]
    chat_response = client.chat(model=model, messages=messages)

    console.print(Markdown(chat_response.choices[0].message.content))

@app.command()
def analyze(
    path: str = typer.Argument(..., help="Path to file or directory for analysis")
):
    """Analyze code patterns using Mistral AI."""
    if not os.path.exists(path):
        console.print(f"[red]Error:[/red] Path {path} does not exist.")
        raise typer.Exit(1)

    content = ""
    if os.path.isfile(path):
        with open(path) as f:
            content = f.read()
    else:
        # Just grab main files for context
        content = "Directory analysis requested for: " + path

    prompt = f"Analyze the following code for architectural improvements and security flaws:\n\n{content}"
    ask(prompt)
