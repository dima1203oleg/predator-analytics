"""CLI для інфраструктури/CI-CD: K3s, Terraform, Helm, ArgoCD.

Забезпечує команди для управління інфраструктурою через Terraform, Helm та ArgoCD.
"""
from __future__ import annotations

import asyncio
from pathlib import Path
from typing import Optional

import typer

from mcp.infrastructure.argocd_client import ArgoCDClient
from mcp.infrastructure.helm_deployer import HelmDeployer
from mcp.infrastructure.terraform_runner import TerraformRunner

app = typer.Typer(help="Інфраструктура та деплой (Terraform/Helm/ArgoCD)")


@app.command("deploy")
def deploy(
    env: str = typer.Argument("dev", help="Середовище (dev/stage/prod)"),
    auto_approve: bool = typer.Option(
        False, "--auto-approve", help="Автоматично схвалити зміни"
    ),
) -> None:
    """Запустити Terraform + Helm деплой для вибраного окруження."""
    typer.echo(f"[INFRA] Запуск деплою для: {env}")

    # 1. Terraform plan
    try:
        tf = TerraformRunner("deploy/terraform")
        typer.echo("[INFRA-TF] Виконую plan...")
        plan_output = asyncio.run(tf.plan(environment=env))
        typer.echo(f"[INFRA-TF] План готовий ({len(plan_output)} bytes)")

        if auto_approve:
            typer.echo("[INFRA-TF] Виконую apply...")
            result = asyncio.run(tf.apply(environment=env, auto_approve=True))
            if result:
                typer.echo("[INFRA-TF] Apply: ✅ успішно")
            else:
                typer.echo("[INFRA-TF] Apply: ❌ помилка")
    except Exception as e:
        typer.echo(f"[INFRA-TF] Помилка: {e}", err=True)
        return

    # 2. Helm upgrade
    try:
        helm = HelmDeployer()
        typer.echo("[INFRA-HELM] Оновлюю repo...")
        asyncio.run(helm.repo_update())

        values_file = f"deploy/helm/values-{env}.yaml"
        typer.echo(f"[INFRA-HELM] Виконую upgrade з {values_file}...")
        result = asyncio.run(
            helm.upgrade(
                "predator",
                "predator/analytics",
                namespace="predator",
                values_file=values_file,
            )
        )
        if result:
            typer.echo("[INFRA-HELM] Upgrade: ✅ успішно")
        else:
            typer.echo("[INFRA-HELM] Upgrade: ❌ помилка")
    except Exception as e:
        typer.echo(f"[INFRA-HELM] Помилка: {e}", err=True)

    # 3. ArgoCD sync
    try:
        argocd = ArgoCDClient()
        typer.echo("[INFRA-ARGOCD] Синхронізую application...")
        result = asyncio.run(argocd.app_sync("predator-analytics"))
        if result:
            typer.echo("[INFRA-ARGOCD] Sync: ✅ успішно")
        else:
            typer.echo("[INFRA-ARGOCD] Sync: ❌ помилка")
    except Exception as e:
        typer.echo(f"[INFRA-ARGOCD] Помилка: {e}", err=True)


@app.command("diff")
def diff(
    env: str = typer.Argument("dev", help="Середовище")
) -> None:
    """Показити різницю між поточним та новим станом інфраструктури."""
    typer.echo(f"[INFRA] Diff для: {env}")

    # Terraform diff
    try:
        tf = TerraformRunner("deploy/terraform")
        typer.echo("[INFRA-TF] Terraform план:")
        plan = asyncio.run(tf.plan(environment=env))
        typer.echo(plan)
    except Exception as e:
        typer.echo(f"[INFRA-TF] Помилка: {e}", err=True)

    # Helm diff
    try:
        helm = HelmDeployer()
        values_file = f"deploy/helm/values-{env}.yaml"
        typer.echo(f"\n[INFRA-HELM] Helm diff:")
        diff_output = asyncio.run(
            helm.diff(
                "predator",
                "predator/analytics",
                values_file=values_file,
            )
        )
        if diff_output:
            typer.echo(diff_output)
        else:
            typer.echo("[INFRA-HELM] Немає змін")
    except Exception as e:
        typer.echo(f"[INFRA-HELM] Помилка: {e}", err=True)


@app.command("rollback")
def rollback(
    env: str = typer.Argument("dev", help="Середовище"),
    revision: Optional[int] = typer.Option(None, help="Revision для відката"),
) -> None:
    """Відкатити Helm release до попередньої версії."""
    typer.echo(f"[INFRA] Rollback в: {env}")

    try:
        helm = HelmDeployer()
        typer.echo("[INFRA-HELM] Виконую rollback...")
        result = asyncio.run(
            helm.rollback("predator", revision=revision, namespace="predator")
        )
        if result:
            typer.echo("[INFRA-HELM] Rollback: ✅ успішно")
        else:
            typer.echo("[INFRA-HELM] Rollback: ❌ помилка")
    except Exception as e:
        typer.echo(f"[INFRA-HELM] Помилка: {e}", err=True)


@app.command("status")
def status(env: str = typer.Argument("dev", help="Середовище")) -> None:
    """Отримати статус поточного деплою."""
    typer.echo(f"[INFRA] Статус для: {env}")

    # Helm status
    try:
        helm = HelmDeployer()
        typer.echo("[INFRA-HELM] Отримую статус...")
        status_dict = asyncio.run(helm.status("predator", namespace="predator"))
        if status_dict:
            release_name = status_dict.get("name", "unknown")
            namespace = status_dict.get("namespace", "unknown")
            status_val = status_dict.get("status", "unknown")
            typer.echo(f"  릴리스: {release_name}")
            typer.echo(f"  Namespace: {namespace}")
            typer.echo(f"  Статус: {status_val}")
    except Exception as e:
        typer.echo(f"[INFRA-HELM] Помилка: {e}", err=True)

    # ArgoCD status
    try:
        argocd = ArgoCDClient()
        typer.echo("\n[INFRA-ARGOCD] Отримую статус application...")
        app_status = asyncio.run(argocd.app_status("predator-analytics"))
        if app_status:
            app_name = app_status.get("metadata", {}).get("name", "unknown")
            sync_status = app_status.get("status", {}).get("syncStatus", "unknown")
            health_status = app_status.get("status", {}).get("health", {}).get("status", "unknown")
            typer.echo(f"  Додаток: {app_name}")
            typer.echo(f"  Sync: {sync_status}")
            typer.echo(f"  Здоров'я: {health_status}")
    except Exception as e:
        typer.echo(f"[INFRA-ARGOCD] Помилка: {e}", err=True)


@app.command("sync")
def sync(
    app: str = typer.Argument("predator-analytics", help="ArgoCD application")
) -> None:
    """Синхронізувати ArgoCD application з git repository."""
    typer.echo(f"[INFRA] Синхронізація: {app}")

    try:
        argocd = ArgoCDClient()
        typer.echo("[INFRA-ARGOCD] Виконую sync...")
        result = asyncio.run(argocd.app_sync(app))
        if result:
            typer.echo("[INFRA-ARGOCD] Sync: ✅ успішно")
            # Чекати завершення
            typer.echo("[INFRA-ARGOCD] Чекаю завершення...")
            wait_result = asyncio.run(argocd.app_wait(app, timeout=300))
            if wait_result:
                typer.echo("[INFRA-ARGOCD] Синхронізація завершена: ✅")
            else:
                typer.echo("[INFRA-ARGOCD] Timeout під час синхронізації")
        else:
            typer.echo("[INFRA-ARGOCD] Sync: ❌ помилка")
    except Exception as e:
        typer.echo(f"[INFRA-ARGOCD] Помилка: {e}", err=True)
