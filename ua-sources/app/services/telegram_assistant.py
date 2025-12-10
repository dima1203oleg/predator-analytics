"""
Telegram AI Assistant - Повний помічник для управління сервером
Handles:
- Автоматичний парсинг ngrok URLs
- Оновлення SSH конфігу
- Управління сервером через природну мову
- Інтерактивне меню
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
            
            # Setup/Configuration (NEW)
            "add_key": self._cmd_add_key,
            "set_model": self._cmd_set_model,
            "auto_restart": self._cmd_auto_restart,
            "predator": self._cmd_predator_cli,
        }
        
        # Keyboard layouts
        self.main_menu_keyboard = {
            "keyboard": [
                [{"text": "📊 Статус"}, {"text": "🖥️ Сервер"}],
                [{"text": "🐳 Docker"}, {"text": "☸️ K8s"}],
                [{"text": "🔗 Ngrok"}, {"text": "📡 SSH Config"}],
                [{"text": "📦 Deploy"}, {"text": "🔍 Пошук"}],
                [{"text": "❓ Допомога"}]
            ],
            "resize_keyboard": True,
            "one_time_keyboard": False
        }

        self.inline_menu = {
            "inline_keyboard": [
                [
                    {"text": "📊 Статус", "callback_data": "status"},
                    {"text": "💾 Диск", "callback_data": "disk"}
                ],
                [
                    {"text": "🧠 RAM", "callback_data": "memory"},
                    {"text": "⚡ CPU", "callback_data": "cpu"}
                ],
                [
                    {"text": "🐳 Docker", "callback_data": "docker"},
                    {"text": "☸️ Pods", "callback_data": "pods"}
                ],
                [
                    {"text": "🔗 Ngrok Info", "callback_data": "ngrok"},
                    {"text": "🚦 Auto Deploy", "callback_data": "auto_deploy"}
                ],
                [
                    {"text": "↩️ Auto Rollback", "callback_data": "auto_rollback"}
                ],
                [
                    {"text": "📝 Logs", "callback_data": "logs"},
                    {"text": "🔄 Restart", "callback_data": "restart"}
                ]
            ]
        }

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
            try:
                with open(self.state_file_path, 'w') as sf:
                    json.dump({'auto_deploy_on_up': self.auto_deploy_on_up, 'auto_restart_ngrok': self.auto_restart_ngrok, 'auto_rollback_on_degrade': True}, sf)
            except Exception:
                logger.debug('Failed to persist bot state')
            return "✅ AUTO_ROLLBACK_ON_DEGRADE встановлено у: true"
        elif parts[0] in ("off", "false", "0"):
            self.auto_rollback_on_degrade = False
            try:
                with open(self.state_file_path, 'w') as sf:
                    json.dump({'auto_deploy_on_up': self.auto_deploy_on_up, 'auto_restart_ngrok': self.auto_restart_ngrok, 'auto_rollback_on_degrade': False}, sf)
            except Exception:
                logger.debug('Failed to persist bot state')
            return "✅ AUTO_ROLLBACK_ON_DEGRADE встановлено у: false"
        else:
            return "❌ Невірна команда. Використовуйте: /auto_rollback on|off|status"

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
    
    async def process_update(self, update: Dict[str, Any]) -> Optional[str]:
        """
        Обробляє Telegram update
        """
        try:
            # Callback query (inline buttons)
            if "callback_query" in update:
                return await self._handle_callback(update["callback_query"])
            
            # Message
            if "message" not in update:
                return None
            
            message = update["message"]
            chat_id = message["chat"]["id"]
            user_id = message["from"]["id"]
            text = message.get("text", "")
            
            if not text:
                return None
            
            # Визначаємо тип повідомлення
            msg_type = self._classify_message(text)
            
            if msg_type == MessageType.NGROK_UPDATE:
                return await self._handle_ngrok_update(text, chat_id)
            elif msg_type == MessageType.COMMAND:
                return await self._handle_command(text, chat_id, user_id)
            else:
                return await self._handle_query(text, chat_id, user_id)
                
        except Exception as e:
            logger.error(f"Error processing update: {e}")
            return f"❌ Помилка: {str(e)}"
    
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
        """Обробляє оновлення ngrok"""
        ngrok_info = self.parse_ngrok_message(text)

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

        if ngrok_info:
            success, message = await self.update_ssh_config(ngrok_info)
            # If configured, trigger ArgoCD sync automatically when tunnel appears
            if success and self.auto_deploy_on_up:
                server, token = self._get_argocd_credentials("nvidia")
                if server and token:
                    ok, _ = await self._call_argocd_api(server, token, "POST", f"/applications/predator-nvidia/sync", json_payload={})
                    if ok:
                        message = message + "\n\n🔁 Auto ArgoCD sync initiated for predator-nvidia."
                    else:
                        message = message + "\n\n❗ Auto ArgoCD sync attempted but failed. Check logs."
            return message

        return "⚠️ Не вдалося розпарсити ngrok дані"
    
    async def _handle_command(self, text: str, chat_id: int, user_id: int) -> str:
        """Обробляє команди"""
        text_clean = text.lstrip("/").lower().strip()
        
        # Emoji mapping
        emoji_map = {
            "📊": "status", "статус": "status",
            "🖥️": "status", "сервер": "status",
            "🐳": "docker", "docker": "docker",
            "☸️": "k8s", "k8s": "k8s", "pods": "pods",
            "🔗": "ngrok", "ngrok": "ngrok",
            "📡": "ssh", "ssh config": "ssh",
            "📦": "deploy", "deploy": "deploy",
            "🔍": "search", "пошук": "search",
            "❓": "help", "допомога": "help",
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
        
        # Спеціальні команди
        if cmd_name in ["start", "menu"]:
            return await self._cmd_start(chat_id)
        elif cmd_name == "help":
            return await self._cmd_help()
        
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
    
    async def _handle_callback(self, callback: Dict[str, Any]) -> str:
        """Обробляє callback від inline кнопок"""
        data = callback.get("data", "")
        chat_id = callback["message"]["chat"]["id"]
        
        handler = self.system_commands.get(data)
        if handler:
            user_id = callback.get("from", {}).get("id")
            self.requesting_user_id = user_id
            try:
                result = await handler("")
            finally:
                self.requesting_user_id = None
            # Відповідаємо на callback
            await self._answer_callback(callback["id"])
            return result
        
        return "❌ Невідома команда"
    
    async def _handle_query(self, text: str, chat_id: int, user_id: int) -> str:
        """Обробляє вільний запит через AI"""
        return await self._handle_ai_query(text, chat_id)
    
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
        """Стартове повідомлення з меню"""
        return """🚀 **Predator Analytics Assistant**

Вітаю! Я твій персональний AI-помічник для управління сервером.

**Що я вмію:**
• 📊 Моніторинг сервера (CPU, RAM, Disk)
• 🐳 Docker/K8s управління
• 🔗 Автоматичне оновлення ngrok/SSH
• 📝 Перегляд логів
• 🔍 Пошук в українських реєстрах
• 💬 Відповідаю на запитання природною мовою

**Надішли ngrok повідомлення** - автоматично оновлю SSH config!

Використовуй /menu для меню або просто пиши що потрібно."""
    
    async def _cmd_help(self) -> str:
        """Допомога"""
        return ("""📖 **Команди асистента**

**🖥️ Сервер:**
• `/status` - Загальний статус
• `/disk` - Використання диску
• `/memory` - RAM
• `/cpu` - CPU завантаження
• `/uptime` - Аптайм

**🐳 Docker/K8s:**
• `/docker` - Статус контейнерів
• `/pods` - Kubernetes поди
• `/services` - Сервіси
• `/logs [сервіс]` - Логи

**🔗 Мережа:**
• `/ngrok` - Поточні ngrok дані
• `/ssh` - SSH конфіг
• `/connect` - Як підключитись

**📦 Deploy / ArgoCD:**
• `/git` - Git статус
• `/deploy` - Статус деплою
• `/restart` - Рестарт сервісів
• `/argocd_apps [target]` - Показати ArgoCD додатки (target: nvidia|oracle|macbook)
• `/argocd [app|target]` - Дізнатись статус ArgoCD додатка (наприклад `/argocd predator-nvidia`)
• `/argocd_sync confirm [app|target]` - Підтвердити синхронізацію ArgoCD (потрібна авторизація)
• `/restart_ngrok confirm` - Перезапуск ngrok на віддаленому сервері (потрібна авторизація)

**🔍 AI/Пошук:**
• `/search [запит]` - Пошук
• `/analyze [текст]` - Аналіз

**💡 Або просто напиши запит природною мовою!**"""
            + "\n\n**Налаштування автоматизації**\n• `AUTO_RESTART_NGROK=true` — автоматично намагатися перезапустити ngrok при падінні\n• `TELEGRAM_AUTHORIZED_USERS` — кома-розділений список телеграм user_id для виконання чутливих команд")
        
    
    async def _cmd_server_status(self, args: str) -> str:
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
            return f"⚠️ Docker не запущено або помилка"
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
        
        import argparse
        import shlex
        
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
