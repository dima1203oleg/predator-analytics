"""Terraform executor для IaC операцій.

Модуль забезпечує async-based виконання terraform команд з error handling.
"""
from __future__ import annotations

import asyncio
import json
import os
import subprocess
from pathlib import Path
from typing import Any, Optional

import typer


class TerraformError(Exception):
    """Базова помилка для Terraform операцій."""

    pass


class TerraformRunner:
    """Executor для terraform команд з async/await підтримкою."""

    def __init__(self, work_dir: str = ".") -> None:
        """Ініціалізувати Terraform runner.
        
        Args:
            work_dir: Робочий каталог для terraform
            
        Raises:
            TerraformError: Якщо каталог не існує
        """
        self.work_dir = Path(work_dir)
        if not self.work_dir.exists():
            raise TerraformError(f"Робочий каталог не існує: {self.work_dir}")

    async def _run_cmd(
        self,
        *args: str,
        capture_output: bool = True,
    ) -> tuple[str, str]:
        """Виконати terraform команду асинхронно.
        
        Args:
            *args: Аргументи для terraform
            capture_output: Чи захоплювати вивід
            
        Returns:
            Кортеж (stdout, stderr)
            
        Raises:
            TerraformError: Якщо команда завершиться з помилкою
        """
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
                err_msg = stderr.decode() if stderr else "Невідома помилка"
                raise TerraformError(f"Terraform помилка: {err_msg}")

            return (
                stdout.decode() if stdout else "",
                stderr.decode() if stderr else "",
            )
        except FileNotFoundError as e:
            raise TerraformError(
                "terraform CLI не знайдено. Встановіть terraform."
            ) from e

    async def init(
        self, backend_config: Optional[dict[str, str]] = None
    ) -> bool:
        """Ініціалізувати terraform backend.
        
        Args:
            backend_config: Конфіг backend'а (ключ-значення)
            
        Returns:
            True якщо успішно
        """
        args = ["init", "-no-color"]

        if backend_config:
            for key, value in backend_config.items():
                args.extend(["-backend-config", f"{key}={value}"])

        stdout, _ = await self._run_cmd(*args)
        return "successfully initialized" in stdout.lower()

    async def validate(self) -> bool:
        """Провести terraform validate.
        
        Returns:
            True якщо конфіг коректний
        """
        try:
            await self._run_cmd("validate")
            return True
        except TerraformError:
            return False

    async def fmt_check(self, recursive: bool = True) -> tuple[bool, str]:
        """Перевірити terraform форматування.
        
        Args:
            recursive: Рекурсивно перевіряти всі файли
            
        Returns:
            Кортеж (успіх, повідомлення)
        """
        args = ["fmt", "-check"]
        if recursive:
            args.append("-recursive")

        try:
            await self._run_cmd(*args)
            return True, "Форматування OK"
        except TerraformError as e:
            return False, str(e)

    async def plan(
        self,
        environment: str = "dev",
        out_file: Optional[str] = None,
        var_file: Optional[str] = None,
    ) -> str:
        """Запустити terraform plan для вибраного окруження.
        
        Args:
            environment: Назва окруження
            out_file: Файл для збереження плану
            var_file: Файл змінних (за замовчуванням {environment}.tfvars)
            
        Returns:
            Вивід плану
            
        Raises:
            TerraformError: Якщо план не можна створити
        """
        if var_file is None:
            var_file = str(self.work_dir / f"{environment}.tfvars")

        if not Path(var_file).exists():
            raise TerraformError(f"Файл змінних не знайдено: {var_file}")

        args = [
            "plan",
            "-no-color",
            f"-var-file={var_file}",
            "-input=false",
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
        var_file: Optional[str] = None,
    ) -> bool:
        """Застосувати terraform changes.
        
        Args:
            environment: Назва окруження
            auto_approve: Автоматично схвалити
            plan_file: Файл плану для застосування
            var_file: Файл змінних
            
        Returns:
            True якщо успішно
        """
        args = ["apply", "-no-color"]

        if auto_approve:
            args.append("-auto-approve")

        if plan_file:
            args.append(plan_file)
        else:
            if var_file is None:
                var_file = str(self.work_dir / f"{environment}.tfvars")
            if Path(var_file).exists():
                args.extend([f"-var-file={var_file}"])

        stdout, _ = await self._run_cmd(*args)
        return "apply complete" in stdout.lower()

    async def destroy(
        self,
        environment: str = "dev",
        auto_approve: bool = False,
        var_file: Optional[str] = None,
    ) -> bool:
        """Знищити terraform-керовані ресурси.
        
        Args:
            environment: Назва окруження
            auto_approve: Автоматично схвалити
            var_file: Файл змінних
            
        Returns:
            True якщо успішно
        """
        args = ["destroy", "-no-color"]

        if auto_approve:
            args.append("-auto-approve")

        if var_file is None:
            var_file = str(self.work_dir / f"{environment}.tfvars")
        if Path(var_file).exists():
            args.extend([f"-var-file={var_file}"])

        stdout, _ = await self._run_cmd(*args)
        return "destroy complete" in stdout.lower()

    async def output(
        self, name: Optional[str] = None, json_format: bool = True
    ) -> dict[str, Any] | str:
        """Отримати terraform output values.
        
        Args:
            name: Назва output для отримання
            json_format: Повернути JSON або рядок
            
        Returns:
            Dict якщо json_format, інакше рядок
        """
        args = ["output"]

        if json_format:
            args.append("-json")

        if name:
            args.append(name)

        stdout, _ = await self._run_cmd(*args)

        if json_format and not name:
            try:
                return json.loads(stdout)
            except json.JSONDecodeError:
                return {}

        return stdout

    async def state_list(self) -> list[str]:
        """Отримати список ресурсів у state.
        
        Returns:
            Список адрес ресурсів
        """
        try:
            stdout, _ = await self._run_cmd("state", "list")
            return [line.strip() for line in stdout.split("\n") if line.strip()]
        except TerraformError:
            return []

    async def state_show(self, address: str) -> dict[str, Any]:
        """Показати деталі ресурсу у state.
        
        Args:
            address: Адреса ресурсу
            
        Returns:
            JSON представлення ресурсу
        """
        try:
            stdout, _ = await self._run_cmd("state", "show", "-json", address)
            return json.loads(stdout)
        except (TerraformError, json.JSONDecodeError):
            return {}
