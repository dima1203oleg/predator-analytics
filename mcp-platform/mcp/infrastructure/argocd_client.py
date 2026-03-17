"""ArgoCD GitOps sync client.

Модуль забезпечує async-based виконання argocd команд для GitOps deployment.
"""
from __future__ import annotations

import asyncio
import json
from typing import Any, Optional


class ArgoCDError(Exception):
    """Базова помилка для ArgoCD операцій."""

    pass


class ArgoCDClient:
    """Client для ArgoCD операцій з async/await підтримкою."""

    def __init__(self, server: str = "localhost:8080", insecure: bool = True) -> None:
        """Ініціалізувати ArgoCD client.
        
        Args:
            server: ArgoCD server адреса
            insecure: Ігнорувати SSL сертифікати
        """
        self.server = server
        self.insecure = insecure

    async def _run_cmd(self, *args: str) -> str:
        """Виконати argocd команду асинхронно.
        
        Args:
            *args: Аргументи для argocd
            
        Returns:
            Вивід команди
            
        Raises:
            ArgoCDError: Якщо команда завершиться з помилкою
        """
        cmd = ["argocd"]

        if self.insecure:
            cmd.extend(["--insecure", "--plaintext"])

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
                err_msg = stderr.decode() if stderr else "Невідома помилка"
                raise ArgoCDError(f"ArgoCD помилка: {err_msg}")

            return stdout.decode()
        except FileNotFoundError as e:
            raise ArgoCDError(
                "argocd CLI не знайдено. Встановіть ArgoCD client."
            ) from e

    async def login(
        self, username: str, password: str
    ) -> bool:
        """Аутентифікуватися до ArgoCD.
        
        Args:
            username: Ім'я користувача
            password: Пароль
            
        Returns:
            True якщо успішно
        """
        try:
            await self._run_cmd(
                "login", self.server,
                "--username", username,
                "--password", password,
            )
            return True
        except ArgoCDError:
            return False

    async def app_list(self) -> list[dict[str, Any]]:
        """Отримати список всіх Applications.
        
        Returns:
            Список applications
        """
        try:
            output = await self._run_cmd("app", "list", "-o", "json")
            data = json.loads(output)
            return data if isinstance(data, list) else []
        except (ArgoCDError, json.JSONDecodeError):
            return []

    async def app_status(self, app_name: str) -> dict[str, Any]:
        """Отримати статус Application.
        
        Args:
            app_name: Назва application
            
        Returns:
            Словник зі статусом
        """
        try:
            output = await self._run_cmd("app", "get", app_name, "-o", "json")
            return json.loads(output)
        except (ArgoCDError, json.JSONDecodeError):
            return {}

    async def app_sync(
        self,
        app_name: str,
        prune: bool = True,
        force: bool = False,
        wait_for_completion: bool = False,
    ) -> bool:
        """Синхронізувати Application з репозиторієм.
        
        Args:
            app_name: Назва application
            prune: Видалити ресурси які не в git
            force: Примусово синхронізувати
            wait_for_completion: Чекати завершення
            
        Returns:
            True якщо успішно
        """
        args = ["app", "sync", app_name]

        if prune:
            args.append("--prune")

        if force:
            args.append("--force")

        if wait_for_completion:
            args.append("--wait")

        try:
            await self._run_cmd(*args)
            return True
        except ArgoCDError:
            return False

    async def app_wait(
        self, app_name: str, timeout: int = 300
    ) -> bool:
        """Чекати поки Application буде синхронізовано.
        
        Args:
            app_name: Назва application
            timeout: Timeout у секундах
            
        Returns:
            True якщо успішно
        """
        args = ["app", "wait", app_name, f"--timeout={timeout}"]

        try:
            await self._run_cmd(*args)
            return True
        except ArgoCDError:
            return False

    async def app_get_resource(
        self, app_name: str, resource: str
    ) -> dict[str, Any]:
        """Отримати деталі ресурсу Application.
        
        Args:
            app_name: Назва application
            resource: Ресурс адреса (e.g., "pod/my-pod")
            
        Returns:
            Словник з деталями ресурсу
        """
        try:
            output = await self._run_cmd(
                "app", "get-resource", app_name,
                "--resource", resource,
            )
            return json.loads(output)
        except (ArgoCDError, json.JSONDecodeError):
            return {}

    async def app_set_parameter(
        self,
        app_name: str,
        parameter: str,
        value: str,
    ) -> bool:
        """Встановити параметр Application.
        
        Args:
            app_name: Назва application
            parameter: Параметр (e.g., "image.tag")
            value: Значення
            
        Returns:
            True якщо успішно
        """
        try:
            await self._run_cmd(
                "app",
                "set",
                app_name,
                f"--parameter={parameter}={value}",
            )
            return True
        except ArgoCDError:
            return False

    async def app_delete(
        self, app_name: str, cascade: bool = True
    ) -> bool:
        """Видалити Application.
        
        Args:
            app_name: Назва application
            cascade: Каскадне видалення
            
        Returns:
            True якщо успішно
        """
        args = ["app", "delete", app_name, "--yes"]

        if cascade:
            args.append("--cascade")

        try:
            await self._run_cmd(*args)
            return True
        except ArgoCDError:
            return False

    async def repo_list(self) -> list[dict[str, Any]]:
        """Отримати список сховищ.
        
        Returns:
            Список репозиторіїв
        """
        try:
            output = await self._run_cmd("repo", "list", "-o", "json")
            data = json.loads(output)
            return data.get("items", []) if isinstance(data, dict) else []
        except (ArgoCDError, json.JSONDecodeError):
            return []

    async def cluster_list(self) -> list[dict[str, Any]]:
        """Отримати список кластерів.
        
        Returns:
            Список кластерів
        """
        try:
            output = await self._run_cmd("cluster", "list", "-o", "json")
            data = json.loads(output)
            return data.get("items", []) if isinstance(data, dict) else []
        except (ArgoCDError, json.JSONDecodeError):
            return []

    async def version(self) -> dict[str, str]:
        """Отримати версію ArgoCD сервера.
        
        Returns:
            Словник з версіями
        """
        try:
            output = await self._run_cmd("version")
            # Парс вивіду версії
            lines = output.strip().split("\n")
            result = {}
            for line in lines:
                if ":" in line:
                    key, val = line.split(":", 1)
                    result[key.strip()] = val.strip()
            return result
        except ArgoCDError:
            return {}
