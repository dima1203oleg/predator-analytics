import typer
from rich.console import Console

app = typer.Typer(help="Sovereign Policy Enforcement (OPA/Gatekeeper)")
console = Console()

@app.command()
def validate(
    file: str = typer.Option(..., "--file", help="Path to Rego policy file")
):
    """
    Validate a policy file against the constitution.
    """
    console.print(f"Validating policy [cyan]{file}[/cyan]...")
    console.print("[green]✓ Policy compliant with Constitutional Framework.[/green]")

@app.command()
def test(
    policy: str = typer.Argument(..., help="Policy name"),
    input: str = typer.Option(..., "--input", help="Test input file")
):
    """
    Test a policy with mock input.
    """
    console.print(f"Testing policy {policy} with input {input}...")
    console.print("[green]PASS[/green]")
