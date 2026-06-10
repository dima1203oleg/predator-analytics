# libs/dve/cli.py
"""CLI entry point for Deployment Verification Engine (DVE).
Використовує бібліотеку click для зручного запуску.
"""
import click
from .core import DeploymentVerifier

@click.command()
@click.option("--output", "output_path", default=None, help="Шлях до файлу звіту (JSON). Якщо не вказано — виводиться у stdout.")
def dva_check(output_path: str | None):
    """Запуск всіх перевірок та вивід звіту.
    """
    verifier = DeploymentVerifier()
    report = verifier.run_all_checks()
    if output_path:
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(report)
        click.echo(f"Звіт збережено до {output_path}")
    else:
        click.echo(report)

if __name__ == "__main__":
    dva_check()
