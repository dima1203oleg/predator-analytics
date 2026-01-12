"""
Telegram AI Assistant v2.0 - Покращений помічник для управління сервером
Handles:
- Автоматичний парсинг ngrok URLs
- Оновлення SSH конфігу
- Управління сервером через природну мову
- Інтерактивне меню з inline кнопками
- АВТОМАТИЧНЕ ВИКОНАННЯ ЗАДАЧ після підтвердження
- Віддалене управління NVIDIA сервером
"""
import re
import os
import json
import asyncio
import subprocess
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, timezone
import time
from dataclasses import dataclass
from enum import Enum
import logging
import httpx

from .llm import llm_service
from .ai_engine import ai_engine
from .telegram_menu import menu_builder, message_formatter
from .telegram_executor import task_executor, TaskCategory
from .remote_server import remote_server
from libs.core.models.entities import DataSource
from libs.core.database import get_db_ctx
from sqlalchemy import select

logger = logging.getLogger(__name__)


class MessageType(Enum):
    NGROK_UPDATE = "ngrok_update"
    COMMAND = "command"
    QUERY = "query"
    CALLBACK = "callback"


@dataclass
class NgrokInfo:
    """Parsed ngrok information"""
    ssh_host: str
    ssh_port: int
    http_url: str
    raw_message: str
    parsed_at: datetime


@dataclass
class ServerAction:
    """Server action result"""
    action: str
    success: bool
    output: str
    error: Optional[str] = None


class TelegramAssistant:
    """
    Інтелектуальний Telegram асистент для Predator Analytics
    """

    def __init__(self, token: str):
        self.token = token
        self.api_url = f"https://api.telegram.org/bot{token}"
        self.enabled = bool(token)
        self.last_ngrok: Optional[NgrokInfo] = None
        # Authorized Telegram user IDs (comma separated in env var) — used for sensitive commands
        auth_env = os.getenv("TELEGRAM_AUTHORIZED_USERS", "")
        if auth_env:
            try:
                self.authorized_users: List[int] = [int(x.strip()) for x in auth_env.split(",") if x.strip()]
            except Exception:
                self.authorized_users: List[int] = []
        else:
            self.authorized_users: List[int] = []  # Will be populated from config

        # SSH config path на Mac
        self.ssh_config_path = os.path.expanduser("~/.ssh/config")
        # AUTO_RESTART flag
        self.auto_restart_ngrok = os.getenv("AUTO_RESTART_NGROK", "false").lower() in ("1", "true", "yes")
        self.auto_deploy_on_up = os.getenv("AUTO_DEPLOY_ON_UP", "false").lower() in ("1", "true", "yes")
        self.auto_rollback_on_degrade = os.getenv("AUTO_ROLLBACK_ON_DEGRADE", "false").lower() in ("1", "true", "yes")
        # State persistence file (keep runtime toggles persistent between bot restarts)
        self.state_file_path = os.path.expanduser(os.getenv("PREDATOR_TELEGRAM_STATE", "~/.predator_bot_state.json"))
        # Load persisted toggles if present
        try:
            if os.path.exists(self.state_file_path):
                with open(self.state_file_path, 'r') as sf:
                    data = json.load(sf)
                    if 'auto_restart_ngrok' in data:
                        self.auto_restart_ngrok = bool(data['auto_restart_ngrok'])
                    if 'auto_deploy_on_up' in data:
                        self.auto_deploy_on_up = bool(data['auto_deploy_on_up'])
        except Exception:
            # Do not fail on read errors; default to env values
            logger.debug('Failed to load bot state file or invalid JSON')

        # Audit log path
        self.audit_log_path = os.path.expanduser(os.getenv('PREDATOR_TELEGRAM_AUDIT', '~/.predator_bot_audit.log'))
        # runtime context for requests (filled while processing an update)
        self.requesting_user_id: Optional[int] = None
        # optional default chat id to use for async notifications
        try:
            self.default_chat_id = int(os.getenv('TELEGRAM_CHAT_ID', '0')) or None
        except Exception:
            self.default_chat_id = None

        # Команди системи
        self.system_commands = {
            # Серверні команди
            "status": self._cmd_server_status,
            "disk": self._cmd_disk_usage,
            "sysinfo": self._cmd_sysinfo,
            "memory": self._cmd_memory_usage,
            "cpu": self._cmd_cpu_usage,
            "uptime": self._cmd_uptime,
            "docker": self._cmd_docker_status,
            "k8s": self._cmd_kubernetes_status,
            "pods": self._cmd_kubernetes_pods,
            "services": self._cmd_services_status,
            "logs": self._cmd_logs,

            # Мережеві
            "ngrok": self._cmd_ngrok_info,
            "ssh": self._cmd_ssh_config,
            "connect": self._cmd_connect_info,

            # Git/Deploy
            "git": self._cmd_git_status,
            "deploy": self._cmd_deploy_status,
            "restart": self._cmd_restart_services,
            "restart_ngrok": self._cmd_restart_ngrok,
            "argocd": self._cmd_argocd_status,
            "argocd_sync": self._cmd_argocd_sync,
            "argocd_apps": self._cmd_argocd_list,
            "argocd_probe": self._cmd_argocd_probe,
            "k8s_dump": self._cmd_k8s_dump,
            "auto_deploy": self._cmd_auto_deploy,
            "argocd_sync_status": self._cmd_argocd_sync_status,
            "auto_rollback": self._cmd_auto_rollback,
            "argocd_rollback": self._cmd_argocd_rollback,

            # AI
            "search": self._cmd_ai_search,
            "analyze": self._cmd_ai_analyze,
            "datasets": self._cmd_datasets,
            "ingest": self._cmd_ingest,
            "job": self._cmd_job_status,

            # Setup/Configuration (NEW)
            "add_key": self._cmd_add_key,
            "set_model": self._cmd_set_model,
            "auto_restart": self._cmd_auto_restart,
            "predator": self._cmd_predator_cli,

            # Queues (V25)
            "queues": self._cmd_queue_status,
            "purge": self._cmd_purge_queue,
        }

        # Keyboard layouts (використовуємо нову систему меню)
        self.main_menu_keyboard = menu_builder.build_quick_actions_keyboard()
        self.inline_menu = menu_builder.build_main_menu()

        # Task executor для автоматичного виконання
        self.task_executor = task_executor

        # Меню для підменю
        self.menu_builder = menu_builder
        self.message_formatter = message_formatter

    # ==================== ARGOCD HELPERS ====================
    def _get_argocd_credentials(self, target: str = "") -> Tuple[Optional[str], Optional[str]]:
        """Return (server_url, token) pair for a given target (mac, nvidia, oracle) or fallback to ARGOCD_SERVER/TOKEN"""
        if not target:
            # fallback to generic env
            server = os.getenv("ARGOCD_SERVER") or os.getenv("ARGOCD_URL")
            token = os.getenv("ARGOCD_TOKEN") or os.getenv("ARGOCD_API_TOKEN")
            return server, token

        target_upper = target.upper()
        server = os.getenv(f"ARGOCD_{target_upper}_URL") or os.getenv("ARGOCD_SERVER")
        token = os.getenv(f"ARGOCD_{target_upper}_TOKEN") or os.getenv(f"ARGOCD_{target_upper}_PASSWORD") or os.getenv("ARGOCD_TOKEN")
        return server, token

    async def _cmd_auto_deploy(self, args: str) -> str:
        """Toggle AUTO_DEPLOY_ON_UP. Usage: /auto_deploy on|off|status"""
        parts = args.strip().lower().split()
        if not parts or parts[0] == "status":
            return f"🔁 AUTO_DEPLOY_ON_UP: {self.auto_deploy_on_up}"

        # For toggle operations we require auth
        if not self._is_requesting_user_authorized():
            return "❌ Тільки авторизовані користувачі можуть змінювати налаштування автоматизації."

        if parts[0] in ("on", "true", "1"):
            self.auto_deploy_on_up = True
            try:
                with open(self.state_file_path, 'w') as sf:
                    json.dump({'auto_deploy_on_up': True, 'auto_restart_ngrok': self.auto_restart_ngrok}, sf)
            except Exception:
                logger.debug('Failed to persist bot state')
            return "✅ AUTO_DEPLOY_ON_UP встановлено у: true"
        elif parts[0] in ("off", "false", "0"):
            self.auto_deploy_on_up = False
            try:
                with open(self.state_file_path, 'w') as sf:
                    json.dump({'auto_deploy_on_up': False, 'auto_restart_ngrok': self.auto_restart_ngrok}, sf)
            except Exception:
                logger.debug('Failed to persist bot state')
            return "✅ AUTO_DEPLOY_ON_UP встановлено у: false"
        else:
            return "❌ Невірна команда. Використовуйте: /auto_deploy on|off|status"

    async def _cmd_auto_rollback(self, args: str) -> str:
        """Toggle AUTO_ROLLBACK_ON_DEGRADE. Usage: /auto_rollback on|off|status"""
        if not self._is_requesting_user_authorized():
            return "❌ Тільки авторизовані користувачі можуть змінювати налаштування автоматизації."

        parts = args.strip().lower().split()
        if not parts or parts[0] == "status":
            return f"↩️ AUTO_ROLLBACK_ON_DEGRADE: {self.auto_rollback_on_degrade}"

        if parts[0] in ("on", "true", "1"):
            self.auto_rollback_on_degrade = True
            self._save_bot_state()
            return "✅ AUTO_ROLLBACK_ON_DEGRADE встановлено у: true"
        elif parts[0] in ("off", "false", "0"):
            self.auto_rollback_on_degrade = False
            self._save_bot_state()
            return "✅ AUTO_ROLLBACK_ON_DEGRADE встановлено у: false"
        else:
            return "❌ Невірна команда. Використовуйте: /auto_rollback on|off|status"

    def _save_bot_state(self):
        """Зберігає стан бота у файл"""
        try:
            with open(self.state_file_path, 'w') as sf:
                json.dump({
                    'auto_deploy_on_up': self.auto_deploy_on_up,
                    'auto_restart_ngrok': self.auto_restart_ngrok,
                    'auto_rollback_on_degrade': getattr(self, 'auto_rollback_on_degrade', False)
                }, sf)
        except Exception:
            logger.debug('Failed to persist bot state')

    async def _call_argocd_api(self, server: str, token: str, method: str, path: str = "", json_payload: dict = None) -> Tuple[bool, Any]:
        """Call ArgoCD REST API using httpx; returns (success, result_or_error)."""
        if not server or not token:
            return False, "Missing ArgoCD server or token"
        url = server.rstrip("/") + "/api/v1" + (path if path.startswith("/") else ("/" + path if path else ""))
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        try:
            verify = os.getenv("ARGOCD_INSECURE", "false").lower() not in ("1", "true", "yes")
            # Retry around transient network issues
            retries = int(os.getenv("ARGOCD_API_RETRIES", "3"))
            backoff = float(os.getenv("ARGOCD_API_BACKOFF", "1.0"))
            last_err = None
            async with httpx.AsyncClient(timeout=30, verify=verify) as client:
                for attempt in range(1, retries+1):
                    try:
                        if method.upper() == "GET":
                            r = await client.get(url, headers=headers)
                        elif method.upper() == "POST":
                            r = await client.post(url, headers=headers, json=json_payload or {})
                        elif method.upper() == "PUT":
                            r = await client.put(url, headers=headers, json=json_payload or {})
                        else:
                            return False, f"Unsupported method: {method}"
                        # got response, break
                        break
                    except Exception as e:
                        last_err = e
                        if attempt < retries:
                            await asyncio.sleep(backoff * attempt)
                            continue
                        else:
                            raise
                if method.upper() == "GET":
                    r = await client.get(url, headers=headers)
                elif method.upper() == "POST":
                    r = await client.post(url, headers=headers, json=json_payload or {})
                elif method.upper() == "PUT":
                    r = await client.put(url, headers=headers, json=json_payload or {})
                else:
                    return False, f"Unsupported method: {method}"

            if r.status_code >= 200 and r.status_code <= 299:
                return True, r.json() if r.content else {}
            else:
                return False, f"ArgoCD API error: {r.status_code} {r.text}"
        except Exception as e:
            logger.error(f"ArgoCD API call failed: {e}")
            return False, str(e)

    async def _send_telegram_message(self, chat_id: int, text: str) -> bool:
        """Send a message to Telegram using the bot token asynchronously. Returns True if OK."""
        if not chat_id:
            return False
        payload = {
            'chat_id': chat_id,
            'text': text,
            'parse_mode': 'HTML'
        }
        url = f"{self.api_url}/sendMessage"
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                r = await client.post(url, json=payload)
            return r.status_code == 200
        except Exception as e:
            logger.error(f"Failed to send Telegram message: {e}")
            return False

    async def _notify_argocd_sync_result(self, server: str, token: str, app: str, chat_id: Optional[int] = None, timeout: int = 600):
        """Poll ArgoCD until sync finishes; send Telegram notice with the result to chat.
        chat_id defaults to configured chat or the last requesting user.
        """
        chat = chat_id or self.default_chat_id or self.requesting_user_id
        try:
            ok, res = await self._call_argocd_api(server, token, "GET", f"/applications/{app}")
            if not ok:
                await self._send_telegram_message(chat, f"❌ ArgoCD API error while checking status for {app}: {res}")
                return
            status = res.get('status', {})
            if status.get('sync', {}).get('status') == 'Synced' and status.get('health', {}).get('status') == 'Healthy':
                await self._send_telegram_message(chat, f"✅ {app} already Synced & Healthy.")
                return
            start = time.time()
            while time.time() - start < timeout:
                ok, res = await self._call_argocd_api(server, token, "GET", f"/applications/{app}")
                if ok:
                    st = res.get('status', {})
                    phase = st.get('operationState', {}).get('phase') if st.get('operationState') else None
                    sync = st.get('sync', {}).get('status')
                    health = st.get('health', {}).get('status')
                    if phase in ('Succeeded',) or (sync == 'Synced' and health == 'Healthy'):
                        await self._send_telegram_message(chat, f"🔔 ArgoCD sync for {app} completed. Sync: {sync}. Health: {health}.")
                        return
                await asyncio.sleep(3)

            await self._send_telegram_message(chat, f"⚠️ Timeout waiting for ArgoCD sync for {app} (waited {timeout}s). Check ArgoCD UI for details.")
        except Exception as e:
            logger.error(f"_notify_argocd_sync_result error: {e}")
            if chat:
                await self._send_telegram_message(chat, f"❌ Error in ArgoCD sync monitor: {e}")


    # ==================== NGROK PARSING ====================

    def parse_ngrok_message(self, text: str) -> Optional[NgrokInfo]:
        """
        Парсить повідомлення з ngrok URLs

        Очікується формат:
        🔗 Ngrok URLs
        SSH: tcp://7.tcp.eu.ngrok.io:15102
        HTTP: https://commendatory-loriann-unappealingly.ngrok-free.dev
        Команда: sed -i '' -E '/Host dev-ngrok/,/^Host /{s/(HostName ).*/\17.tcp.eu.ngrok.io/; s/(Port ).*/\115102/;}' ~/.ssh/config
        """
        # Pattern для SSH URL
        ssh_pattern = r'SSH:\s*tcp://([^:]+):(\d+)'
        ssh_match = re.search(ssh_pattern, text)

        # Pattern для HTTP URL
        http_pattern = r'HTTP:\s*(https?://[^\s]+)'
        http_match = re.search(http_pattern, text)

        if ssh_match:
            return NgrokInfo(
                ssh_host=ssh_match.group(1),
                ssh_port=int(ssh_match.group(2)),
                http_url=http_match.group(1) if http_match else "",
                raw_message=text,
                parsed_at=datetime.now(timezone.utc)
            )

        return None

    async def update_ssh_config(self, ngrok_info: NgrokInfo) -> Tuple[bool, str]:
        """
        Оновлює SSH конфіг з новими ngrok даними
        """
        try:
            ssh_config = self.ssh_config_path

            if not os.path.exists(ssh_config):
                return False, f"SSH config не знайдено: {ssh_config}"

            # Читаємо поточний конфіг
            with open(ssh_config, 'r') as f:
                content = f.read()

            # Шукаємо блок dev-ngrok
            pattern = r'(Host\s+dev-ngrok\s*\n(?:[^\n]*\n)*?)(?=Host\s|\Z)'
            match = re.search(pattern, content, re.IGNORECASE)

            if match:
                # Оновлюємо існуючий блок
                old_block = match.group(1)
                new_block = re.sub(
                    r'HostName\s+\S+',
                    f'HostName {ngrok_info.ssh_host}',
                    old_block
                )
                new_block = re.sub(
                    r'Port\s+\d+',
                    f'Port {ngrok_info.ssh_port}',
                    new_block
                )
                content = content.replace(old_block, new_block)
            else:
                # Додаємо новий блок
                new_block = f"""
Host dev-ngrok
    HostName {ngrok_info.ssh_host}
    Port {ngrok_info.ssh_port}
    User root
    IdentityFile ~/.ssh/id_rsa
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
"""
                content += new_block

            # Записуємо оновлений конфіг
            with open(ssh_config, 'w') as f:
                f.write(content)

            self.last_ngrok = ngrok_info

            return True, f"""✅ SSH Config оновлено!

🔗 **Нові ngrok дані:**
• Host: `{ngrok_info.ssh_host}`
• Port: `{ngrok_info.ssh_port}`
• HTTP: {ngrok_info.http_url}

📡 **Підключення:**
```bash
ssh dev-ngrok
```"""

        except Exception as e:
            logger.error(f"Failed to update SSH config: {e}")
            return False, f"❌ Помилка оновлення SSH config: {str(e)}"

    # ==================== MESSAGE HANDLERS ====================

    async def process_update(self, update: Dict[str, Any]) -> Tuple[Optional[str], Optional[Dict]]:
        """
        Обробляє Telegram update
        Повертає кортеж (текст_відповіді, inline_клавіатура)
        """
        try:
            # Callback query (inline buttons)
            if "callback_query" in update:
                return await self._handle_callback(update["callback_query"])

            # Message
            if "message" not in update:
                return None, None

            message = update["message"]
            chat_id = message["chat"]["id"]
            user_id = message["from"]["id"]
            text = message.get("text", "")

            if not text:
                return None, None

            # Визначаємо тип повідомлення
            msg_type = self._classify_message(text)

            if msg_type == MessageType.NGROK_UPDATE:
                return await self._handle_ngrok_update(text, chat_id), None
            elif msg_type == MessageType.COMMAND:
                # _handle_command може повертати str або tuple
                result = await self._handle_command(text, chat_id, user_id)
                if isinstance(result, tuple):
                    return result
                return result, None
            else:
                # _handle_query тепер повертає кортеж
                return await self._handle_query(text, chat_id, user_id)

        except Exception as e:
            logger.error(f"Error processing update: {e}")
            return f"❌ Помилка: {str(e)}", None

    def _classify_message(self, text: str) -> MessageType:
        """Класифікує тип повідомлення"""
        text_lower = text.lower()

        # Ngrok update
        if "ngrok" in text_lower and ("ssh:" in text_lower or "http:" in text_lower or "tunnel" in text_lower):
            return MessageType.NGROK_UPDATE

        # Command
        if text.startswith("/"):
            return MessageType.COMMAND

        # Button menu items
        menu_items = ["статус", "сервер", "docker", "k8s", "ngrok", "ssh config",
                      "deploy", "пошук", "допомога"]
        if any(item in text_lower for item in menu_items):
            return MessageType.COMMAND

        return MessageType.QUERY

    async def _handle_ngrok_update(self, text: str, chat_id: int) -> str:
        """Обробляє оновлення ngrok та оновлює всі конфігурації"""

        text_lower = text.lower() if text else ""
        down_signals = ["tunnel down", "tunnel is not running", "ngrok tunnel is not running", "not running", "down", "не працює", "тунель"]
        is_down = any(k in text_lower for k in down_signals)

        # If down and auto-restart enabled, try to perform restart automatically
        if is_down:
            if self.auto_restart_ngrok:
                result = await self._restart_ngrok_on_server()
                if result.success:
                    return f"✅ Ngrok перезапущено автоматично. Стан:\n{result.output[:1200]}"
                else:
                    return f"❌ Спроба автоматичного перезапуску ngrok не вдалася:\n{result.error}\n{result.output}"
            else:
                return "⚠️ Ngrok тунель DOWN. Увімкнено автоматичний перезапуск? (AUTO_RESTART_NGROK=false)"

        # Парсимо ngrok повідомлення через Remote Server Manager
        conn = remote_server.parse_ngrok_message(text)

        if conn:
            # Оновлюємо всі конфігурації (SSH, .env, тощо)
            success, message = await remote_server.update_all_configs(conn)

            # Перевіряємо з'єднання
            conn_ok, conn_msg = await remote_server.check_connection()
            if conn_ok:
                message += f"\n\n{conn_msg}"
            else:
                message += f"\n\n⚠️ {conn_msg}"

            # If configured, trigger ArgoCD sync automatically when tunnel appears
            if success and self.auto_deploy_on_up:
                server, token = self._get_argocd_credentials("nvidia")
                if server and token:
                    ok, _ = await self._call_argocd_api(server, token, "POST", "/applications/predator-nvidia/sync", json_payload={})
                    if ok:
                        message = message + "\n\n🔁 Auto ArgoCD sync initiated for predator-nvidia."
                    else:
                        message = message + "\n\n❗ Auto ArgoCD sync attempted but failed. Check logs."
            return message

        # Fallback to old parser
        ngrok_info = self.parse_ngrok_message(text)
        if ngrok_info:
            success, message = await self.update_ssh_config(ngrok_info)
            return message

        return "⚠️ Не вдалося розпарсити ngrok дані"

    async def _handle_command(self, text: str, chat_id: int, user_id: int) -> str:
        """Обробляє команди"""
        text_clean = text.lstrip("/").lower().strip()

        # Emoji mapping для reply keyboard та команд
        emoji_map = {
            # Статус
            "📊": "status", "статус": "status",
            "🖥️": "status", "сервер": "status",
            # Docker
            "🐳": "docker", "docker": "docker",
            # Kubernetes
            "☸️": "k8s", "k8s": "k8s", "pods": "pods",
            # Network
            "🔗": "ngrok", "ngrok": "ngrok",
            "📡": "ssh", "ssh config": "ssh",
            # Deploy/Git
            "📦": "git", "git": "git",
            "🚀": "deploy", "деплой": "deploy", "deploy": "deploy",
            # AI
            "🧠": "ai", "ai": "ai",
            "🔍": "search", "пошук": "search",
            # NVIDIA
            "🎮": "nvidia", "nvidia": "nvidia",
            # Меню/Help
            "❓": "menu", "меню": "menu",
            "допомога": "help", "help": "help",
        }

        # Визначаємо команду
        cmd_name = None
        args = ""

        for key, value in emoji_map.items():
            if text_clean.startswith(key):
                cmd_name = value
                args = text_clean.replace(key, "").strip()
                break

        if not cmd_name:
            parts = text_clean.split(maxsplit=1)
            cmd_name = parts[0]
            args = parts[1] if len(parts) > 1 else ""

        # Спеціальні команди з меню
        if cmd_name in ["start", "menu"]:
            return await self._cmd_start(chat_id)
        elif cmd_name == "help":
            return await self._cmd_help()
        elif cmd_name == "nvidia":
            # NVIDIA меню - повертаємо як tuple для inline keyboard
            return ("🎮 *NVIDIA Сервер*\n\nУправління віддаленим GPU сервером", self.menu_builder.build_nvidia_menu())
        elif cmd_name == "ai":
            return ("🧠 *AI Assistant*\n\nШтучний інтелект для пошуку та аналізу", self.menu_builder.build_ai_menu())
        elif cmd_name == "git":
            return ("📦 *Git & Deploy*\n\nУправління кодом та деплоєм", self.menu_builder.build_deploy_menu())

        # Системні команди
        handler = self.system_commands.get(cmd_name)
        if handler:
            # track requesting user for authorization checks
            self.requesting_user_id = user_id
            result = None
            success = False
            try:
                result = await handler(args)
                success = True
            except Exception as e:
                result = f"❌ Помилка виконання: {e}"
                success = False
            finally:
                self.requesting_user_id = None
                # Record audit
                try:
                    self._log_audit(user_id, text, success, '' if success else result)
                except Exception:
                    logger.debug('Failed to write audit log')

            return result

        # AI fallback
        return await self._handle_ai_query(text, chat_id)

    async def _cmd_queue_status(self, args: str) -> Tuple[str, Optional[Dict]]:
        """Show RabbitMQ Queues Status"""
        # In a real scenario, fetch from RabbitMQ API or internal service
        # Mocking for v25 demo consistency
        queues = [
            {"name": "etl_queue", "messages": 12, "consumers": 4, "status": "active", "rate": 25},
            {"name": "ml_training", "messages": 3, "consumers": 2, "status": "active", "rate": 5},
            {"name": "indexing", "messages": 0, "consumers": 2, "status": "idle", "rate": 0},
            {"name": "notifications", "messages": 156, "consumers": 1, "status": "congested", "rate": 8}
        ]

        text = "📊 <b>RabbitMQ Queue Status</b>\n\n"
        buttons = []

        for q in queues:
            icon = "🟢" if q['status'] == 'idle' else "🟡" if q['status'] == 'active' else "🔴"
            text += f"{icon} <b>{q['name']}</b>: {q['messages']} msgs\n"
            text += f"   Consumers: {q['consumers']} | Rate: {q.get('rate', 0)}/s\n\n"

            if q['status'] == 'congested' or q['messages'] > 50:
                buttons.append([{"text": f"🗑 Purge {q['name']}", "callback_data": f"queue_purge_{q['name']}"}])

        buttons.append([{"text": "🔄 Refresh", "callback_data": "menu_queues"}])
        keyboard = {"inline_keyboard": buttons}
        return text, keyboard

    async def _cmd_purge_queue(self, args: str) -> Tuple[str, Optional[Dict]]:
        """Purge a queue"""
        queue_name = args.strip()
        if not queue_name:
            return "❌ Вкажіть назву черги: /purge queue_name", None

        # Create confirmation task
        user_id = self.requesting_user_id or 0
        task = await self.task_executor.create_task(
             description=f"Purge queue {queue_name}",
             user_id=user_id,
             category=TaskCategory.SYSTEM,
             is_dangerous=True,
             commands=[f"rabbitmqadmin purge queue name={queue_name} (SIMULATED)"]
        )

        msg = self.message_formatter.format_task_confirmation(task.description, task.commands, task.is_dangerous)
        keyboard = self.menu_builder.build_confirmation_menu(task.task_id, task.description, task.is_dangerous)

        return msg, keyboard

    async def _handle_callback(self, callback: Dict[str, Any]) -> Tuple[str, Optional[Dict]]:
        """Обробляє callback від inline кнопок з підтримкою меню та підтвердження задач"""
        data = callback.get("data", "")
        chat_id = callback["message"]["chat"]["id"]
        user_id = callback.get("from", {}).get("id")

        logger.info(f"Callback received: {data} from user {user_id}")

        # Відповідаємо на callback одразу
        await self._answer_callback(callback["id"])

        # ============ QUEUE COMMANDS ============
        if data.startswith("queue_purge_"):
            q_name = data.replace("queue_purge_", "")
            self.requesting_user_id = user_id
            return await self._cmd_purge_queue(q_name)

        if data == "menu_queues":
             return await self._cmd_queue_status("")

        # ============ МЕНЮ НАВІГАЦІЯ ============
        if data.startswith("menu_"):
            menu_name = data.replace("menu_", "")
            menu_map = {
                "main": (self.menu_builder.build_main_menu(), "🏠 *Головне меню*\n\nОберіть розділ:"),
                "docker": (self.menu_builder.build_docker_menu(), "🐳 *Docker управління*"),
                "k8s": (self.menu_builder.build_kubernetes_menu(), "☸️ *Kubernetes*"),
                "monitoring": (self.menu_builder.build_monitoring_menu(), "📊 *Моніторинг системи*"),
                "deploy": (self.menu_builder.build_deploy_menu(), "📦 *Git/Deploy*"),
                "network": (self.menu_builder.build_network_menu(), "🔗 *Мережа*"),
                "ai": (self.menu_builder.build_ai_menu(), "🧠 *AI Assistant*"),
                "settings": (self.menu_builder.build_settings_menu(), "⚙️ *Налаштування*"),
                "llm": (self.menu_builder.build_llm_menu(), "🤖 *LLM Провайдери*"),
                "nvidia": (self.menu_builder.build_nvidia_menu(), "🎮 *NVIDIA Сервер*\n\nУправління віддаленим GPU сервером"),
            }

            if menu_name in menu_map:
                keyboard, header = menu_map[menu_name]
                return header, keyboard
            return "❌ Меню не знайдено", None

        # ============ ПІДТВЕРДЖЕННЯ/СКАСУВАННЯ ЗАДАЧ ============
        if data.startswith("confirm_"):
            task_id = data.replace("confirm_", "")
            task = self.task_executor.confirm_task(task_id)
            if task:
                # Виконуємо задачу
                result = await self.task_executor.execute_task(task)

                response = self.message_formatter.format_task_result(
                    description=task.description,
                    output=result.output,
                    error=result.error,
                    execution_time_ms=result.execution_time_ms
                )
                return response, None
            return "⚠️ Задача не знайдена або прострочена", None

        if data.startswith("cancel_"):
            task_id = data.replace("cancel_", "")
            if self.task_executor.cancel_task(task_id):
                return "❌ *Задачу скасовано*", None
            return "⚠️ Задача не знайдена", None

        # ============ DOCKER ШВИДКІ ДІЇ ============
        if data.startswith("docker_"):
            action = data.replace("docker_", "")

            # Вибір сервісу
            if action in ["restart_select", "logs_select", "build_select"]:
                actual_action = action.replace("_select", "")
                return f"📋 *Оберіть сервіс для {actual_action}:*", self.menu_builder.build_docker_services_menu(actual_action)

            # Прямі дії
            if action == "ps":
                result = await self._cmd_docker_status("")
                return result, None
            elif action == "up":
                # Створюємо задачу на підтвердження
                task = await self.task_executor._analyze_docker_request(
                    "Запустити всі docker сервіси", "запустити docker", user_id, chat_id
                )
                if task.requires_confirmation:
                    msg = self.message_formatter.format_task_confirmation(
                        task.description, task.commands, task.is_dangerous
                    )
                    keyboard = self.menu_builder.build_confirmation_menu(task.task_id, task.description, task.is_dangerous)
                    return msg, keyboard
                else:
                    result = await self.task_executor.execute_task(task)
                    return self.message_formatter.format_task_result(task.description, result.output, result.error), None
            elif action == "down":
                task = await self.task_executor._analyze_docker_request(
                    "Зупинити всі docker сервіси", "зупинити docker", user_id, chat_id
                )
                if task.requires_confirmation:
                    msg = self.message_formatter.format_task_confirmation(
                        task.description, task.commands, task.is_dangerous
                    )
                    keyboard = self.menu_builder.build_confirmation_menu(task.task_id, task.description, task.is_dangerous)
                    return msg, keyboard
                else:
                    result = await self.task_executor.execute_task(task)
                    return self.message_formatter.format_task_result(task.description, result.output, result.error), None
            elif action.startswith("restart_"):
                service = action.replace("restart_", "")
                task = await self.task_executor._analyze_docker_request(
                    f"Перезапустити {service}", f"перезапусти docker {service}", user_id, chat_id
                )
                msg = self.message_formatter.format_task_confirmation(
                    task.description, task.commands, task.is_dangerous
                )
                keyboard = self.menu_builder.build_confirmation_menu(task.task_id, task.description, task.is_dangerous)
                return msg, keyboard
            elif action.startswith("logs_"):
                service = action.replace("logs_", "")
                task = await self.task_executor._analyze_docker_request(
                    f"Логи {service}", f"покажи логи docker {service}", user_id, chat_id
                )
                result = await self.task_executor.execute_task(task)
                return self.message_formatter.format_task_result(task.description, result.output, result.error), None

        # ============ СИСТЕМНІ КОМАНДИ ============
        if data.startswith("sys_"):
            cmd_map = {
                "sys_disk": self._cmd_disk_usage,
                "sys_memory": self._cmd_memory_usage,
                "sys_cpu": self._cmd_cpu_usage,
                "sys_uptime": self._cmd_uptime,
                "sys_info": self._cmd_sysinfo,
            }
            handler = cmd_map.get(data)
            if handler:
                result = await handler("")
                return result, None

        # ============ GIT КОМАНДИ ============
        if data.startswith("git_"):
            action = data.replace("git_", "")
            if action == "status":
                return await self._cmd_git_status(""), None
            elif action == "log":
                result = subprocess.run(["git", "log", "-n", "10", "--oneline"],
                    capture_output=True, text=True, cwd="/Users/dima-mac/Documents/Predator_21")
                return f"📜 *Git Log*\n```\n{result.stdout}\n```", None
            elif action == "pull":
                task = await self.task_executor._analyze_git_request(
                    "Git pull", "git pull", user_id, chat_id
                )
                msg = self.message_formatter.format_task_confirmation(
                    task.description, task.commands, task.is_dangerous
                )
                keyboard = self.menu_builder.build_confirmation_menu(task.task_id, task.description, task.is_dangerous)
                return msg, keyboard
            elif action == "push":
                task = await self.task_executor._analyze_git_request(
                    "Git push", "git push", user_id, chat_id
                )
                msg = self.message_formatter.format_task_confirmation(
                    task.description, task.commands, task.is_dangerous
                )
                keyboard = self.menu_builder.build_confirmation_menu(task.task_id, task.description, task.is_dangerous)
                return msg, keyboard

        # ============ K8s КОМАНДИ ============
        if data.startswith("k8s_"):
            action = data.replace("k8s_", "")
            if action == "pods":
                return await self._cmd_kubernetes_pods(""), None
            elif action == "nodes":
                result = subprocess.run(["kubectl", "get", "nodes", "-o", "wide"],
                    capture_output=True, text=True)
                return f"☸️ *Kubernetes Nodes*\n```\n{result.stdout[:1500]}\n```", None
            elif action == "services":
                return await self._cmd_services_status(""), None

        # ============ DEPLOY ============
        if data == "deploy_full":
            task = await self.task_executor._analyze_deploy_request(
                "Повний деплой", "деплой", user_id, chat_id
            )
            msg = self.message_formatter.format_task_confirmation(
                task.description, task.commands, task.is_dangerous
            )
            keyboard = self.menu_builder.build_confirmation_menu(task.task_id, task.description, task.is_dangerous)
            return msg, keyboard

        # ============ NVIDIA СЕРВЕР ============
        if data.startswith("nvidia_"):
            action = data.replace("nvidia_", "")

            if action == "status":
                # Статус віддаленого сервера
                status = await remote_server.get_remote_status()
                if status.get("status") == "connected":
                    d = status.get("data", {})
                    msg = f"""🎮 *NVIDIA Server Status*

🖥️ **Host:** `{status.get('host', 'N/A')}`
📊 **Hostname:** {d.get('hostname', 'N/A')}
⏰ **Uptime:** {d.get('uptime', 'N/A')}
💾 **Disk:** {d.get('disk', 'N/A')}
🧠 **Memory:** {d.get('memory', 'N/A')}

🎮 **GPU:**
```
{d.get('gpu', 'N/A')}
```

🐳 **Docker:**
```
{d.get('docker', 'N/A')[:800]}
```
"""
                    return msg, self.menu_builder.build_nvidia_menu()
                else:
                    return f"❌ {status.get('error', 'Not connected')}\n\n{remote_server.get_connection_info()}", self.menu_builder.build_nvidia_menu()

            elif action == "gpu":
                task = await self.task_executor._analyze_gpu_request(
                    "GPU status", "gpu статус", user_id, chat_id
                )
                result = await self.task_executor.execute_task(task)
                return self.message_formatter.format_task_result(task.description, result.output, result.error), self.menu_builder.build_nvidia_menu()

            elif action == "docker":
                task = await self.task_executor._analyze_remote_request(
                    "Docker статус на сервері", "nvidia docker статус", user_id, chat_id
                )
                result = await self.task_executor.execute_task(task)
                return self.message_formatter.format_task_result(task.description, result.output, result.error), self.menu_builder.build_nvidia_menu()

            elif action == "deploy":
                task = await self.task_executor._analyze_remote_request(
                    "Деплой на NVIDIA", "nvidia deploy", user_id, chat_id
                )
                msg = self.message_formatter.format_task_confirmation(
                    task.description, task.commands, task.is_dangerous
                )
                keyboard = self.menu_builder.build_confirmation_menu(task.task_id, task.description, True)
                return msg, keyboard

            elif action == "restart":
                task = await self.task_executor._analyze_remote_request(
                    "Перезапуск Docker на сервері", "nvidia docker перезапусти", user_id, chat_id
                )
                msg = self.message_formatter.format_task_confirmation(
                    task.description, task.commands, task.is_dangerous
                )
                keyboard = self.menu_builder.build_confirmation_menu(task.task_id, task.description, False)
                return msg, keyboard

            elif action == "resources":
                result = await remote_server.execute_remote("df -h / && free -h", timeout=30)
                if result.success:
                    return f"💾 *NVIDIA Server Resources*\n```\n{result.output}\n```", self.menu_builder.build_nvidia_menu()
                else:
                    return f"❌ {result.error}", self.menu_builder.build_nvidia_menu()

            elif action == "connection":
                return remote_server.get_connection_info(), self.menu_builder.build_nvidia_menu()

            elif action == "test_ssh":
                ok, msg = await remote_server.check_connection()
                return msg, self.menu_builder.build_nvidia_menu()

            elif action == "ngrok":
                if remote_server.current_connection:
                    conn = remote_server.current_connection
                    return f"""📡 *Ngrok Tunnel Info*

🔗 **Host:** `{conn.host}`
🔌 **Port:** `{conn.port}`
🌐 **HTTP:** {conn.http_url or 'N/A'}
👤 **User:** {conn.user}
🟢 **Active:** {'Yes' if conn.is_active else 'Unknown'}

📋 **SSH Command:**
```
ssh dev-ngrok
```

⏰ **Last Seen:** {conn.last_seen.strftime('%Y-%m-%d %H:%M:%S')} UTC
""", self.menu_builder.build_nvidia_menu()
                else:
                    return "❌ Немає збережених ngrok даних\n\nНадішліть ngrok повідомлення для налаштування", self.menu_builder.build_nvidia_menu()

            elif action == "logs_select":
                # Показуємо меню вибору сервісу для логів
                services = [
                    ("🔙 Backend", "nvidia_logs_backend"),
                    ("⚙️ Celery", "nvidia_logs_celery"),
                    ("🦙 Ollama", "nvidia_logs_ollama"),
                    ("🗄️ Postgres", "nvidia_logs_postgres"),
                    ("🔴 Redis", "nvidia_logs_redis"),
                ]
                keyboard = {"inline_keyboard": [
                    [{"text": name, "callback_data": cb} for name, cb in services[i:i+2]]
                    for i in range(0, len(services), 2)
                ] + [[{"text": "⬅️ Назад", "callback_data": "menu_nvidia"}]]}
                return "📜 *Оберіть сервіс для логів:*", keyboard

            elif action.startswith("logs_"):
                service = action.replace("logs_", "")
                task = await self.task_executor._analyze_remote_request(
                    f"Логи {service} на сервері", f"nvidia logs {service}", user_id, chat_id
                )
                result = await self.task_executor.execute_task(task)
                return self.message_formatter.format_task_result(task.description, result.output[:2000], result.error), self.menu_builder.build_nvidia_menu()

            return "❌ Невідома NVIDIA команда", self.menu_builder.build_nvidia_menu()

        # ============ HELP ============
        if data == "show_help":
            return await self._cmd_help(), None

        # ============ STATUS ============
        if data == "menu_status" or data == "status_full":
            return await self._cmd_server_status(""), self.menu_builder.build_main_menu()

        # ============ QUICK ACTIONS ============
        if data.startswith("quick_"):
            action = data.replace("quick_", "")

            if action == "restart_backend":
                task = await self.task_executor._analyze_docker_request(
                    "Перезапустити backend", "перезапусти docker backend", user_id, chat_id
                )
                msg = self.message_formatter.format_task_confirmation(
                    task.description, task.commands, task.is_dangerous
                )
                keyboard = self.menu_builder.build_confirmation_menu(task.task_id, task.description, task.is_dangerous)
                return msg, keyboard

            elif action == "logs_backend":
                task = await self.task_executor._analyze_docker_request(
                    "Логи backend", "покажи логи docker backend", user_id, chat_id
                )
                result = await self.task_executor.execute_task(task)
                return self.message_formatter.format_task_result(task.description, result.output, result.error, result.execution_time_ms), None

            elif action == "git_pull":
                task = await self.task_executor._analyze_git_request(
                    "Git pull", "git pull", user_id, chat_id
                )
                msg = self.message_formatter.format_task_confirmation(
                    task.description, task.commands, task.is_dangerous
                )
                keyboard = self.menu_builder.build_confirmation_menu(task.task_id, task.description, task.is_dangerous)
                return msg, keyboard

            elif action == "deploy":
                task = await self.task_executor._analyze_deploy_request(
                    "Повний деплой", "деплой", user_id, chat_id
                )
                msg = self.message_formatter.format_task_confirmation(
                    task.description, task.commands, task.is_dangerous
                )
                keyboard = self.menu_builder.build_confirmation_menu(task.task_id, task.description, True)
                return msg, keyboard

            elif action == "gpu":
                task = await self.task_executor._analyze_gpu_request(
                    "GPU статус", "gpu статус", user_id, chat_id
                )
                result = await self.task_executor.execute_task(task)
                return self.message_formatter.format_task_result(task.description, result.output, result.error, result.execution_time_ms), self.menu_builder.build_quick_actions_menu()

            elif action == "nvidia":
                status = await remote_server.get_remote_status()
                if status.get("status") == "connected":
                    d = status.get("data", {})
                    msg = f"""🎮 *NVIDIA Server Quick Status*

🖥️ Host: `{status.get('host', 'N/A')}`
⏰ Uptime: {d.get('uptime', 'N/A')}
🎮 GPU: {d.get('gpu', 'N/A')[:100]}
🐳 Docker: {len(d.get('docker', '').split(chr(10)))-1} containers
"""
                    return msg, self.menu_builder.build_quick_actions_menu()
                else:
                    return remote_server.get_connection_info(), self.menu_builder.build_nvidia_menu()

            elif action == "status":
                return await self._cmd_server_status(""), self.menu_builder.build_quick_actions_menu()

            return "❌ Невідома швидка дія", self.menu_builder.build_quick_actions_menu()

        # ============ SETTINGS ============
        if data.startswith("settings_"):
            action = data.replace("settings_", "")

            if action == "auto_deploy":
                status = "✅ ON" if self.auto_deploy_on_up else "❌ OFF"
                keyboard = {
                    "inline_keyboard": [
                        [
                            {"text": "🟢 Увімкнути", "callback_data": "toggle_auto_deploy_on"},
                            {"text": "🔴 Вимкнути", "callback_data": "toggle_auto_deploy_off"}
                        ],
                        [{"text": "⬅️ Назад", "callback_data": "menu_settings"}]
                    ]
                }
                return f"🔁 *Auto Deploy при появі ngrok*\n\nПоточний статус: {status}\n\nКоли з'являється новий ngrok тунель, автоматично синхронізувати ArgoCD.", keyboard

            elif action == "auto_restart":
                status = "✅ ON" if self.auto_restart_ngrok else "❌ OFF"
                keyboard = {
                    "inline_keyboard": [
                        [
                            {"text": "🟢 Увімкнути", "callback_data": "toggle_auto_restart_on"},
                            {"text": "🔴 Вимкнути", "callback_data": "toggle_auto_restart_off"}
                        ],
                        [{"text": "⬅️ Назад", "callback_data": "menu_settings"}]
                    ]
                }
                return f"🔄 *Auto Restart Ngrok*\n\nПоточний статус: {status}\n\nПри падінні ngrok автоматично спробувати перезапустити.", keyboard

            elif action == "bot_stats":
                # Збираємо статистику
                total_tasks = len(self.task_executor.execution_history)
                success_tasks = sum(1 for r in self.task_executor.execution_history if r.status.value == "completed")
                failed_tasks = total_tasks - success_tasks

                # Recent tasks
                recent = self.task_executor.execution_history[-5:] if self.task_executor.execution_history else []
                recent_text = "\n".join([f"• {r.task_id[:8]}: {r.status.value}" for r in recent]) or "Немає"

                # NVIDIA connection
                nvidia_info = "❌ Не підключено"
                if remote_server.current_connection:
                    nvidia_info = f"✅ {remote_server.current_connection.host}:{remote_server.current_connection.port}"

                msg = f"""📊 *Статистика бота*

*Задачі:*
• Всього виконано: {total_tasks}
• ✅ Успішних: {success_tasks}
• ❌ Помилок: {failed_tasks}

*Налаштування:*
• Auto Deploy: {'✅' if self.auto_deploy_on_up else '❌'}
• Auto Restart: {'✅' if self.auto_restart_ngrok else '❌'}

*NVIDIA Сервер:* {nvidia_info}

*Останні задачі:*
{recent_text}
"""
                return msg, self.menu_builder.build_settings_menu()

            elif action == "auth":
                users = os.getenv("TELEGRAM_AUTHORIZED_USERS", "")
                return f"👤 *Авторизовані користувачі*\n\nВаш ID: `{user_id}`\n\nАвторизовані: `{users or 'Не налаштовано'}`", self.menu_builder.build_settings_menu()

            return "❌ Невідомі налаштування", self.menu_builder.build_settings_menu()

        # ============ TOGGLES ============
        if data.startswith("toggle_"):
            action = data.replace("toggle_", "")

            if action == "auto_deploy_on":
                self.auto_deploy_on_up = True
                self._save_bot_state()
                return "✅ Auto Deploy УВІМКНЕНО", self.menu_builder.build_settings_menu()
            elif action == "auto_deploy_off":
                self.auto_deploy_on_up = False
                self._save_bot_state()
                return "❌ Auto Deploy ВИМКНЕНО", self.menu_builder.build_settings_menu()
            elif action == "auto_restart_on":
                self.auto_restart_ngrok = True
                self._save_bot_state()
                return "✅ Auto Restart Ngrok УВІМКНЕНО", self.menu_builder.build_settings_menu()
            elif action == "auto_restart_off":
                self.auto_restart_ngrok = False
                self._save_bot_state()
                return "❌ Auto Restart Ngrok ВИМКНЕНО", self.menu_builder.build_settings_menu()

        # ============ СТАНДАРТНІ СИСТЕМНІ КОМАНДИ ============
        handler = self.system_commands.get(data)
        if handler:
            self.requesting_user_id = user_id
            try:
                result = await handler("")
            finally:
                self.requesting_user_id = None
            return result, None

        return "❌ Невідома команда", None

    async def _handle_query(self, text: str, chat_id: int, user_id: int) -> Tuple[str, Optional[Dict]]:
        """
        Обробляє вільний запит через AI з автоматичним виконанням задач
        Замість інструкцій - пропонує виконати задачу після підтвердження
        """
        # Спочатку перевіряємо чи це задача яку можна виконати
        task = await self.task_executor.analyze_request(text, user_id, chat_id)

        if task:
            # Знайдена задача для виконання
            if task.requires_confirmation:
                # Потрібне підтвердження - показуємо меню
                msg = self.message_formatter.format_task_confirmation(
                    task.description, task.commands, task.is_dangerous
                )
                keyboard = self.menu_builder.build_confirmation_menu(
                    task.task_id, task.description, task.is_dangerous
                )
                return msg, keyboard
            else:
                # Безпечна задача - виконуємо одразу
                result = await self.task_executor.execute_task(task)
                return self.message_formatter.format_task_result(
                    task.description, result.output, result.error, result.execution_time_ms
                ), None

        # Якщо не знайдена задача - використовуємо AI
        return await self._handle_ai_query(text, chat_id), None

    async def _handle_ai_query(self, text: str, chat_id: int) -> str:
        """Обробляє запит через AI з використанням LLM Council для складних завдань"""
        try:
            # Спочатку розуміємо намір
            intent = await self._understand_intent(text)

            if intent.get("type") == "server_command":
                # Виконуємо серверну команду
                cmd = intent.get("command", "status")
                handler = self.system_commands.get(cmd)
                if handler:
                    result = await handler(intent.get("args", ""))
                    # Додаємо AI пояснення до результату
                    explanation = await llm_service.generate(
                        prompt=f"""Поясни користувачу українською мовою результат команди '{cmd}':

{result[:500]}

Дай коротке пояснення (1-2 речення) що це означає.""",
                        system="Ти - експерт з DevOps. Поясни просто та зрозуміло."
                    )
                    return f"{result}\n\n💡 {explanation.content if explanation.success else ''}"

            elif intent.get("type") == "search":
                # Пошук через AI Engine з Council
                result = await ai_engine.analyze(text, depth="deep", llm_mode="council")
                return f"""🔍 **Результат аналізу (LLM Council)**

{result.answer[:2000]}

📊 Джерела: {len(result.sources)}
⏱️ Час: {result.processing_time_ms:.0f}ms
🤖 Модель: {result.model_used}"""

            elif intent.get("type") == "action":
                # Виконання дій (запуск сервісів, деплой)
                return await self._execute_action(intent)

            else:
                # Загальний чат з LLM Council для складних питань
                is_complex = len(text.split()) > 15 or "?" in text or any(kw in text.lower() for kw in ["як", "чому", "поясни", "допоможи"])

                if is_complex:
                    response = await llm_service.run_council(
                        prompt=text,
                        system="""Ти - інтелектуальний AI асистент системи Predator Analytics.
Допомагай користувачу з:
1. Управлінням сервером (статус, ресурси, логи)
2. Docker/Kubernetes управління
3. SSH/Ngrok налаштування
4. Деплой та моніторинг
5. Пошук в українських реєстрах
6. Технічними питаннями

Відповідай детально та професійно українською мовою.""",
                        max_tokens=1500
                    )
                    return f"🧠 **LLM Council**\n\n{response.content}" if response.success else "❌ AI недоступний"
                else:
                    response = await llm_service.generate_with_routing(
                        prompt=text,
                        system="""Ти - AI асистент для управління сервером Predator Analytics.
Допомагай користувачу з:
1. Управлінням сервером (статус, ресурси, логи)
2. Docker/Kubernetes управління
3. SSH/Ngrok налаштування
4. Деплой та моніторинг
5. Пошук в українських реєстрах

Відповідай коротко та по суті українською мовою. Якщо потрібна команда - вкажи яку.""",
                        mode="fast"
                    )
                    return response.content if response.success else "❌ AI недоступний"

        except Exception as e:
            logger.error(f"AI query error: {e}")
            return f"❌ Помилка AI: {str(e)}"

    async def _understand_intent(self, text: str) -> Dict[str, Any]:
        """Розуміє намір користувача"""
        text_lower = text.lower()

        # Predator CLI
        if text_lower.startswith("predator"):
            parts = text.split(" ", 1)
            args = parts[1] if len(parts) > 1 else ""
            return {"type": "server_command", "command": "predator", "args": args}

        # Серверні ключові слова
        server_keywords = {
            "статус": "status",
            "диск": "disk",
            "пам'ять": "memory", "ram": "memory", "память": "memory",
            "cpu": "cpu", "процесор": "cpu",
            "docker": "docker", "контейнер": "docker",
            "kubernetes": "k8s", "k8s": "k8s", "поди": "pods", "pods": "pods",
            "лог": "logs", "logs": "logs",
            "рестарт": "restart", "перезапуск": "restart",
            "ngrok": "ngrok",
            "ssh": "ssh",
            "git": "git",
            "deploy": "deploy", "деплой": "deploy",
        }

        for keyword, cmd in server_keywords.items():
            if keyword in text_lower:
                return {"type": "server_command", "command": cmd, "args": text}

        # Пошукові ключові слова
        search_keywords = ["знайди", "пошук", "шукай", "компанія", "єдрпоу", "тендер", "аналіз"]
        if any(kw in text_lower for kw in search_keywords):
            return {"type": "search", "query": text}

        # Дії (запуск, зупинка, перезапуск сервісів)
        action_keywords = ["запусти", "зупини", "перезапусти", "start", "stop", "restart", "увімкни", "вимкни", "додай", "add", "провайдер", "provider", "groq", "mistral", "openai"]
        if any(kw in text_lower for kw in action_keywords):
            return {"type": "action", "query": text, "action_text": text}

        return {"type": "general", "query": text}

    async def _execute_action(self, intent: Dict[str, Any]) -> str:
        """Виконує дії з сервісами через AI-керування - АВТОМАТИЧНО виконує команди"""
        text = intent.get("action_text", "")
        text_lower = text.lower()

        try:
            # ======== DOCKER КОМАНДИ ========
            if "docker" in text_lower:
                if "запусти" in text_lower or "start" in text_lower:
                    result = subprocess.run(
                        ["docker", "compose", "up", "-d"],
                        capture_output=True, text=True, timeout=60,
                        cwd="/Users/dima-mac/Documents/Predator_21"
                    )
                    return f"🐳 **Docker Compose запущено**\n```\n{result.stdout[:500]}\n```"
                elif "зупини" in text_lower or "stop" in text_lower:
                    result = subprocess.run(
                        ["docker", "compose", "stop"],
                        capture_output=True, text=True, timeout=60,
                        cwd="/Users/dima-mac/Documents/Predator_21"
                    )
                    return f"⏹️ **Docker Compose зупинено**\n```\n{result.stdout[:500]}\n```"
                elif "перезапусти" in text_lower or "restart" in text_lower:
                    result = subprocess.run(
                        ["docker", "compose", "restart"],
                        capture_output=True, text=True, timeout=60,
                        cwd="/Users/dima-mac/Documents/Predator_21"
                    )
                    return f"🐳 **Docker Compose перезапущено**\n```\n{result.stdout[:500]}\n```"

            # ======== ПРОВАЙДЕРИ (Groq, Mistral, OpenAI, etc.) ========
            if "провайдер" in text_lower or "provider" in text_lower or "groq" in text_lower or "mistral" in text_lower:
                return await self._add_llm_provider(text)

            # ======== GIT КОМАНДИ ========
            if "git" in text_lower:
                if "pull" in text_lower:
                    result = subprocess.run(
                        ["git", "pull"],
                        capture_output=True, text=True, timeout=30,
                        cwd="/Users/dima-mac/Documents/Predator_21"
                    )
                    return f"📦 **Git Pull**\n```\n{result.stdout or result.stderr}\n```"
                elif "status" in text_lower or "статус" in text_lower:
                    result = subprocess.run(
                        ["git", "status", "--short"],
                        capture_output=True, text=True, timeout=10,
                        cwd="/Users/dima-mac/Documents/Predator_21"
                    )
                    return f"📦 **Git Status**\n```\n{result.stdout or 'Clean'}\n```"

            # ======== СЕРВІСИ КОНТЕЙНЕРІВ ========
            services = ["redis", "postgres", "qdrant", "opensearch", "minio", "backend", "frontend", "celery", "nginx"]
            for service in services:
                if service in text_lower:
                    if "логи" in text_lower or "logs" in text_lower:
                        result = subprocess.run(
                            ["docker", "compose", "logs", "--tail=50", service],
                            capture_output=True, text=True, timeout=15,
                            cwd="/Users/dima-mac/Documents/Predator_21"
                        )
                        return f"📜 **Логи {service}**\n```\n{result.stdout[-1500:]}\n```"
                    elif "перезапусти" in text_lower or "restart" in text_lower:
                        result = subprocess.run(
                            ["docker", "compose", "restart", service],
                            capture_output=True, text=True, timeout=30,
                            cwd="/Users/dima-mac/Documents/Predator_21"
                        )
                        return f"🔄 **{service} перезапущено**\n```\n{result.stdout or 'Done'}\n```"
                    elif "зупини" in text_lower or "stop" in text_lower:
                        result = subprocess.run(
                            ["docker", "compose", "stop", service],
                            capture_output=True, text=True, timeout=15,
                            cwd="/Users/dima-mac/Documents/Predator_21"
                        )
                        return f"⏹️ **{service} зупинено**"
                    elif "запусти" in text_lower or "start" in text_lower:
                        result = subprocess.run(
                            ["docker", "compose", "up", "-d", service],
                            capture_output=True, text=True, timeout=30,
                            cwd="/Users/dima-mac/Documents/Predator_21"
                        )
                        return f"▶️ **{service} запущено**"

            # ======== AI ВИЗНАЧЕННЯ ТА АВТОВИКОНАННЯ ========
            # Генеруємо команду через AI та виконуємо її
            response = await llm_service.generate(
                prompt=f"""Користувач хоче виконати: "{text}"

Це система Predator Analytics на macOS. Доступні інструменти:
- Docker Compose для сервісів
- Git для коду
- Python для скриптів
- Kubernetes (k3s) для кластера

Сформуй ОДНУ безпечну shell команду для виконання.
Формат відповіді: тільки команда, без пояснень, без markdown.
Якщо команда небезпечна (rm -rf, drop database, тощо) - напиши "UNSAFE:" перед нею.""",
                system="Ти - DevOps експерт. Генеруй shell команди для macOS."
            )

            if response.success:
                cmd = response.content.strip()

                # Перевіряємо безпеку
                if cmd.startswith("UNSAFE:") or any(danger in cmd for danger in ["rm -rf /", "drop database", "mkfs", "dd if="]):
                    return f"⚠️ **Небезпечна операція!**\n\n`{cmd}`\n\nВиконайте вручну якщо впевнені."

                # Виконуємо команду
                logger.info(f"Executing AI-generated command: {cmd}")
                result = subprocess.run(
                    cmd,
                    shell=True,
                    capture_output=True,
                    text=True,
                    timeout=60,
                    cwd="/Users/dima-mac/Documents/Predator_21"
                )

                output = result.stdout or result.stderr or "Виконано без виводу"
                status = "✅" if result.returncode == 0 else "❌"

                return f"""{status} **Команда виконана**

```bash
$ {cmd}
```

**Результат:**
```
{output[:1500]}
```"""

            return "❌ Не вдалося визначити дію"

        except subprocess.TimeoutExpired:
            return "⏱️ Команда перевищила ліміт часу (60с)"
        except Exception as e:
            logger.error(f"Action execution error: {e}")
            return f"❌ Помилка виконання: {str(e)}"

    async def _add_llm_provider(self, text: str) -> str:
        """Додає новий LLM провайдер"""
        text_lower = text.lower()

        # Визначаємо провайдера
        provider_name = None
        if "groq" in text_lower:
            provider_name = "groq"
        elif "mistral" in text_lower:
            provider_name = "mistral"
        elif "openai" in text_lower:
            provider_name = "openai"
        elif "together" in text_lower:
            provider_name = "together"
        elif "openrouter" in text_lower:
            provider_name = "openrouter"

        if not provider_name:
            return """🤖 **Доступні LLM провайдери:**

• **Groq** - швидкий inference
• **Mistral** - європейський провайдер
• **OpenAI** - GPT моделі
• **Together** - open source моделі
• **OpenRouter** - агрегатор моделей

Напиши: "Додай провайдер Groq" або відповідний"""

        # Перевіряємо поточний статус провайдерів
        try:
            from app.services.llm import LLMService
            llm = LLMService()
            providers = llm._providers

            if provider_name in providers:
                return f"✅ **Провайдер {provider_name.upper()} вже активний!**\n\nМоделі: {', '.join(providers[provider_name].get('models', []))}"

            # Інструкції для додавання
            api_key_urls = {
                "groq": "https://console.groq.com/keys",
                "mistral": "https://console.mistral.ai/api-keys",
                "openai": "https://platform.openai.com/api-keys",
                "together": "https://api.together.xyz/settings/api-keys",
                "openrouter": "https://openrouter.ai/keys"
            }

            return f"""🔑 **Додавання провайдера {provider_name.upper()}**

1. Отримай API ключ: {api_key_urls.get(provider_name, 'N/A')}

2. Додай в `.env`:
```
{provider_name.upper()}_API_KEY=your_key_here
```

3. Перезапусти сервіс:
```
docker compose restart backend
```

Або надішли API ключ прямо сюди (буде збережено безпечно)."""

        except Exception as e:
            return f"❌ Помилка: {str(e)}"

    # ==================== SYSTEM COMMANDS ====================

    async def _cmd_start(self, chat_id: int) -> str:
        """Стартове повідомлення з меню v2.0"""
        return self.message_formatter.format_welcome()

    async def _cmd_help(self) -> str:
        """Допомога v2.0"""
        return """📖 *Predator Bot v2.0 - Допомога*

*✨ Головна фіча:*
Пишіть запит природною мовою — бот сам виконає!

*🎮 NVIDIA Сервер:*
• "nvidia статус" / "gpu статус"
• "docker на сервері"
• "деплой на nvidia"
• "логи backend на сервері"

*🐳 Docker:*
• "перезапусти backend"
• "зупини redis"
• "логи celery"
• "docker статус"

*📦 Git:*
• "git pull" / "git status"
• "git push" / "commit"

*☸️ Kubernetes:*
• "pods" / "nodes"
• "k8s сервіси"

*🗄️ Бази даних:*
• "postgres статус"
• "redis info"
• "бекап postgres"

*🔗 Мережа:*
Надішли ngrok дані — автоматично оновлю SSH!

*⚡ Швидкі команди:*
`/status` `/docker` `/pods` `/git` `/logs`

*📋 Меню:*
`/start` або `/menu` — інтерактивне меню
"""


    async def _cmd_datasets(self, args: str) -> str:
        """/datasets - List available datasets"""
        try:
            async with get_db_ctx() as sess:
                stmt = select(DataSource).order_by(DataSource.created_at.desc()).limit(10)
                result = await sess.execute(stmt)
                sources = result.scalars().all()
                if not sources: return "📭 Немає доступних наборів даних."
                msg = "📚 **Доступні Набори Даних:**\n\n"
                for s in sources:
                    status_emoji = {"indexed": "✅", "parsing": "🔄", "error": "❌", "draft": "📝"}.get(s.status, "❓")
                    count = s.config.get("last_count", 0) if s.config else 0
                    msg += f"{status_emoji} `{s.name}`\n   🆔 `{str(s.id)}`\n   📊 Records: {count}\n\n"
                return msg
        except Exception as e: return f"❌ Помилка: {e}"

    async def _cmd_ingest(self, args: str) -> str:
        """/ingest [source_id]"""
        if not args: return "❌ Вкажіть ID джерела: `/ingest <source_id>`"
        return f"✅ **Ingestion Triggered** for `{args}`\n🆔 Job ID: `job_simulated_123`"

    async def _cmd_job_status(self, args: str) -> str:
        """/status [job_id]"""
        if not args: return "❌ Вкажіть ID задачі: `/job <job_id>`"
        return f"📊 **Job Status**\n🆔 `{args}`\n🔄 Status: RUNNING (Simulated)"

    async def _cmd_server_status(self, args: str) -> str:
        if args and ("job" in args or len(args) > 10): return await self._cmd_job_status(args)
        """Загальний статус сервера"""
        return """📊 **Статус сервера**

🟢 Сервер: Online
💾 Disk: Перевірте /disk
🧠 RAM: Перевірте /memory
⚡ CPU: Перевірте /cpu

🔗 Ngrok: """ + (f"✅ Активний ({self.last_ngrok.ssh_host}:{self.last_ngrok.ssh_port})" if self.last_ngrok else "⚠️ Очікую дані")

    async def _cmd_disk_usage(self, args: str) -> str:
        """Використання диску"""
        try:
            result = subprocess.run(
                ["df", "-h", "/"],
                capture_output=True, text=True, timeout=5
            )
            return f"💾 **Disk Usage**\n```\n{result.stdout}\n```"
        except Exception as e:
            return f"❌ Помилка: {e}"

    async def _cmd_sysinfo(self, args: str) -> str:
        """Детальна системна інформація"""
        try:
            import platform
            system = platform.system()

            output = ""
            if system == "Darwin":  # macOS
                result = subprocess.run(
                    ["system_profiler", "SPHardwareDataType"],
                    capture_output=True, text=True, timeout=10
                )
                output = result.stdout
            else:  # Linux
                # Try lshw (might require sudo, usually fails without)
                # Fallback to lscpu + free
                try:
                    res_lshw = subprocess.run(["lshw", "-short"], capture_output=True, text=True, timeout=5)
                    if res_lshw.returncode == 0:
                        output = res_lshw.stdout
                    else:
                        # Fallback
                        res_cpu = subprocess.run(["lscpu"], capture_output=True, text=True, timeout=5)
                        output = f"LSHW failed/restricted. CPU Info:\n{res_cpu.stdout}"
                except FileNotFoundError:
                     res_uname = subprocess.run(["uname", "-a"], capture_output=True, text=True)
                     output = f"Basic Info: {res_uname.stdout}"

            # Filter output to prevent too long message
            lines = [line for line in output.split('\n') if line.strip()]
            final_output = "\n".join(lines[:30]) # Limit lines

            return f"🖥️ **System Info ({system})**\n```yaml\n{final_output}\n```"
        except Exception as e:
            return f"❌ Помилка отримання інфо: {e}"

    async def _cmd_memory_usage(self, args: str) -> str:
        """RAM використання"""
        try:
            # Mac specific
            result = subprocess.run(
                ["vm_stat"],
                capture_output=True, text=True, timeout=5
            )
            return f"🧠 **Memory Stats**\n```\n{result.stdout[:500]}\n```"
        except Exception as e:
            return f"❌ Помилка: {e}"

    async def _cmd_cpu_usage(self, args: str) -> str:
        """CPU використання"""
        try:
            result = subprocess.run(
                ["top", "-l", "1", "-n", "0"],
                capture_output=True, text=True, timeout=10
            )
            # Витягуємо CPU лінію
            for line in result.stdout.split('\n'):
                if 'CPU usage' in line:
                    return f"⚡ **CPU**\n{line}"
            return f"⚡ **CPU Info**\n```\n{result.stdout[:300]}\n```"
        except Exception as e:
            return f"❌ Помилка: {e}"

    async def _cmd_uptime(self, args: str) -> str:
        """Аптайм"""
        try:
            result = subprocess.run(
                ["uptime"],
                capture_output=True, text=True, timeout=5
            )
            return f"⏰ **Uptime**\n{result.stdout}"
        except Exception as e:
            return f"❌ Помилка: {e}"

    async def _cmd_docker_status(self, args: str) -> str:
        """Docker статус"""
        try:
            result = subprocess.run(
                ["docker", "ps", "--format", "table {{.Names}}\t{{.Status}}\t{{.Ports}}"],
                capture_output=True, text=True, timeout=10
            )
            if result.returncode == 0:
                return f"🐳 **Docker Containers**\n```\n{result.stdout[:1000]}\n```"
            return "⚠️ Docker не запущено або помилка"
        except Exception as e:
            return f"❌ Docker недоступний: {e}"

    async def _cmd_kubernetes_status(self, args: str) -> str:
        """K8s статус"""
        try:
            result = subprocess.run(
                ["kubectl", "cluster-info"],
                capture_output=True, text=True, timeout=10
            )
            return f"☸️ **Kubernetes**\n```\n{result.stdout[:500]}\n```"
        except Exception as e:
            return f"❌ K8s недоступний: {e}"

    async def _cmd_kubernetes_pods(self, args: str) -> str:
        """K8s поди"""
        try:
            ns = args.strip() if args else "default"
            result = subprocess.run(
                ["kubectl", "get", "pods", "-n", ns],
                capture_output=True, text=True, timeout=10
            )
            return f"☸️ **Pods ({ns})**\n```\n{result.stdout[:1000]}\n```"
        except Exception as e:
            return f"❌ Помилка: {e}"

    async def _cmd_k8s_dump(self, args: str) -> str:
        """Run a cluster-info dump, compress results and return the tarball path."""
        if not self._is_requesting_user_authorized():
            return "❌ Ви не авторизовані для виконання цієї операції"

        args_parts = args.split()
        outdir = f"/tmp/k8s-dump-{int(time.time())}"
        exclude_secrets = True
        i = 0
        while i < len(args_parts):
            p = args_parts[i]
            if p in ("--output-dir", "-o") and i + 1 < len(args_parts):
                outdir = args_parts[i+1]
                i += 1
            elif p == "--include-secrets" or p == "--no-exclude-secrets":
                exclude_secrets = False
            elif p == "--exclude-secrets":
                exclude_secrets = True
            i += 1

        cmd = ["bash", "./scripts/k8s_cluster_dump.sh", "--output-dir", outdir]
        if exclude_secrets:
            cmd.append("--exclude-secrets")
        try:
            proc = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            if proc.returncode != 0:
                return f"❌ Помилка виконання kubectl dump: {proc.stderr[:1000]}"
            out_lines = proc.stdout.strip().splitlines()
            tarball = out_lines[-1] if out_lines else ''
            size_line = out_lines[-2] if len(out_lines) >= 2 else ''
            msg = f"✅ Kubernetes cluster dump створено: {tarball}\n{size_line}" if tarball else "✅ Dump створено"
            return msg
        except Exception as e:
            logger.error(f"Failed to run k8s dump: {e}")
            return f"❌ Помилка: {e}"

    async def _cmd_services_status(self, args: str) -> str:
        """Сервіси"""
        try:
            result = subprocess.run(
                ["docker", "compose", "ps"],
                capture_output=True, text=True, timeout=10,
                cwd="/Users/dima-mac/Documents/Predator_21"
            )
            return f"📋 **Services**\n```\n{result.stdout[:1000]}\n```"
        except Exception as e:
            return f"❌ Помилка: {e}"

    async def _cmd_logs(self, args: str) -> str:
        """Логи сервісу"""
        service = args.strip() if args else "backend"
        try:
            result = subprocess.run(
                ["docker", "logs", "--tail", "20", service],
                capture_output=True, text=True, timeout=10
            )
            output = result.stdout or result.stderr
            return f"📝 **Logs ({service})**\n```\n{output[:1500]}\n```"
        except Exception as e:
            return f"❌ Помилка: {e}"

    async def _cmd_ngrok_info(self, args: str) -> str:
        """Ngrok інформація"""
        if self.last_ngrok:
            return f"""🔗 **Ngrok Info**

• Host: `{self.last_ngrok.ssh_host}`
• Port: `{self.last_ngrok.ssh_port}`
• HTTP: {self.last_ngrok.http_url}
• Updated: {self.last_ngrok.parsed_at.strftime('%Y-%m-%d %H:%M:%S')} UTC"""
        return "⚠️ Ngrok дані не отримані. Надішли повідомлення з ngrok URLs."

    async def _cmd_ssh_config(self, args: str) -> str:
        """SSH конфігурація"""
        try:
            with open(self.ssh_config_path, 'r') as f:
                content = f.read()

            # Шукаємо блок dev-ngrok
            pattern = r'(Host\s+dev-ngrok\s*\n(?:[^\n]*\n)*?)(?=Host\s|\Z)'
            match = re.search(pattern, content, re.IGNORECASE)

            if match:
                return f"📡 **SSH Config (dev-ngrok)**\n```\n{match.group(1)}\n```"
            return "⚠️ Блок dev-ngrok не знайдено в SSH config"
        except Exception as e:
            return f"❌ Помилка: {e}"

    async def _cmd_connect_info(self, args: str) -> str:
        """Інформація про підключення"""
        if self.last_ngrok:
            return f"""📡 **Як підключитись**

**SSH:**
```bash
ssh dev-ngrok
# або
ssh -p {self.last_ngrok.ssh_port} root@{self.last_ngrok.ssh_host}
```

**HTTP:** {self.last_ngrok.http_url}"""
        return "⚠️ Ngrok дані не отримані"

    async def _cmd_git_status(self, args: str) -> str:
        """Git статус"""
        try:
            result = subprocess.run(
                ["git", "status", "-s"],
                capture_output=True, text=True, timeout=10,
                cwd="/Users/dima-mac/Documents/Predator_21"
            )

            result2 = subprocess.run(
                ["git", "log", "-1", "--oneline"],
                capture_output=True, text=True, timeout=10,
                cwd="/Users/dima-mac/Documents/Predator_21"
            )

            return f"""📦 **Git Status**

Last commit: `{result2.stdout.strip()}`

Changes:
```
{result.stdout[:500] if result.stdout else "Clean"}
```"""
        except Exception as e:
            return f"❌ Помилка: {e}"

    async def _cmd_deploy_status(self, args: str) -> str:
        """Deploy статус"""
        return """📦 **Deploy Status**

To deploy:
1. `git push origin main`
2. GitHub Actions буде triggered
3. ArgoCD синхронізує зміни

Перевірте: https://github.com/dima1203oleg/predator-analytics/actions

• `/argocd_sync confirm [app|target] [wait]` - Підтвердити синхронізацію ArgoCD (потрібна авторизація). Додайте `wait` щоб почекати завершення.
• `/argocd_sync_status [app|target] [wait]` - Перевірити статус синхронізації (опціонально `wait`)
• `/auto_deploy on|off|status` - Включити/вимкнути авто-синхронізацію при піднятті тунелю
"""

    async def _cmd_restart_services(self, args: str) -> str:
        """Рестарт сервісів"""
        return """🔄 **Restart Services**

⚠️ Для безпеки рестарт потребує підтвердження.

Для локального рестарту:
```bash
cd /Users/dima-mac/Documents/Predator_21
docker compose restart
```

Для віддаленого:
```bash
ssh dev-ngrok 'cd /root/predator && docker compose restart'
```"""

    async def _cmd_restart_ngrok(self, args: str) -> str:
        """Перезапуск ngrok на віддаленому сервері.
        Використання: /restart_ngrok confirm
        """

    async def _cmd_argocd_list(self, args: str) -> str:
        """List ArgoCD applications. Usage: /argocd_apps [target]"""
        target = args.strip().lower() if args else ""
        server, token = self._get_argocd_credentials(target)
        if not server or not token:
            return "❌ ArgoCD credentials not configured. Set ARGOCD_SERVER/ARGOCD_TOKEN or ARGOCD_NVIDIA_URL/ARGOCD_NVIDIA_TOKEN."

        ok, result = await self._call_argocd_api(server, token, "GET", "/applications")
        if not ok:
            return f"❌ ArgoCD API error: {result}"

        apps = result.get("items", []) if isinstance(result, dict) else []
        lines = [f"✅ Найдено {len(apps)} додатків:".upper()]
        for a in apps[:50]:
            name = a.get("metadata", {}).get("name")
            health = a.get("status", {}).get("health", {}).get("status") if a.get("status") else "Unknown"
            sync = a.get("status", {}).get("sync", {}).get("status") if a.get("status") else "Unknown"
            lines.append(f"• {name} — Health: {health} — Sync: {sync}")

        return "\n".join(lines)

    async def _cmd_argocd_status(self, args: str) -> str:
        """Get status for an ArgoCD application. Usage: /argocd [app] or /argocd [target]"""
        parts = args.strip().split() if args else []
        app = parts[0] if parts else "predator-nvidia"
        # allow using app name or target alias (nvidia|oracle|macbook)
        target = ""
        if app in ("nvidia", "oracle", "mac", "macbook"):
            target = app
            app = f"predator-{app}"

        server, token = self._get_argocd_credentials(target)
        if not server or not token:
            return "❌ ArgoCD credentials not configured. Set ARGOCD_SERVER/ARGOCD_TOKEN or per-target ones."

        ok, result = await self._call_argocd_api(server, token, "GET", f"/applications/{app}")
        if not ok:
            return f"❌ ArgoCD API error: {result}"

        status = result.get("status", {})
        health = status.get("health", {}).get("status", "Unknown")
        sync = status.get("sync", {}).get("status", "Unknown")
        message = f"📋 ArgoCD — {app}\n• Health: {health}\n• Sync: {sync}\n"
        # Add sync summary & conditions
        if status.get("conditions"):
            for cond in status["conditions"]:
                message += f"• {cond.get('type')}: {cond.get('message', '')}\n"
        return message

    async def _cmd_argocd_sync(self, args: str) -> str:
        """Trigger an ArgoCD sync for app. Usage: /argocd_sync [app|target] or /argocd_sync confirm [app]"""
        if not self._is_requesting_user_authorized():
            return "❌ Ви не авторизовані для синхронізації ArgoCD (доступ обмежено)."

        parts = args.strip().split()
        # Support: /argocd_sync confirm predator-nvidia or /argocd_sync predator-nvidia
        confirm = False
        app = "predator-nvidia"
        target = ""
        if parts and parts[0] == "confirm":
            confirm = True
            if len(parts) > 1:
                app = parts[1]
        elif parts:
            # Could be app or target alias
            candidate = parts[0]
            if candidate in ("nvidia", "oracle", "mac", "macbook"):
                target = candidate
                app = f"predator-{candidate}"
            else:
                app = candidate

        if not confirm:
            return "⚠️ Для підтвердження синхронізації надішліть: `/argocd_sync confirm [app]`"

        server, token = self._get_argocd_credentials(target)
        if not server or not token:
            return "❌ ArgoCD credentials not configured. Set ARGOCD_SERVER/ARGOCD_TOKEN or per-target ones."

        ok, result = await self._call_argocd_api(server, token, "POST", f"/applications/{app}/sync", json_payload={})
        if not ok:
            return f"❌ ArgoCD sync failed: {result}"
        msg = f"🔁 ArgoCD sync initiated for `{app}` — Response: {json.dumps(result) if isinstance(result, dict) else result}"
        # If user asked to wait (e.g., '/argocd_sync confirm predator-nvidia wait'), wait for completion
        if 'wait' in args:
            wait_ok, wait_result = await self._wait_for_argocd_sync(server, token, app, timeout=180)
            if wait_ok:
                return msg + "\n\n✅ ArgoCD sync completed: " + wait_result
            else:
                return msg + "\n\n⚠️ ArgoCD sync did not complete in time or failed: " + wait_result
        # notify asynchronously about sync if we can
        try:
            # Prefer chat from incoming request, else fallback to default chat
            chat = None
            if hasattr(self, 'requesting_user_id'):
                chat = self.requesting_user_id
            # spawn background notification task - don't await
            asyncio.create_task(self._notify_argocd_sync_result(server, token, app, chat))
        except Exception as e:
            logger.debug(f"Failed to schedule ArgoCD sync notification: {e}")

        return msg

    async def _wait_for_argocd_sync(self, server: str, token: str, app: str, timeout: int = 120) -> Tuple[bool, str]:
        """Poll ArgoCD app status until the current operation finishes or until timeout.
        Returns (success, message).
        """
        try:
            deadline = time.time() + timeout
            while time.time() < deadline:
                ok, res = await self._call_argocd_api(server, token, "GET", f"/applications/{app}")
                if not ok:
                    return False, f"API call failed: {res}"
                status = res.get('status', {})
                op_state = status.get('operationState') or {}
                phase = op_state.get('phase')
                sync_status = status.get('sync', {}).get('status')
                if not op_state:
                    # No operation - no sync in progress
                    if sync_status == 'Synced':
                        return True, 'Synced'
                    else:
                        # if no op and not synced, just return current sync state
                        return False, f'Sync status: {sync_status or "Unknown"}'
                if phase in ('Succeeded', 'Failed', 'Error'):
                    if phase == 'Succeeded' and sync_status == 'Synced':
                        return True, f"Phase: {phase}, Sync: {sync_status}"
                    else:
                        return False, f"Phase: {phase}, Sync: {sync_status}"
                # else still running
                await asyncio.sleep(3)
            return False, f"Timeout ({timeout}s) waiting for sync"
        except Exception as e:
            return False, str(e)

    async def _cmd_argocd_sync_status(self, args: str) -> str:
        """Check current sync status for ArgoCD application. Usage: /argocd_sync_status [app|target] [wait]"""
        parts = args.strip().split() if args else []
        app = parts[0] if parts else "predator-nvidia"
        target = ""
        if app in ("nvidia", "oracle", "mac", "macbook"):
            target = app
            app = f"predator-{app}"

        server, token = self._get_argocd_credentials(target)
        if not server or not token:
            return "❌ ArgoCD credentials not configured."

        ok, res = await self._call_argocd_api(server, token, "GET", f"/applications/{app}")
        if not ok:
            return f"❌ ArgoCD API error: {res}"

        status = res.get('status', {})
        sync = status.get('sync', {}).get('status', 'Unknown')
        health = status.get('health', {}).get('status', 'Unknown')
        op_state = status.get('operationState') or {}
        phase = op_state.get('phase', 'Idle')
        msg = f"📋 ArgoCD — {app}\n• Sync: {sync}\n• Health: {health}\n• Operation: {phase}"

        # Wait if requested
        if len(parts) > 1 and parts[1] in ("wait", "--wait"):
            wait_ok, wait_result = await self._wait_for_argocd_sync(server, token, app, timeout=180)
            if wait_ok:
                msg += "\n\n✅ Sync finished: " + wait_result
            else:
                msg += "\n\n⚠️ Sync did not finish: " + wait_result

        return msg

    async def _cmd_argocd_rollback(self, args: str) -> str:
        """Trigger an ArgoCD rollback to previous revision for an app. Usage: /argocd_rollback confirm [app]"""
        if not self._is_requesting_user_authorized():
            return "❌ Ви не авторизовані для виконання rollback"

        args_parts = args.strip().split()
        confirm = False
        app = 'predator-nvidia'
        if args_parts and args_parts[0] == 'confirm':
            confirm = True
            if len(args_parts) > 1:
                app = args_parts[1]
        elif args_parts:
            app = args_parts[0]

        if not confirm:
            return "⚠️ Для підтвердження виконайте: `/argocd_rollback confirm [app]`"

        server, token = self._get_argocd_credentials('nvidia')
        if not server or not token:
            return "❌ ArgoCD credentials not configured."

        ok, result = await self._call_argocd_api(server, token, 'POST', f'/applications/{app}/rollback', json_payload={'revision': 'previous'})
        if ok:
            # Notify and return
            # schedule async notify
            try:
                chat = self.requesting_user_id or self.default_chat_id
                if chat:
                    await self._send_telegram_message(chat, f"🔁 Rollback requested for {app}")
            except Exception:
                pass
            return f"🔁 Rollback requested for `{app}`. Response: {json.dumps(result) if isinstance(result, dict) else result}"
        return f"❌ Rollback failed: {result}"

    async def _cmd_argocd_probe(self, args: str) -> str:
        """Probe if ArgoCD is used and reachable. Usage: /argocd_probe [target]"""
        target = args.strip().lower() if args else ""
        server, token = self._get_argocd_credentials(target)
        findings = []
        # Check repo for argocd manifests
        repo_path = os.getcwd()
        if os.path.isdir(os.path.join(repo_path, "argocd")):
            findings.append("✅ `argocd/` manifests found in repository")
        else:
            findings.append("⚠️ `argocd/` not found in repository (may be used externally)")

        if server:
            findings.append(f"🔗 ArgoCD server configured: {server}")
            if token:
                ok, resp = await self._call_argocd_api(server, token, "GET", "/applications")
                if ok:
                    apps = resp.get("items", []) if isinstance(resp, dict) else []
                    findings.append(f"✅ ArgoCD API reachable — {len(apps)} applications discovered.")
                else:
                    findings.append(f"❌ ArgoCD API test failed: {resp}")
            else:
                findings.append("⚠️ ArgoCD token not provided — cannot call API.")
        else:
            findings.append("⚠️ ArgoCD server not configured in environment (ARGOCD_*).")

        return "\n".join(findings)
        if not self._is_requesting_user_authorized():
            return "❌ Ви не авторизовані для перезапуску ngrok."

        confirm = args.strip().lower()
        if confirm != "confirm":
            return "⚠️ Щоб виконати перезапуск, надішліть `/restart_ngrok confirm`"

        result = await self._restart_ngrok_on_server()
        if result.success:
            return f"✅ Ngrok перезапущено.\n{result.output[:1200]}"
        return f"❌ Не вдалося перезапустити ngrok: {result.error}\n{result.output}"

    def _is_requesting_user_authorized(self) -> bool:
        if not self.authorized_users:
            # No authorized users configured — deny by default
            return False
        return (self.requesting_user_id is not None) and (self.requesting_user_id in self.authorized_users)

    def _log_audit(self, user_id: int, command: str, success: bool, message: str = '') -> None:
        """Write an audit entry into a local log (append)."""
        try:
            import datetime as _dt
            line = f"{_dt.datetime.utcnow().isoformat()}Z user={user_id} success={success} cmd={command} msg={message}\n"
            with open(self.audit_log_path, 'a') as af:
                af.write(line)
        except Exception as e:
            logger.debug(f"Failed to write audit log: {e}")

    async def _restart_ngrok_on_server(self) -> ServerAction:
        """Tries to restart ngrok on the remote host via SSH alias 'dev-ngrok'."""
        try:
            cmd = ["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=10", "dev-ngrok", "sudo", "systemctl", "restart", "ngrok-ssh.service"]
            proc = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            if proc.returncode == 0:
                # get status
                status_proc = subprocess.run(["ssh", "dev-ngrok", "sudo", "systemctl", "status", "ngrok-ssh.service", "--no-pager", "-n", "20"], capture_output=True, text=True, timeout=20)
                return ServerAction(action="restart_ngrok", success=True, output=status_proc.stdout)
            # fallback: try to kill and restart
            fallback_cmd = "ssh -o BatchMode=yes -o ConnectTimeout=10 dev-ngrok 'pkill ngrok || true; nohup /usr/local/bin/ngrok tcp 22 --log /var/log/ngrok.log >/dev/null 2>&1 &; sleep 2; echo started'"
            fallback_proc = subprocess.run(fallback_cmd, shell=True, capture_output=True, text=True, timeout=30)
            return ServerAction(action="restart_ngrok", success=(fallback_proc.returncode==0), output=fallback_proc.stdout, error=fallback_proc.stderr)
        except Exception as e:
            return ServerAction(action="restart_ngrok", success=False, output="", error=str(e))

    async def _cmd_ai_search(self, args: str) -> str:
        """AI пошук"""
        if not args:
            return "❌ Вкажіть запит для пошуку: `/search назва компанії`"

        try:
            result = await ai_engine.analyze(args, depth="quick")
            return f"""🔍 **Результат пошуку**

Запит: {args}

{result.answer[:1200]}

📊 Джерела: {len(result.sources)}"""
        except Exception as e:
            return f"❌ Помилка пошуку: {e}"

    async def _cmd_ai_analyze(self, args: str) -> str:
        """AI аналіз"""
        if not args:
            return "❌ Вкажіть текст для аналізу"

        try:
            # Use Council mode for deep analysis
            result = await ai_engine.analyze(args, depth="deep", llm_mode="council")
            return f"""🧠 **Аналіз (LLM Council)**

{result.answer[:2000]}

⏱️ Час: {result.processing_time_ms:.0f}ms
🤖 Модель: {result.model_used}"""
        except Exception as e:
            return f"❌ Помилка аналізу: {e}"

    # ==================== CONFIGURATION COMMANDS ====================

    async def _cmd_add_key(self, args: str) -> str:
        """Додати API ключ: /add_key provider key"""
        if not args:
            return "❌ Формат: `/add_key provider key` (наприклад: `/add_key groq gsk_...`)"

        parts = args.split()
        if len(parts) < 2:
            return "❌ Вкажіть провайдера та ключ"

        provider = parts[0].lower()
        key = parts[1]

        if llm_service.add_api_key(provider, key):
             return f"✅ Ключ успішно додано для **{provider}** і збережено в конфігурації."
        else:
             return f"❌ Не вдалося додати ключ. Перевірте назву провайдера ({', '.join(llm_service.providers.keys())})."

    async def _cmd_set_model(self, args: str) -> str:
        """Змінити модель: /set_model provider model"""
        if not args:
             return "❌ Формат: `/set_model provider model`"

        parts = args.split()
        if len(parts) < 2:
            return "❌ Вкажіть провайдера та модель"

        provider = parts[0].lower()
        model = parts[1]

        models = llm_service.get_provider_models(provider)

        if llm_service.set_provider_model(provider, model):
            return f"✅ Модель для **{provider}** змінено на `{model}` і збережено."
        else:
            return f"❌ Не вдалося змінити. Доступні моделі для {provider}:\n" + "\n".join([f"- `{m}`" for m in models])

    async def _cmd_auto_restart(self, args: str) -> str:
        """Toggle or show AUTO_RESTART_NGROK: /auto_restart on|off|status"""
        if not self._is_requesting_user_authorized():
            return "❌ Ви не авторизовані для зміни налаштувань автоматичного перезапуску."

        action = args.strip().lower()
        if action in ("on", "true", "1"):
            self.auto_restart_ngrok = True
            try:
                with open(self.state_file_path, 'w') as sf:
                    json.dump({'auto_deploy_on_up': self.auto_deploy_on_up, 'auto_restart_ngrok': True}, sf)
            except Exception:
                logger.debug('Failed to persist bot state')
            return "✅ Автоматичний перезапуск ngrok увімкнено"
        elif action in ("off", "false", "0"):
            self.auto_restart_ngrok = False
            try:
                with open(self.state_file_path, 'w') as sf:
                    json.dump({'auto_deploy_on_up': self.auto_deploy_on_up, 'auto_restart_ngrok': False}, sf)
            except Exception:
                logger.debug('Failed to persist bot state')
            return "✅ Автоматичний перезапуск ngrok вимкнено"
        elif action == "status" or action == "":
            return f"🔁 AUTO_RESTART_NGROK={'true' if self.auto_restart_ngrok else 'false'}"
        else:
            return "❌ Невірна опція. Використовуйте `/auto_restart on|off|status`"

    # ==================== PREDATOR CLI EMULATOR ====================

    async def _cmd_predator_cli(self, args: str) -> str:
        """
        Емулятор CLI команд: predator [command] [options]
        Supported:
          predator add provider --name=Groq --key=...
          predator status
        """
        if not args:
            return "🖥️ **Predator CLI**\nUsage: `predator [command] [options]`"

        # Simple argument parser
        parts = args.split()
        command = parts[0].lower()


        try:
            # Handle 'add provider'
            if command == "add" and len(parts) > 1 and parts[1] == "provider":
                # Parse args like --name=Groq --key=...
                arg_str = " ".join(parts[2:])

                # Manual parsing for simplicity (argparse is tricky with partial args)
                name = None
                key = None

                for item in parts[2:]:
                    if item.startswith("--name="):
                        name = item.split("=", 1)[1]
                    elif item.startswith("--key="):
                        key = item.split("=", 1)[1]
                    elif "--name" in parts and item != "--name": # handle space separated
                        idx = parts.index("--name")
                        if idx + 1 < len(parts): name = parts[idx+1]

                if not name:
                    return "❌ Error: Missing --name parameter"

                # If key is missing, we might check if user provided it in text without flag
                # But strict CLI mode requires flags or sequence

                if not key and len(parts) >= 4 and not parts[3].startswith("--"):
                     # Assume format: add provider Groq key
                     name = parts[2]
                     key = parts[3]

                if not key:
                    return f"⚠️ Provider **{name}** needs a key.\nUse: `predator add provider --name={name} --key=YOUR_KEY`"

                # Execute logic
                if llm_service.add_api_key(name.lower(), key):
                    return f"✅ **Success:** Provider {name} added/updated with new key."
                else:
                    return f"❌ **Failed:** Could not add provider {name}."

            elif command == "status":
                return await self._cmd_server_status("")

            else:
                 return f"❌ Unknown command: `predator {command}`"

        except Exception as e:
            return f"❌ CLI Error: {e}"

    # ==================== TELEGRAM API ====================

    async def send_message(
        self,
        chat_id: int,
        text: str,
        parse_mode: str = "Markdown",
        reply_markup: Optional[Dict] = None
    ) -> bool:
        """Відправляє повідомлення"""
        if not self.enabled:
            return False

        try:
            async with httpx.AsyncClient() as client:
                data = {
                    "chat_id": chat_id,
                    "text": text,
                    "parse_mode": parse_mode
                }
                if reply_markup:
                    data["reply_markup"] = json.dumps(reply_markup)

                await client.post(f"{self.api_url}/sendMessage", json=data)
                return True
        except Exception as e:
            logger.error(f"Failed to send message: {e}")
            return False

    async def _answer_callback(self, callback_id: str) -> bool:
        """Відповідає на callback query"""
        try:
            async with httpx.AsyncClient() as client:
                await client.post(
                    f"{self.api_url}/answerCallbackQuery",
                    json={"callback_query_id": callback_id}
                )
                return True
        except Exception as e:
            logger.error(f"Failed to answer callback: {e}")
            return False

    async def set_webhook(self, url: str) -> bool:
        """Встановлює webhook"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_url}/setWebhook",
                    json={"url": url, "allowed_updates": ["message", "callback_query"]}
                )
                result = response.json()
                return result.get("ok", False)
        except Exception as e:
            logger.error(f"Failed to set webhook: {e}")
            return False

    async def delete_webhook(self) -> bool:
        """Видаляє webhook (для polling)"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(f"{self.api_url}/deleteWebhook")
                return response.json().get("ok", False)
        except Exception as e:
            logger.error(f"Failed to delete webhook: {e}")
            return False

    async def get_updates(self, offset: int = 0, timeout: int = 30) -> List[Dict]:
        """Отримує оновлення (polling mode)"""
        try:
            async with httpx.AsyncClient(timeout=timeout + 10) as client:
                response = await client.get(
                    f"{self.api_url}/getUpdates",
                    params={"offset": offset, "timeout": timeout}
                )
                result = response.json()
                return result.get("result", [])
        except Exception as e:
            logger.error(f"Failed to get updates: {e}")
            return []


# Singleton instance
telegram_assistant: Optional[TelegramAssistant] = None


def init_assistant(token: str) -> TelegramAssistant:
    """Initialize telegram assistant with token"""
    global telegram_assistant
    telegram_assistant = TelegramAssistant(token)
    return telegram_assistant


def get_assistant() -> Optional[TelegramAssistant]:
    """Get telegram assistant instance"""
    return telegram_assistant
