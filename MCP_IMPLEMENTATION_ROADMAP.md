# 🎯 MCP-платформа: Інтерактивна Roadmap & Кодові приклади

**Версія**: 0.1.0 (Ready for Implementation)
**Мета**: Допрацювати MCP-платформу від "бо架構" → "повна функціональність"

---

## 📊 TIMELINE & DEPENDENCIES

```
Sprint 1 (Tues-Thu): Infrastructure       [████░░░░░░] 40%
  ├─ terraform_runner.py
  ├─ helm_deployer.py  
  └─ argocd_client.py

Sprint 2 (Fri-Sun): AI Layer              [░░░░░░░░░░]  0%
  ├─ codegen.py
  ├─ orchestrator.py
  └─ autogen_client.py

Sprint 3 (Mon-Wed): Code Analysis         [░░░░░░░░░░]  0%
  ├─ tree_sitter_parser.py
  ├─ semgrep_runner.py
  └─ sonarqube_client.py

Sprint 4 (Thu-Fri): Meta-Controller       [░░░░░░░░░░]  0%
  ├─ decisions.py        ⭐ CRITICAL
  ├─ github_actions.py
  └─ chaos_runner.py

Sprint 5 (Sat-Sun): Testing & Security    [░░░░░░░░░░]  0%
  ├─ pytest_runner.py
  ├─ jest_runner.py
  ├─ vault_client.py
  └─ scanners/*.py

Sprint 6 (Mon-Tue): Observability & Chaos [░░░░░░░░░░]  0%
  ├─ prometheus_client.py
  ├─ loki_client.py
  ├─ sentry_client.py
  └─ litmus_runner.py

Sprint 7 (Wed-Thu): Tests & CI/CD         [░░░░░░░░░░]  0%
  ├─ tests/e2e/*.py
  ├─ tests/integration/*.py
  └─ .github/workflows/*

Sprint 8 (Fri): Documentation             [░░░░░░░░░░]  0%
  └─ README + DEPLOY + API docs
```

---

## 🔴 МОДУЛЬ 1: INFRASTRUCTURE LAYER (Sprint 1)

### 1.1 Terraform Runner

**Файл:** `mcp/infrastructure/terraform_runner.py`

```python
"""Terraform executor для IaC операцій."""
from __future__ import annotations

import asyncio
import json
import os
import subprocess
import tempfile
from pathlib import Path
from typing import Optional

import typer


class TerraformError(Exception):
    """Base error для Terraform операцій."""
    pass


class TerraformRunner:
    """Executor для terraform команд."""

    def __init__(self, work_dir: str = ".") -> None:
        """Initialize Terraform runner."""
        self.work_dir = Path(work_dir)
        if not self.work_dir.exists():
            raise TerraformError(f"Work directory не існує: {self.work_dir}")

    async def _run_cmd(
        self,
        *args: str,
        capture_output: bool = True,
    ) -> tuple[str, str]:
        """Execute terraform command asynchronously."""
        cmd = ["terraform", *args]
        
        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                cwd=str(self.work_dir),
                stdout=asyncio.subprocess.PIPE if capture_output else None,
                stderr=asyncio.subprocess.PIPE if capture_output else None,
            )
            stdout, stderr = await proc.communicate()
            
            if proc.returncode != 0:
                raise TerraformError(
                    f"Terraform failed: {stderr.decode() if stderr else 'Unknown error'}"
                )
            
            return (
                stdout.decode() if stdout else "",
                stderr.decode() if stderr else "",
            )
        except FileNotFoundError:
            raise TerraformError("terraform CLI не знайдено. Встановіть terraform.")

    async def init(self, backend_config: Optional[dict] = None) -> bool:
        """Ініціалізувати terraform backend."""
        args = ["init", "-no-color"]
        
        if backend_config:
            for key, value in backend_config.items():
                args.extend(["-backend-config", f"{key}={value}"])
        
        stdout, _ = await self._run_cmd(*args)
        return "Terraform has been successfully initialized" in stdout

    async def plan(self, environment: str = "dev", out_file: Optional[str] = None) -> str:
        """Запустити terraform plan для вибраного окружения."""
        var_file = self.work_dir / f"{environment}.tfvars"
        
        if not var_file.exists():
            raise TerraformError(f"Variable file не знайдено: {var_file}")
        
        args = [
            "plan",
            "-no-color",
            f"-var-file={var_file}",
            f"-input=false",
        ]
        
        if out_file:
            args.extend(["-out", out_file])
        
        stdout, _ = await self._run_cmd(*args)
        return stdout

    async def apply(
        self,
        environment: str = "dev",
        auto_approve: bool = False,
        plan_file: Optional[str] = None,
    ) -> bool:
        """Застосувати terraform changes."""
        args = ["apply", "-no-color"]
        
        if auto_approve:
            args.append("-auto-approve")
        
        if plan_file:
            args.append(plan_file)
        else:
            var_file = self.work_dir / f"{environment}.tfvars"
            if var_file.exists():
                args.append(f"-var-file={var_file}")
        
        stdout, _ = await self._run_cmd(*args)
        return "Apply complete" in stdout

    async def destroy(self, environment: str = "dev", auto_approve: bool = False) -> bool:
        """Знищити terraform-керовані ресурси."""
        var_file = self.work_dir / f"{environment}.tfvars"
        
        args = ["destroy", "-no-color"]
        if auto_approve:
            args.append("-auto-approve")
        if var_file.exists():
            args.append(f"-var-file={var_file}")
        
        stdout, _ = await self._run_cmd(*args)
        return "Destroy complete" in stdout

    async def output(self, name: Optional[str] = None, json_format: bool = True) -> dict | str:
        """Отримати terraform output values."""
        args = ["output"]
        
        if json_format:
            args.append("-json")
        
        if name:
            args.append(name)
        
        stdout, _ = await self._run_cmd(*args)
        
        if json_format and not name:
            return json.loads(stdout)
        
        return stdout

    async def validate(self) -> bool:
        """Провести terraform validate."""
        _, _ = await self._run_cmd("validate")
        return True

    async def fmt_check(self, recursive: bool = True) -> tuple[bool, str]:
        """Перевірити terraform formatting."""
        args = ["fmt", "-check"]
        if recursive:
            args.append("-recursive")
        
        try:
            await self._run_cmd(*args)
            return True, "Formatting OK"
        except TerraformError as e:
            return False, str(e)


# CLI commands
@typer.command("init")
def cmd_init(dir: str = typer.Argument(".")) -> None:
    """Ініціалізувати terraform."""
    runner = TerraformRunner(dir)
    result = asyncio.run(runner.init())
    typer.echo(f"[TERRAFORM] Init: {'✅' if result else '❌'}")


@typer.command("plan")
def cmd_plan(
    dir: str = typer.Argument("."),
    env: str = typer.Option("dev", help="Окружение"),
    out: Optional[str] = typer.Option(None, help="File to save plan"),
) -> None:
    """Запустити terraform plan."""
    runner = TerraformRunner(dir)
    output = asyncio.run(runner.plan(environment=env, out_file=out))
    typer.echo(output)


@typer.command("apply")
def cmd_apply(
    dir: str = typer.Argument("."),
    env: str = typer.Option("dev", help="Окружение"),
    approve: bool = typer.Option(False, "--auto-approve", help="Auto approve"),
) -> None:
    """Застосувати terraform changes."""
    runner = TerraformRunner(dir)
    result = asyncio.run(runner.apply(environment=env, auto_approve=approve))
    typer.echo(f"[TERRAFORM] Apply: {'✅' if result else '❌'}")


if __name__ == "__main__":
    app = typer.Typer()
    app.command()(cmd_init)
    app.command()(cmd_plan)
    app.command()(cmd_apply)
    app()
```

---

### 1.2 Helm Deployer

**Файл:** `mcp/infrastructure/helm_deployer.py`

```python
"""Helm deployment executor."""
from __future__ import annotations

import asyncio
import json
import subprocess
from pathlib import Path
from typing import Any, Optional

import typer


class HelmError(Exception):
    """Base error для Helm операцій."""
    pass


class HelmDeployer:
    """Executor для helm команд."""

    def __init__(self) -> None:
        """Initialize Helm deployer."""
        self.helm_cmd = "helm"

    async def _run_cmd(
        self,
        *args: str,
        capture_output: bool = True,
    ) -> tuple[str, str]:
        """Execute helm command."""
        cmd = [self.helm_cmd, *args]
        
        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE if capture_output else None,
                stderr=asyncio.subprocess.PIPE if capture_output else None,
            )
            stdout, stderr = await proc.communicate()
            
            if proc.returncode != 0:
                err_msg = stderr.decode() if stderr else "Unknown error"
                raise HelmError(f"Helm failed: {err_msg}")
            
            return (
                stdout.decode() if stdout else "",
                stderr.decode() if stderr else "",
            )
        except FileNotFoundError:
            raise HelmError("helm CLI не знайдено. Встановіть helm.")

    async def repo_add(self, name: str, url: str) -> bool:
        """Додати helm repository."""
        await self._run_cmd("repo", "add", name, url)
        return True

    async def repo_update(self) -> bool:
        """Оновити helm repositories."""
        await self._run_cmd("repo", "update")
        return True

    async def install(
        self,
        release: str,
        chart: str,
        namespace: str = "default",
        values: Optional[dict[str, Any]] = None,
        values_file: Optional[str] = None,
    ) -> bool:
        """Встановити helm release."""
        args = ["install", release, chart, "-n", namespace, "--create-namespace"]
        
        if values:
            for key, val in values.items():
                args.extend(["--set", f"{key}={val}"])
        
        if values_file and Path(values_file).exists():
            args.extend(["-f", values_file])
        
        await self._run_cmd(*args)
        return True

    async def upgrade(
        self,
        release: str,
        chart: str,
        namespace: str = "default",
        values: Optional[dict[str, Any]] = None,
        values_file: Optional[str] = None,
        force: bool = False,
    ) -> bool:
        """Оновити helm release."""
        args = ["upgrade", release, chart, "-n", namespace]
        
        if force:
            args.append("--force")
        
        if values:
            for key, val in values.items():
                args.extend(["--set", f"{key}={val}"])
        
        if values_file and Path(values_file).exists():
            args.extend(["-f", values_file])
        
        await self._run_cmd(*args)
        return True

    async def uninstall(self, release: str, namespace: str = "default") -> bool:
        """Видалити helm release."""
        await self._run_cmd("uninstall", release, "-n", namespace)
        return True

    async def status(self, release: str, namespace: str = "default") -> dict[str, Any]:
        """Отримати статус release."""
        stdout, _ = await self._run_cmd("status", release, "-n", namespace, "-o", "json")
        return json.loads(stdout)

    async def diff(
        self,
        release: str,
        chart: str,
        namespace: str = "default",
        values_file: Optional[str] = None,
    ) -> str:
        """Показати diff для upgrade."""
        # Note: потребує helm-diff plugin
        args = ["diff", "upgrade", release, chart, "-n", namespace]
        
        if values_file and Path(values_file).exists():
            args.extend(["-f", values_file])
        
        try:
            stdout, _ = await self._run_cmd(*args)
            return stdout
        except HelmError as e:
            # helm diff може повертати exit code 1 якщо є зміни
            return str(e)

    async def rollback(
        self,
        release: str,
        revision: Optional[int] = None,
        namespace: str = "default",
    ) -> bool:
        """Відкатити до попередньої версії."""
        args = ["rollback", release]
        
        if revision is not None:
            args.append(str(revision))
        
        args.extend(["-n", namespace])
        
        await self._run_cmd(*args)
        return True

    async def list_releases(self, namespace: str = "default") -> list[dict[str, Any]]:
        """Список всіх releases у namespace."""
        stdout, _ = await self._run_cmd("list", "-n", namespace, "-o", "json")
        data = json.loads(stdout)
        return data.get("releases", [])

    async def get_values(self, release: str, namespace: str = "default") -> dict:
        """Отримати поточні values release."""
        stdout, _ = await self._run_cmd("get", "values", release, "-n", namespace, "-o", "json")
        return json.loads(stdout)


# CLI commands
@typer.command("install")
def cmd_install(
    release: str = typer.Argument(..., help="Release name"),
    chart: str = typer.Argument(..., help="Chart name/path"),
    namespace: str = typer.Option("default", help="Kubernetes namespace"),
    values_file: Optional[str] = typer.Option(None, "-f", help="Values YAML file"),
) -> None:
    """Встановити Helm release."""
    deployer = HelmDeployer()
    try:
        result = asyncio.run(
            deployer.install(release, chart, namespace, values_file=values_file)
        )
        typer.echo(f"[HELM] Install '{release}': {'✅' if result else '❌'}")
    except HelmError as e:
        typer.echo(f"[HELM] Error: {e}", err=True)
        raise typer.Exit(code=1)


@typer.command("upgrade")
def cmd_upgrade(
    release: str = typer.Argument(..., help="Release name"),
    chart: str = typer.Argument(..., help="Chart name/path"),
    namespace: str = typer.Option("default", help="Kubernetes namespace"),
    values_file: Optional[str] = typer.Option(None, "-f", help="Values YAML file"),
) -> None:
    """Оновити Helm release."""
    deployer = HelmDeployer()
    try:
        result = asyncio.run(
            deployer.upgrade(release, chart, namespace, values_file=values_file)
        )
        typer.echo(f"[HELM] Upgrade '{release}': {'✅' if result else '❌'}")
    except HelmError as e:
        typer.echo(f"[HELM] Error: {e}", err=True)
        raise typer.Exit(code=1)


@typer.command("rollback")
def cmd_rollback(
    release: str = typer.Argument(..., help="Release name"),
    revision: Optional[int] = typer.Option(None, help="Revision to rollback to"),
    namespace: str = typer.Option("default", help="Kubernetes namespace"),
) -> None:
    """Відкатити Helm release."""
    deployer = HelmDeployer()
    try:
        result = asyncio.run(deployer.rollback(release, revision, namespace))
        typer.echo(f"[HELM] Rollback '{release}': {'✅' if result else '❌'}")
    except HelmError as e:
        typer.echo(f"[HELM] Error: {e}", err=True)
        raise typer.Exit(code=1)
```

---

### 1.3 ArgoCD Client

**Файл:** `mcp/infrastructure/argocd_client.py`

```python
"""ArgoCD GitOps sync client."""
from __future__ import annotations

import asyncio
import json
import subprocess
from typing import Any, Optional

import typer


class ArgoCDError(Exception):
    """Base error для ArgoCD операцій."""
    pass


class ArgoCDClient:
    """Client для ArgoCD операцій."""

    def __init__(self, server: str = "localhost:8080", insecure: bool = True) -> None:
        """Initialize ArgoCD client."""
        self.server = server
        self.insecure = insecure

    async def _run_cmd(self, *args: str) -> str:
        """Execute argocd CLI command."""
        cmd = ["argocd"]
        
        if self.insecure:
            cmd.extend(["--insecure", "true"])
        
        cmd.extend(["--server", self.server])
        cmd.extend(args)
        
        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await proc.communicate()
            
            if proc.returncode != 0:
                raise ArgoCDError(
                    f"ArgoCD failed: {stderr.decode() if stderr else 'Unknown error'}"
                )
            
            return stdout.decode()
        except FileNotFoundError:
            raise ArgoCDError("argocd CLI не знайдено. Встановіть ArgoCD client.")

    async def login(self, username: str, password: str) -> bool:
        """Аутентифікуватися до ArgoCD."""
        try:
            await self._run_cmd("login", self.server, "--username", username, "--password", password)
            return True
        except ArgoCDError:
            return False

    async def app_list(self) -> list[dict[str, Any]]:
        """Отримати список всіх Applications."""
        output = await self._run_cmd("app", "list", "-o", "json")
        data = json.loads(output)
        return data if isinstance(data, list) else []

    async def app_status(self, app_name: str) -> dict[str, Any]:
        """Отримати статус Application."""
        output = await self._run_cmd("app", "get", app_name, "-o", "json")
        return json.loads(output)

    async def app_sync(
        self,
        app_name: str,
        prune: bool = True,
        force: bool = False,
    ) -> bool:
        """Синхронізувати Application з репозиторієм."""
        args = ["app", "sync", app_name]
        
        if prune:
            args.append("--prune")
        
        if force:
            args.append("--force")
        
        try:
            await self._run_cmd(*args)
            return True
        except ArgoCDError:
            return False

    async def app_wait(self, app_name: str, timeout: int = 300) -> bool:
        """Чекати поки Application буде синхронізовано."""
        args = ["app", "wait", app_name, f"--timeout={timeout}"]
        
        try:
            await self._run_cmd(*args)
            return True
        except ArgoCDError:
            return False

    async def app_set_parameter(
        self,
        app_name: str,
        parameter: str,
        value: str,
    ) -> bool:
        """Встановити параметр Application."""
        await self._run_cmd(
            "app",
            "set",
            app_name,
            f"--parameter={parameter}={value}",
        )
        return True

    async def app_delete(self, app_name: str, cascade: bool = True) -> bool:
        """Видалити Application."""
        args = ["app", "delete", app_name]
        
        if cascade:
            args.append("--cascade")
        
        # Потребує підтвердження, додаємо --yes
        args.append("--yes")
        
        try:
            await self._run_cmd(*args)
            return True
        except ArgoCDError:
            return False

    async def cluster_list(self) -> list[dict[str, Any]]:
        """Отримати список кластерів."""
        output = await self._run_cmd("cluster", "list", "-o", "json")
        data = json.loads(output)
        return data if isinstance(data, list) else []

    async def repo_list(self) -> list[dict[str, Any]]:
        """Отримати список сховищ."""
        output = await self._run_cmd("repo", "list", "-o", "json")
        data = json.loads(output)
        return data.get("items", []) if isinstance(data, dict) else []


# CLI commands
@typer.command("status")
def cmd_status(app_name: str = typer.Argument(..., help="Application name")) -> None:
    """Отримати статус Application."""
    client = ArgoCDClient()
    try:
        status = asyncio.run(client.app_status(app_name))
        typer.echo(json.dumps(status, indent=2))
    except ArgoCDError as e:
        typer.echo(f"[ARGOCD] Error: {e}", err=True)
        raise typer.Exit(code=1)


@typer.command("sync")
def cmd_sync(
    app_name: str = typer.Argument(..., help="Application name"),
    prune: bool = typer.Option(True, help="Prune resources"),
) -> None:
    """Синхронізувати Application."""
    client = ArgoCDClient()
    try:
        result = asyncio.run(client.app_sync(app_name, prune=prune))
        typer.echo(f"[ARGOCD] Sync '{app_name}': {'✅' if result else '❌'}")
    except ArgoCDError as e:
        typer.echo(f"[ARGOCD] Error: {e}", err=True)
        raise typer.Exit(code=1)


@typer.command("wait")
def cmd_wait(
    app_name: str = typer.Argument(..., help="Application name"),
    timeout: int = typer.Option(300, help="Timeout in seconds"),
) -> None:
    """Чекати синхронізацію."""
    client = ArgoCDClient()
    try:
        result = asyncio.run(client.app_wait(app_name, timeout=timeout))
        status = "завершена" if result else "timeout"
        typer.echo(f"[ARGOCD] '{app_name}' синхронізація: {status}")
    except ArgoCDError as e:
        typer.echo(f"[ARGOCD] Error: {e}", err=True)
        raise typer.Exit(code=1)
```

---

### 1.4 Оновити Infrastructure CLI

**Файл:** `mcp/infrastructure/cli.py` (оновити)

```python
"""CLI для інфраструктури."""
from __future__ import annotations

import asyncio
from typing import Optional

import typer

from mcp.infrastructure.terraform_runner import TerraformRunner
from mcp.infrastructure.helm_deployer import HelmDeployer
from mcp.infrastructure.argocd_client import ArgoCDClient

app = typer.Typer(help="Інфраструктура та деплой")


@app.command("deploy")
def deploy(
    env: str = typer.Argument("dev", help="Середовище (dev/stage/prod)"),
    auto_approve: bool = typer.Option(False, "--auto-approve", help="Auto approve changes"),
) -> None:
    """Запустити Terraform + Helm деплой."""
    typer.echo(f"[INFRA] Запуск деплою для: {env}")
    
    # 1. Terraform
    tf = TerraformRunner("deploy/terraform")
    plan_output = asyncio.run(tf.plan(environment=env))
    typer.echo(f"[INFRA-TF] Plan:\n{plan_output}")
    
    if auto_approve:
        result = asyncio.run(tf.apply(environment=env, auto_approve=True))
        typer.echo(f"[INFRA-TF] Apply: {'✅' if result else '❌'}")
    
    # 2. Helm
    helm = HelmDeployer()
    asyncio.run(helm.repo_update())
    result = asyncio.run(
        helm.upgrade(
            "predator",
            "predator/analytics",
            namespace="predator",
            values_file=f"deploy/helm/values-{env}.yaml",
        )
    )
    typer.echo(f"[INFRA-HELM] Upgrade: {'✅' if result else '❌'}")
    
    # 3. ArgoCD sync
    argocd = ArgoCDClient()
    sync_result = asyncio.run(argocd.app_sync("predator-analytics"))
    typer.echo(f"[INFRA-ARGOCD] Sync: {'✅' if sync_result else '❌'}")


@app.command("diff")
def diff(env: str = typer.Argument("dev", help="Середовище")) -> None:
    """Показати різницю між поточним та новим станом."""
    typer.echo(f"[INFRA] Diff для: {env}")
    
    # Terraform diff
    tf = TerraformRunner("deploy/terraform")
    plan = asyncio.run(tf.plan(environment=env))
    typer.echo(f"[INFRA-TF] Plan output:\n{plan}")
    
    # Helm diff
    helm = HelmDeployer()
    diff_output = asyncio.run(
        helm.diff(
            "predator",
            "predator/analytics",
            values_file=f"deploy/helm/values-{env}.yaml",
        )
    )
    typer.echo(f"[INFRA-HELM] Diff:\n{diff_output}")


@app.command("rollback")
def rollback(
    env: str = typer.Argument("dev", help="Середовище"),
    revision: Optional[int] = typer.Option(None, help="Revision to rollback to"),
) -> None:
    """Відкатити деплой."""
    typer.echo(f"[INFRA] Rollback в: {env}")
    
    helm = HelmDeployer()
    result = asyncio.run(helm.rollback("predator", revision=revision, namespace="predator"))
    typer.echo(f"[INFRA-HELM] Rollback: {'✅' if result else '❌'}")


@app.command("status")
def status(env: str = typer.Argument("dev", help="Середовище")) -> None:
    """Отримати статус деплою."""
    typer.echo(f"[INFRA] Статус для: {env}")
    
    helm = HelmDeployer()
    status_dict = asyncio.run(helm.status("predator", namespace="predator"))
    typer.echo(str(status_dict))
    
    argocd = ArgoCDClient()
    app_status = asyncio.run(argocd.app_status("predator-analytics"))
    typer.echo(f"[INFRA-ARGOCD] App status: {app_status.get('metadata', {}).get('name')} - {app_status.get('status', {}).get('operationState', {}).get('phase', 'unknown')}")


@app.command("sync")
def sync(app: str = typer.Argument("predator-analytics", help="ArgoCD application")) -> None:
    """Синхронізувати ArgoCD application."""
    typer.echo(f"[INFRA] Синхронізація: {app}")
    
    argocd = ArgoCDClient()
    result = asyncio.run(argocd.app_sync(app))
    typer.echo(f"[INFRA-ARGOCD] Sync: {'✅' if result else '❌'}")


if __name__ == "__main__":
    app()
```

---

## 📝 ТЕСТУВАННЯ (Sprint 1)

**Файл:** `tests/test_infrastructure.py`

```python
"""Unit тести для infrastructure層."""
from __future__ import annotations

import pytest
import pytest_asyncio

from mcp.infrastructure.terraform_runner import TerraformRunner, TerraformError
from mcp.infrastructure.helm_deployer import HelmDeployer, HelmError
from mcp.infrastructure.argocd_client import ArgoCDClient, ArgoCDError


@pytest_asyncio.fixture
async def terraform_runner() -> TerraformRunner:
    """Create Terraform runner."""
    return TerraformRunner(".")


@pytest_asyncio.fixture
async def helm_deployer() -> HelmDeployer:
    """Create Helm deployer."""
    return HelmDeployer()


@pytest_asyncio.fixture
async def argocd_client() -> ArgoCDClient:
    """Create ArgoCD client."""
    return ArgoCDClient()


class TestTerraformRunner:
    """Test Terraform executor."""

    def test_init(self, terraform_runner: TerraformRunner) -> None:
        """Test terraform init."""
        # Mock test - підміняємо subprocess
        pass

    def test_plan(self, terraform_runner: TerraformRunner) -> None:
        """Test terraform plan."""
        pass

    def test_apply(self, terraform_runner: TerraformRunner) -> None:
        """Test terraform apply."""
        pass


class TestHelmDeployer:
    """Test Helm deployer."""

    def test_install(self, helm_deployer: HelmDeployer) -> None:
        """Test helm install."""
        pass

    def test_upgrade(self, helm_deployer: HelmDeployer) -> None:
        """Test helm upgrade."""
        pass

    def test_rollback(self, helm_deployer: HelmDeployer) -> None:
        """Test helm rollback."""
        pass


class TestArgoCDClient:
    """Test ArgoCD client."""

    def test_app_sync(self, argocd_client: ArgoCDClient) -> None:
        """Test argocd app sync."""
        pass

    def test_app_status(self, argocd_client: ArgoCDClient) -> None:
        """Test argocd app status."""
        pass
```

---

## ✅ КОНТРОЛЬНИЙ СПИСОК (Sprint 1)

- [ ] Реалізовано `terraform_runner.py` з усіма методами
- [ ] Реалізовано `helm_deployer.py` з усіма методами
- [ ] Реалізовано `argocd_client.py` з усіма методами
- [ ] Оновлено `infrastructure/cli.py` з real командами
- [ ] Додано unit тести для кожного модуля
- [ ] Всі тести проходять локально
- [ ] Ruff lint пройшов без помилок (`ruff check mcp-platform/`)
- [ ] Mypy пройшов strict mode (`mypy mcp-platform/mcp/infrastructure --strict`)
- [ ] Додано до git (`git add mcp-platform/mcp/infrastructure`)
- [ ] Commit з message: `feat(infra): реалізувати terraform, helm, argocd executor`

---

## 🚀 НАСТУПНІ МОДУЛІ

Після Sprint 1 перейти до:
- **Sprint 2:** AI Layer (codegen, orchestrator, autogen_client)
- **Sprint 3:** Code Analysis (tree_sitter, semgrep, sonarqube)
- **Sprint 4:** Meta-Controller Decision Engine
- ...і так далі

Детальні приклади для кожного спринту будуть додані в **окремих файлах**.

---

**Status**: Ready for Implementation ✅
**Last Updated**: 17 березня 2026 р.

