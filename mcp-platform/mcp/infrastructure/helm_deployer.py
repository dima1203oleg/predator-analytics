"""Helm deployment executor.

Модуль забезпечує async-based виконання helm команд для K8s deployment.
"""
from __future__ import annotations

import asyncio
import json
from typing import Any, Optional

import typer


class HelmError(Exception):
    """Базова помилка для Helm операцій."""

    pass


class HelmDeployer:
    """Executor для helm команд з async/await підтримкою."""

    def __init__(self) -> None:
        """Ініціалізувати Helm deployer."""
        self.helm_cmd = "helm"

    async def _run_cmd(
        self,
        *args: str,
        capture_output: bool = True,
    ) -> tuple[str, str]:
        """Виконати helm команду асинхронно.
        
        Args:
            *args: Аргументи для helm
            capture_output: Чи захоплювати вивід
            
        Returns:
            Кортеж (stdout, stderr)
            
        Raises:
            HelmError: Якщо команда завершиться з помилкою
        """
        cmd = [self.helm_cmd, *args]

        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE if capture_output else None,
                stderr=asyncio.subprocess.PIPE if capture_output else None,
            )
            stdout, stderr = await proc.communicate()

            if proc.returncode != 0:
                err_msg = stderr.decode() if stderr else "Невідома помилка"
                raise HelmError(f"Helm помилка: {err_msg}")

            return (
                stdout.decode() if stdout else "",
                stderr.decode() if stderr else "",
            )
        except FileNotFoundError as e:
            raise HelmError(
                "helm CLI не знайдено. Встановіть helm."
            ) from e

    async def repo_add(self, name: str, url: str) -> bool:
        """Додати helm repository.
        
        Args:
            name: Назва репозиторію
            url: URL репозиторію
            
        Returns:
            True якщо успішно
        """
        try:
            await self._run_cmd("repo", "add", name, url)
            return True
        except HelmError:
            return False

    async def repo_update(self) -> bool:
        """Оновити helm repositories.
        
        Returns:
            True якщо успішно
        """
        try:
            await self._run_cmd("repo", "update")
            return True
        except HelmError:
            return False

    async def install(
        self,
        release: str,
        chart: str,
        namespace: str = "default",
        values: Optional[dict[str, Any]] = None,
        values_file: Optional[str] = None,
        create_namespace: bool = True,
    ) -> bool:
        """Встановити helm release.
        
        Args:
            release: Назва release
            chart: Назва chart
            namespace: Kubernetes namespace
            values: Словник значень
            values_file: Файл values.yaml
            create_namespace: Створити namespace якщо не існує
            
        Returns:
            True якщо успішно
        """
        args = ["install", release, chart, "-n", namespace]

        if create_namespace:
            args.append("--create-namespace")

        if values:
            for key, val in values.items():
                args.extend(["--set", f"{key}={val}"])

        if values_file:
            args.extend(["-f", values_file])

        try:
            await self._run_cmd(*args)
            return True
        except HelmError:
            return False

    async def upgrade(
        self,
        release: str,
        chart: str,
        namespace: str = "default",
        values: Optional[dict[str, Any]] = None,
        values_file: Optional[str] = None,
        force: bool = False,
        force_recreate: bool = False,
    ) -> bool:
        """Оновити helm release.
        
        Args:
            release: Назва release
            chart: Назва chart
            namespace: Kubernetes namespace
            values: Словник значень
            values_file: Файл values.yaml
            force: Примусово оновити
            force_recreate: Видалити та створити заново
            
        Returns:
            True якщо успішно
        """
        args = ["upgrade", release, chart, "-n", namespace]

        if force:
            args.append("--force")

        if force_recreate:
            args.append("--force-recreate")

        if values:
            for key, val in values.items():
                args.extend(["--set", f"{key}={val}"])

        if values_file:
            args.extend(["-f", values_file])

        try:
            await self._run_cmd(*args)
            return True
        except HelmError:
            return False

    async def uninstall(self, release: str, namespace: str = "default") -> bool:
        """Видалити helm release.
        
        Args:
            release: Назва release
            namespace: Kubernetes namespace
            
        Returns:
            True якщо успішно
        """
        try:
            await self._run_cmd("uninstall", release, "-n", namespace)
            return True
        except HelmError:
            return False

    async def status(
        self, release: str, namespace: str = "default"
    ) -> dict[str, Any]:
        """Отримати статус release.
        
        Args:
            release: Назва release
            namespace: Kubernetes namespace
            
        Returns:
            Словник зі статусом
        """
        try:
            stdout, _ = await self._run_cmd(
                "status", release, "-n", namespace, "-o", "json"
            )
            return json.loads(stdout)
        except (HelmError, json.JSONDecodeError):
            return {}

    async def diff(
        self,
        release: str,
        chart: str,
        namespace: str = "default",
        values_file: Optional[str] = None,
    ) -> str:
        """Показати diff для upgrade.
        
        Потребує helm-diff plugin.
        
        Args:
            release: Назва release
            chart: Назва chart
            namespace: Kubernetes namespace
            values_file: Файл values.yaml
            
        Returns:
            Diff вивід
        """
        args = ["diff", "upgrade", release, chart, "-n", namespace]

        if values_file:
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
        """Відкатити до попередньої версії.
        
        Args:
            release: Назва release
            revision: Номер revision для відката
            namespace: Kubernetes namespace
            
        Returns:
            True якщо успішно
        """
        args = ["rollback", release]

        if revision is not None:
            args.append(str(revision))

        args.extend(["-n", namespace])

        try:
            await self._run_cmd(*args)
            return True
        except HelmError:
            return False

    async def list_releases(
        self, namespace: str = "default"
    ) -> list[dict[str, Any]]:
        """Список всіх releases у namespace.
        
        Args:
            namespace: Kubernetes namespace
            
        Returns:
            Список релізів
        """
        try:
            stdout, _ = await self._run_cmd("list", "-n", namespace, "-o", "json")
            data = json.loads(stdout)
            return data.get("releases", []) if isinstance(data, dict) else []
        except (HelmError, json.JSONDecodeError):
            return []

    async def get_values(
        self, release: str, namespace: str = "default"
    ) -> dict[str, Any]:
        """Отримати поточні values release.
        
        Args:
            release: Назва release
            namespace: Kubernetes namespace
            
        Returns:
            Словник values
        """
        try:
            stdout, _ = await self._run_cmd(
                "get", "values", release, "-n", namespace, "-o", "json"
            )
            return json.loads(stdout)
        except (HelmError, json.JSONDecodeError):
            return {}

    async def get_manifest(
        self, release: str, namespace: str = "default"
    ) -> str:
        """Отримати manifest release.
        
        Args:
            release: Назва release
            namespace: Kubernetes namespace
            
        Returns:
            YAML manifest
        """
        try:
            stdout, _ = await self._run_cmd(
                "get", "manifest", release, "-n", namespace
            )
            return stdout
        except HelmError:
            return ""

    async def history(
        self, release: str, namespace: str = "default"
    ) -> list[dict[str, Any]]:
        """Отримати історію релізів.
        
        Args:
            release: Назва release
            namespace: Kubernetes namespace
            
        Returns:
            Список ревізій
        """
        try:
            stdout, _ = await self._run_cmd(
                "history", release, "-n", namespace, "-o", "json"
            )
            data = json.loads(stdout)
            return data.get("releases", []) if isinstance(data, dict) else []
        except (HelmError, json.JSONDecodeError):
            return []
