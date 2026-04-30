"""Головний CLI MCP-платформи (Typer)."""
from __future__ import annotations

import asyncio

import typer

from mcp.ai_layer.cli import app as ai_app
from mcp.chaos_engineering.cli import app as chaos_app
from mcp.code_analysis.cli import app as analyze_app
from mcp.event_bus.cli import app as events_app
from mcp.feature_flags.cli import app as flags_app
from mcp.infrastructure.cli import app as infra_app
from mcp.memory_layer.cli import app as memory_app
from mcp.meta_controller.controller import main as meta_main
from mcp.observability.cli import app as monitor_app
from mcp.registry_docs.cli import app as docs_app
from mcp.security.cli import app as sec_app
from mcp.testing.cli import app as test_app

app = typer.Typer(
    name="mcp",
    help="MCP-платформа: мультиагентний CLI оркестратор",
    add_completion=False,
    no_args_is_help=True,
)
app.add_typer(ai_app, name="ai", help="AI шар: OpenHands/AutoGen")
app.add_typer(memory_app, name="memory", help="Пам’ять: Neo4j/Qdrant")
app.add_typer(analyze_app, name="analyze", help="Кодовий аналіз: Tree-sitter/Semgrep/SonarQube")
app.add_typer(infra_app, name="infra", help="Інфра/CI/CD: K3s/Terraform/Helm/ArgoCD")
app.add_typer(events_app, name="events", help="Події: NATS JetStream")
app.add_typer(sec_app, name="sec", help="Безпека: Vault/OPA/Trivy/CodeQL")
app.add_typer(monitor_app, name="monitor", help="Спостереження: Prometheus/Grafana/Loki/Sentry")
app.add_typer(test_app, name="test", help="Тести: PyTest/Jest/Cypress")
app.add_typer(docs_app, name="docs", help="Реєстр/Документи: Backstage/MkDocs")
app.add_typer(flags_app, name="flags", help="Фічфлаги: Unleash")
app.add_typer(chaos_app, name="chaos", help="Chaos Engineering: LitmusChaos")

@app.command()
def version() -> None:
    """Показати версію MCP-платформи."""
    typer.echo("mcp-platform 0.1.0")

@app.command()
def meta_controller() -> None:
    """Запустити мета-контролер (автономний режим)."""
    asyncio.run(meta_main())

if __name__ == "__main__":
    app()
