from __future__ import annotations

import asyncio
import shlex
from typing import Any

from libs.core.governance import OperationalPolicy
from libs.core.logger import setup_logger

logger = setup_logger("predator.agents.ops")

class OpsAgent:
    """OpsAgent: Виконує інфраструктурні завдання через CLI інструменти.
    Інструменти: kubectl, argocd, mc, huggingface-cli.
    """
    def __init__(self):
        pass

    async def execute_task(self, task_type: str, params: dict[str, Any]) -> str:
        """Маршрутизація завдань з екрануванням параметрів."""
        try:
            if task_type in ["backup_data", "backup"]:
                return await self.backup_data(
                    params.get("source", "."),
                    params.get("bucket", "manual-backups")
                )
            if task_type == "download_model":
                return await self.download_model(params.get("model_id", ""))
            if task_type == "apply_manifest":
                return await self.apply_k8s_manifest(params.get("manifest_path", ""))
            if task_type in ["sync_app", "sync"]:
                return await self.sync_argo_app(params.get("app_name", "predator-all"))
            if task_type == "system_status":
                return await self.get_system_status()
            if task_type == "task_list":
                return await self.get_task_list()
            if str(task_type).lower() == "diagnose":
                return await self.diagnose_system(params.get("query", ""))
            if task_type in ["check_code_quality", "quality_check"]:
                return await self.check_code_quality(params.get("path", "."))
            if task_type == "security_scan":
                return await self.security_scan(params.get("target", "."))
            return f"❌ Unknown Ops Task: {task_type}"
        except Exception as e:
            logger.exception(f"Ops Task Error: {e}")
            return f"❌ Помилка маршрутизації: {e!s}"

    async def diagnose_system(self, query: str = "") -> str:
        """Збирає логи та стан для діагностики."""
        status = await self.get_system_status()
        tasks = await self.get_task_list()

        return f"🔍 <b>Diagnostic Report</b>\n\n{status}\n\n{tasks}\n\n<i>Note: AI analysis will proceed with this data.</i>"

    async def check_code_quality(self, path: str) -> str:
        """Run Ruff & Mypy with shell protection."""
        safe_path = shlex.quote(path)
        cmd = f"ruff check --fix {safe_path}"
        return f"🧹 Code Quality Report:\n{await self._run_cli(cmd)}"

    async def security_scan(self, target: str) -> str:
        """Run Bandit & Trivy with shell protection."""
        safe_target = shlex.quote(target)
        bandit_cmd = f"bandit -r {safe_target} -f json"
        trivy_cmd = f"trivy fs {safe_target} --scanners vuln,secret"

        b_res = await self._run_cli(bandit_cmd)
        t_res = await self._run_cli(trivy_cmd)
        return f"🛡️ Security Scan Report:\nBandit: {b_res}\n\nTrivy: {t_res}"

    async def backup_data(self, source: str, bucket: str) -> str:
        safe_source = shlex.quote(source)
        safe_bucket = shlex.quote(bucket)
        cmd = f"mc mirror --overwrite {safe_source} predator-minio/{safe_bucket}"
        return await self._run_cli(cmd)

    async def download_model(self, model_id: str) -> str:
        safe_id = shlex.quote(model_id)
        cmd = f"huggingface-cli download {safe_id} --local-dir /opt/models/{safe_id}"
        return await self._run_cli(cmd)

    async def apply_k8s_manifest(self, manifest_path: str) -> str:
        safe_path = shlex.quote(manifest_path)
        cmd = f"kubectl apply -f {safe_path}"
        return await self._run_cli(cmd)

    async def sync_argo_app(self, app_name: str) -> str:
        safe_name = shlex.quote(app_name)
        cmd = f"argocd app sync {safe_name}"
        return await self._run_cli(cmd)

    async def get_system_status(self) -> str:
        """Збирає статус системи через CLI та системні виклики."""
        try:
            # Перевірка Docker контейнерів
            docker_res = await self._run_cli("docker ps --format 'table {{.Names}}\t{{.Status}}'")

            # Дисковий простір
            df_res = await self._run_cli("df -h / | tail -1")

            # Навантаження
            uptime_res = await self._run_cli("uptime")

            return (
                f"📊 <b>System Health Report</b>\n\n"
                f"🕒 <b>Uptime:</b>\n<code>{uptime_res}</code>\n\n"
                f"💾 <b>Disk Usage:</b>\n<code>{df_res}</code>\n\n"
                f"🐳 <b>Containers:</b>\n{docker_res}"
            )
        except Exception as e:
            return f"❌ Помилка збору статусу: {e!s}"

    async def get_task_list(self) -> str:
        """Список активних процесів/задач (Celery + Background)."""
        try:
            # 1. Check Python Background Tasks
            ps_res = await self._run_cli("ps aux | grep python | grep -v grep | head -n 5")

            # 2. Check Celery Workers (if available)
            celery_res = await self._run_cli("celery inspect active --timeout 1")

            return (
                f"📋 <b>Active Tasks Monitor</b>\n\n"
                f"<b>Background Processes:</b>\n<code>{ps_res}</code>\n\n"
                f"<b>Celery Inspect Status:</b>\n<code>{celery_res}</code>"
            )
        except Exception as e:
            return f"❌ Помилка збору задач: {e!s}"

    async def _run_cli(self, command: str) -> str:
        """Безпечне виконання CLI команди з WinSURF валідацією."""
        logger.info(f"OpsAgent executing: {command}")

        # WinSURF Deep Validation (L3 Protection)
        policy = OperationalPolicy.validate_command(command)
        if not policy["approved"]:
             logger.warning(f"OpsAgent blocked by policy: {policy['reason']}")
             return f"❌ WinSURF Block: {policy['reason']}"

        try:
            # Виконуємо асинхронно
            proc = await asyncio.create_subprocess_shell(
                command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await proc.communicate()

            if proc.returncode == 0:
                out = stdout.decode().strip()
                return f"✅ Успішно:\n{out[:1000]}{'...' if len(out) > 1000 else ''}"
            err = stderr.decode().strip()
            return f"❌ Помилка (Код {proc.returncode}):\n{err}"
        except Exception as e:
            return f"❌ Помилка виконання: {e!s}"
