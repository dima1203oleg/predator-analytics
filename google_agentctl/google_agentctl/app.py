import typer
from rich.console import Console
from rich.logging import RichHandler
import logging

# Commands
from google_agentctl.commands import generate, analyze, submit, lifecycle, test, detect, report

app = typer.Typer(
    name="google-agentctl",
    help="Google Integrative Runtime CLI Assistant",
    add_completion=True,
    rich_markup_mode="rich"
)

console = Console()
logging.basicConfig(
    level="INFO",
    format="%(message)s",
    handlers=[RichHandler(rich_tracebacks=True)]
)
logger = logging.getLogger("google-agentctl")

app.add_typer(generate.app, name="generate")
app.add_typer(analyze.app, name="analyze")
app.add_typer(submit.app, name="submit")
app.add_typer(lifecycle.app, name="lifecycle")
app.add_typer(test.app, name="test")
app.add_typer(detect.app, name="detect")
app.add_typer(report.app, name="report")

if __name__ == "__main__":
    app()
