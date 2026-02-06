from __future__ import annotations


"""Remote Server Manager - Управління віддаленим NVIDIA сервером
Handles:
- Ngrok tunnel detection and auto-configuration
- Remote command execution via SSH
- Server health monitoring
- Automatic SSH config updates
- Environment variable management.
"""
import asyncio
from dataclasses import dataclass, field
from datetime import UTC, datetime, timezone
import json
import logging
from pathlib import Path
import re
import subprocess
from typing import Any, Dict, List, Optional, Tuple


logger = logging.getLogger(__name__)


@dataclass
class ServerConnection:
    """Інформація про підключення до сервера."""
    host: str
    port: int
    user: str = "root"
    http_url: str = ""
    tunnel_type: str = "ngrok"  # ngrok, cloudflare, etc.
    last_seen: datetime = field(default_factory=lambda: datetime.now(UTC))
    is_active: bool = True

    @property
    def ssh_command(self) -> str:
        return f"ssh -p {self.port} {self.user}@{self.host}"

    @property
    def scp_prefix(self) -> str:
        return f"scp -P {self.port}"


@dataclass
class RemoteExecutionResult:
    """Результат виконання команди на віддаленому сервері."""
    command: str
    success: bool
    output: str
    error: str = ""
    execution_time_ms: float = 0
    server: str | None = None


class RemoteServerManager:
    """Менеджер віддаленого NVIDIA сервера."""

    def __init__(self):
        self.project_dir = Path("/Users/dima-mac/Documents/Predator_21")
        self.ssh_config_path = Path.home() / ".ssh" / "config"
        self.ssh_key_path = Path.home() / ".ssh" / "id_ed25519_ngrok"

        # Поточне підключення
        self.current_connection: ServerConnection | None = None

        # Історія підключень
        self.connection_history: list[ServerConnection] = []

        # Шляхи для оновлення
        self.env_file = self.project_dir / ".env"
        self.k8s_config = self.project_dir / "k8s" / "values.yaml"

        # SSH alias
        self.ssh_alias = "dev-ngrok"

        # Завантажуємо останнє підключення
        self._load_last_connection()

    def _load_last_connection(self):
        """Завантажує останнє підключення з файлу."""
        state_file = Path.home() / ".predator_ngrok_state.json"
        try:
            if state_file.exists():
                data = json.loads(state_file.read_text())
                self.current_connection = ServerConnection(
                    host=data.get("host", ""),
                    port=data.get("port", 22),
                    user=data.get("user", "root"),
                    http_url=data.get("http_url", ""),
                    is_active=False  # Буде перевірено при наступному повідомленні
                )
                logger.info(f"Loaded last connection: {self.current_connection.host}:{self.current_connection.port}")
        except Exception as e:
            logger.debug(f"Failed to load connection state: {e}")

    def _save_connection(self, conn: ServerConnection):
        """Зберігає підключення у файл."""
        state_file = Path.home() / ".predator_ngrok_state.json"
        try:
            state_file.write_text(json.dumps({
                "host": conn.host,
                "port": conn.port,
                "user": conn.user,
                "http_url": conn.http_url,
                "last_seen": conn.last_seen.isoformat()
            }, indent=2))
        except Exception as e:
            logger.exception(f"Failed to save connection state: {e}")

    def parse_ngrok_message(self, text: str) -> ServerConnection | None:
        """Парсить різні формати ngrok повідомлень.

        Підтримувані формати:
        1. SSH: tcp://host:port
        2. ssh root@host -p port
        3. host:port у тексті
        4. ngrok URLs повідомлення
        """
        # Формат 1: SSH: tcp://host:port
        ssh_pattern = r'SSH[:\s]+tcp://([^:]+):(\d+)'
        ssh_match = re.search(ssh_pattern, text, re.IGNORECASE)

        # Формат 2: ssh command
        ssh_cmd_pattern = r'ssh\s+(?:\S+@)?(\S+)\s+-p\s*(\d+)'
        ssh_cmd_match = re.search(ssh_cmd_pattern, text, re.IGNORECASE)

        # Формат 3: host:port (наприклад 0.tcp.eu.ngrok.io:12345)
        host_port_pattern = r'(\d+\.tcp\.[a-z]+\.ngrok\.io):(\d+)'
        host_port_match = re.search(host_port_pattern, text, re.IGNORECASE)

        # HTTP URL
        http_pattern = r'HTTP[:\s]+(https?://[^\s]+)'
        http_match = re.search(http_pattern, text, re.IGNORECASE)
        http_url = http_match.group(1) if http_match else ""

        # Визначаємо host та port
        host, port = None, None

        if ssh_match:
            host = ssh_match.group(1)
            port = int(ssh_match.group(2))
        elif ssh_cmd_match:
            host = ssh_cmd_match.group(1)
            port = int(ssh_cmd_match.group(2))
        elif host_port_match:
            host = host_port_match.group(1)
            port = int(host_port_match.group(2))

        if host and port:
            return ServerConnection(
                host=host,
                port=port,
                http_url=http_url,
                is_active=True
            )

        return None

    async def update_all_configs(self, conn: ServerConnection) -> tuple[bool, str]:
        """Оновлює всі конфігурації при отриманні нової ngrok адреси:
        1. SSH config (~/.ssh/config)
        2. .env файл
        3. Kubernetes values (якщо є)
        4. Зберігає стан.
        """
        results = []
        all_success = True

        # 1. SSH Config
        ssh_success, ssh_msg = await self.update_ssh_config(conn)
        results.append(f"{'✅' if ssh_success else '❌'} SSH Config: {ssh_msg}")
        all_success = all_success and ssh_success

        # 2. Environment variables
        env_success, env_msg = await self.update_env_file(conn)
        results.append(f"{'✅' if env_success else '❌'} .env: {env_msg}")

        # 3. Save state
        self._save_connection(conn)
        self.current_connection = conn
        self.connection_history.append(conn)

        # Формуємо повідомлення
        message = f"""
🔗 **Нове Ngrok підключення виявлено!**

📡 **Дані підключення:**
• Host: `{conn.host}`
• Port: `{conn.port}`
• HTTP: {conn.http_url or 'N/A'}

🔧 **Оновлено:**
{chr(10).join(results)}

📋 **Швидке підключення:**
```bash
ssh {self.ssh_alias}
# або
ssh -p {conn.port} {conn.user}@{conn.host}
```
"""
        return all_success, message

    async def update_ssh_config(self, conn: ServerConnection) -> tuple[bool, str]:
        """Оновлює SSH config."""
        try:
            config_path = self.ssh_config_path

            if not config_path.exists():
                # Створюємо новий конфіг
                config_path.parent.mkdir(parents=True, exist_ok=True)
                content = ""
            else:
                content = config_path.read_text()

            # Шукаємо блок dev-ngrok
            pattern = rf'(Host\s+{self.ssh_alias}\s*\n(?:[^\n]*\n)*?)(?=Host\s|\Z)'
            match = re.search(pattern, content, re.IGNORECASE)

            # Визначаємо який ключ використовувати
            key_path = str(self.ssh_key_path) if self.ssh_key_path.exists() else "~/.ssh/id_rsa"

            new_block = f"""Host {self.ssh_alias}
    HostName {conn.host}
    Port {conn.port}
    User {conn.user}
    IdentityFile {key_path}
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
    LogLevel ERROR
"""

            if match:
                # Оновлюємо існуючий блок
                content = content[:match.start()] + new_block + content[match.end():]
            else:
                # Додаємо новий блок
                content = content.rstrip() + "\n\n" + new_block

            config_path.write_text(content)

            return True, f"Updated {self.ssh_alias} → {conn.host}:{conn.port}"

        except Exception as e:
            logger.exception(f"Failed to update SSH config: {e}")
            return False, str(e)

    async def update_env_file(self, conn: ServerConnection) -> tuple[bool, str]:
        """Оновлює .env файл з новими адресами."""
        try:
            if not self.env_file.exists():
                return False, "File not found"

            content = self.env_file.read_text()

            # Оновлюємо NVIDIA_SERVER_HOST та NVIDIA_SERVER_PORT
            updates = {
                "NVIDIA_SSH_HOST": conn.host,
                "NVIDIA_SSH_PORT": str(conn.port),
            }

            if conn.http_url:
                updates["NVIDIA_HTTP_URL"] = conn.http_url

            for key, value in updates.items():
                pattern = rf'^{key}=.*$'
                replacement = f'{key}={value}'

                if re.search(pattern, content, re.MULTILINE):
                    content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
                else:
                    content = content.rstrip() + f"\n{replacement}"

            self.env_file.write_text(content)

            return True, f"Updated {len(updates)} variables"

        except Exception as e:
            logger.exception(f"Failed to update .env: {e}")
            return False, str(e)

    async def execute_remote(self, command: str, timeout: int = 60) -> RemoteExecutionResult:
        """Виконує команду на віддаленому сервері через SSH."""
        import time
        start_time = time.time()

        if not self.current_connection:
            return RemoteExecutionResult(
                command=command,
                success=False,
                output="",
                error="No active connection. Send ngrok data first."
            )

        conn = self.current_connection

        try:
            # Формуємо SSH команду
            ssh_cmd = [
                "ssh",
                "-o", "StrictHostKeyChecking=no",
                "-o", "UserKnownHostsFile=/dev/null",
                "-o", "LogLevel=ERROR",
                "-o", f"ConnectTimeout={min(timeout, 30)}",
                "-p", str(conn.port),
            ]

            # Додаємо ключ якщо є
            if self.ssh_key_path.exists():
                ssh_cmd.extend(["-i", str(self.ssh_key_path)])

            ssh_cmd.append(f"{conn.user}@{conn.host}")
            ssh_cmd.append(command)

            logger.info(f"Executing remote: {command}")

            result = subprocess.run(
                ssh_cmd,
                check=False, capture_output=True,
                text=True,
                timeout=timeout
            )

            execution_time = (time.time() - start_time) * 1000

            return RemoteExecutionResult(
                command=command,
                success=result.returncode == 0,
                output=result.stdout or "",
                error=result.stderr if result.returncode != 0 else "",
                execution_time_ms=execution_time,
                server=f"{conn.host}:{conn.port}"
            )

        except subprocess.TimeoutExpired:
            return RemoteExecutionResult(
                command=command,
                success=False,
                output="",
                error=f"Timeout after {timeout}s"
            )
        except Exception as e:
            logger.exception(f"Remote execution error: {e}")
            return RemoteExecutionResult(
                command=command,
                success=False,
                output="",
                error=str(e)
            )

    async def check_connection(self) -> tuple[bool, str]:
        """Перевіряє чи активне підключення до сервера."""
        if not self.current_connection:
            return False, "No connection configured"

        result = await self.execute_remote("echo 'ping' && hostname", timeout=10)

        if result.success:
            self.current_connection.is_active = True
            self.current_connection.last_seen = datetime.now(UTC)
            return True, f"✅ Connected to {result.output.strip()}"
        self.current_connection.is_active = False
        return False, f"❌ Connection failed: {result.error}"

    async def get_remote_status(self) -> dict[str, Any]:
        """Отримує статус віддаленого сервера."""
        if not self.current_connection:
            return {"status": "disconnected", "error": "No connection"}

        commands = {
            "hostname": "hostname",
            "uptime": "uptime",
            "docker": "docker ps --format 'table {{.Names}}\t{{.Status}}' 2>/dev/null | head -15",
            "gpu": "nvidia-smi --query-gpu=name,memory.used,memory.total,utilization.gpu --format=csv,noheader 2>/dev/null || echo 'N/A'",
            "disk": "df -h / | tail -1",
            "memory": "free -h | grep Mem",
        }

        results = {}
        for name, cmd in commands.items():
            result = await self.execute_remote(cmd, timeout=15)
            results[name] = result.output.strip() if result.success else f"Error: {result.error}"

        return {
            "status": "connected" if self.current_connection.is_active else "unknown",
            "host": f"{self.current_connection.host}:{self.current_connection.port}",
            "data": results
        }

    async def sync_files_to_remote(self, local_path: str, remote_path: str) -> RemoteExecutionResult:
        """Синхронізує файли на віддалений сервер."""
        if not self.current_connection:
            return RemoteExecutionResult(
                command="rsync",
                success=False,
                output="",
                error="No active connection"
            )

        conn = self.current_connection

        try:
            cmd = [
                "rsync", "-avz", "--progress",
                "-e", f"ssh -p {conn.port} -o StrictHostKeyChecking=no",
                local_path,
                f"{conn.user}@{conn.host}:{remote_path}"
            ]

            result = subprocess.run(cmd, check=False, capture_output=True, text=True, timeout=300)

            return RemoteExecutionResult(
                command=" ".join(cmd),
                success=result.returncode == 0,
                output=result.stdout,
                error=result.stderr if result.returncode != 0 else ""
            )
        except Exception as e:
            return RemoteExecutionResult(
                command="rsync",
                success=False,
                output="",
                error=str(e)
            )

    async def deploy_to_remote(self) -> list[RemoteExecutionResult]:
        """Повний деплой на віддалений сервер."""
        results = []

        # 1. Git pull
        result = await self.execute_remote("cd ~/predator-analytics && git pull origin main")
        results.append(result)

        if not result.success:
            return results

        # 2. Docker build & up
        result = await self.execute_remote(
            "cd ~/predator-analytics && docker compose pull && docker compose up -d --build",
            timeout=300
        )
        results.append(result)

        # 3. Health check
        await asyncio.sleep(10)
        result = await self.execute_remote("curl -s http://localhost:8000/health || echo 'Health check failed'")
        results.append(result)

        return results

    def get_connection_info(self) -> str:
        """Повертає інформацію про поточне підключення."""
        if not self.current_connection:
            return """
❌ **Немає активного підключення**

Надішліть ngrok дані у форматі:
```
SSH: tcp://X.tcp.eu.ngrok.io:12345
HTTP: https://jolyn-bifid-eligibly.ngrok-free.dev/admin
```
"""

        conn = self.current_connection
        status = "🟢 Active" if conn.is_active else "🟡 Unknown"

        return f"""
🔗 **NVIDIA Server Connection**

{status}

📡 **Дані:**
• Host: `{conn.host}`
• Port: `{conn.port}`
• User: `{conn.user}`
• HTTP: {conn.http_url or 'N/A'}

📋 **Підключення:**
```bash
ssh {self.ssh_alias}
```

⏰ Останнє оновлення: {conn.last_seen.strftime('%Y-%m-%d %H:%M:%S')} UTC
"""


# Singleton
remote_server = RemoteServerManager()
