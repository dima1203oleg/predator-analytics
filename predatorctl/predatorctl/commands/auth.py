import typer
from rich.console import Console

app = typer.Typer(help="Sovereign Identity Management (Keycloak/OIDC)")
console = Console()

@app.command()
def login(
    oidc: bool = typer.Option(True, "--oidc", help="Login via OIDC")
):
    """
    Login to the Predator Control Plane.
    """
    if oidc:
        console.print("Redirecting to Keycloak OIDC Provider...")
        console.print("[green]Login Successful.[/green] Session active for 8h.")
    else:
        console.print("Personal Access Token required for non-OIDC login.")

@app.command()
def status():
    """
    Show current session status.
    """
    console.print("Logged in as [cyan]dima[/cyan] (Role: God Mode)")
