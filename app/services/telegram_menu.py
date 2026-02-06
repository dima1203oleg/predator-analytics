from __future__ import annotations


"""Enhanced Telegram Menu System
Красиве інтерактивне меню з підменю та inline кнопками.
"""
from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, List, Optional


class MenuState(Enum):
    """Стан меню."""
    MAIN = "main"
    DOCKER = "docker"
    KUBERNETES = "kubernetes"
    MONITORING = "monitoring"
    DEPLOY = "deploy"
    GIT = "git"
    AI = "ai"
    SETTINGS = "settings"
    LLM = "llm"
    NVIDIA = "nvidia"  # Новий стан для NVIDIA сервера


@dataclass
class MenuItem:
    """Елемент меню."""
    text: str
    callback_data: str
    emoji: str = ""
    description: str = ""


class TelegramMenuBuilder:
    """Будівник красивих Telegram меню."""

    def __init__(self):
        self.user_menu_states: dict[int, MenuState] = {}

    def get_user_state(self, user_id: int) -> MenuState:
        """Отримує стан меню користувача."""
        return self.user_menu_states.get(user_id, MenuState.MAIN)

    def set_user_state(self, user_id: int, state: MenuState):
        """Встановлює стан меню."""
        self.user_menu_states[user_id] = state

    def build_main_menu(self) -> dict[str, Any]:
        """Головне меню."""
        return {
            "inline_keyboard": [
                [
                    {"text": "📊 Статус системи", "callback_data": "menu_status"},
                    {"text": "🖥️ Моніторинг", "callback_data": "menu_monitoring"}
                ],
                [
                    {"text": "🎮 NVIDIA Сервер", "callback_data": "menu_nvidia"},  # НОВА КНОПКА
                    {"text": "🐳 Docker", "callback_data": "menu_docker"}
                ],
                [
                    {"text": "☸️ Kubernetes", "callback_data": "menu_k8s"},
                    {"text": "📦 Git/Deploy", "callback_data": "menu_deploy"}
                ],
                [
                    {"text": "🔗 Network", "callback_data": "menu_network"},
                    {"text": "🧠 AI Assistant", "callback_data": "menu_ai"}
                ],
                [
                    {"text": "⚙️ Налаштування", "callback_data": "menu_settings"},
                    {"text": "❓ Допомога", "callback_data": "show_help"}
                ]
            ]
        }

    def build_nvidia_menu(self) -> dict[str, Any]:
        """Меню NVIDIA сервера."""
        return {
            "inline_keyboard": [
                [
                    {"text": "📊 Статус сервера", "callback_data": "nvidia_status"},
                    {"text": "🎮 GPU Info", "callback_data": "nvidia_gpu"}
                ],
                [
                    {"text": "🐳 Docker (remote)", "callback_data": "nvidia_docker"},
                    {"text": "📜 Логи", "callback_data": "nvidia_logs_select"}
                ],
                [
                    {"text": "🚀 Деплой на сервер", "callback_data": "nvidia_deploy"},
                    {"text": "🔄 Перезапуск", "callback_data": "nvidia_restart"}
                ],
                [
                    {"text": "💾 Память/Диск", "callback_data": "nvidia_resources"},
                    {"text": "🔗 Connection", "callback_data": "nvidia_connection"}
                ],
                [
                    {"text": "🧪 Test SSH", "callback_data": "nvidia_test_ssh"},
                    {"text": "📡 Ngrok Info", "callback_data": "nvidia_ngrok"}
                ],
                [
                    {"text": "⬅️ Назад", "callback_data": "menu_main"}
                ]
            ]
        }

    def build_docker_menu(self) -> dict[str, Any]:
        """Меню Docker."""
        return {
            "inline_keyboard": [
                [
                    {"text": "📊 Статус контейнерів", "callback_data": "docker_ps"},
                    {"text": "📜 Логи", "callback_data": "docker_logs_select"}
                ],
                [
                    {"text": "▶️ Запустити все", "callback_data": "docker_up"},
                    {"text": "⏹️ Зупинити все", "callback_data": "docker_down"}
                ],
                [
                    {"text": "🔄 Перезапустити...", "callback_data": "docker_restart_select"},
                    {"text": "🔨 Build & Run", "callback_data": "docker_build_select"}
                ],
                [
                    {"text": "📈 Ресурси", "callback_data": "docker_stats"},
                    {"text": "🗑️ Очистити", "callback_data": "docker_prune"}
                ],
                [
                    {"text": "⬅️ Назад", "callback_data": "menu_main"}
                ]
            ]
        }

    def build_docker_services_menu(self, action: str = "restart") -> dict[str, Any]:
        """Меню вибору Docker сервісу."""
        services = [
            ("🔙 Backend", "backend"),
            ("🎨 Frontend", "frontend"),
            ("🗄️ PostgreSQL", "postgres"),
            ("🔴 Redis", "redis"),
            ("🔍 OpenSearch", "opensearch"),
            ("📐 Qdrant", "qdrant"),
            ("📦 MinIO", "minio"),
            ("⚙️ Celery", "celery"),
            ("📊 MLflow", "mlflow"),
            ("🦙 Ollama", "ollama"),
            ("🌐 Nginx", "nginx"),
        ]

        keyboard = []
        row = []
        for emoji_name, service in services:
            row.append({"text": emoji_name, "callback_data": f"docker_{action}_{service}"})
            if len(row) == 3:
                keyboard.append(row)
                row = []
        if row:
            keyboard.append(row)

        # Додаємо "Всі" та "Назад"
        keyboard.append([
            {"text": "🔄 ВСІ СЕРВІСИ", "callback_data": f"docker_{action}_all"},
            {"text": "⬅️ Назад", "callback_data": "menu_docker"}
        ])

        return {"inline_keyboard": keyboard}

    def build_kubernetes_menu(self) -> dict[str, Any]:
        """Меню Kubernetes."""
        return {
            "inline_keyboard": [
                [
                    {"text": "📦 Pods", "callback_data": "k8s_pods"},
                    {"text": "🖥️ Nodes", "callback_data": "k8s_nodes"}
                ],
                [
                    {"text": "🔌 Services", "callback_data": "k8s_services"},
                    {"text": "📜 Deployments", "callback_data": "k8s_deployments"}
                ],
                [
                    {"text": "📊 Cluster Info", "callback_data": "k8s_info"},
                    {"text": "📜 Logs", "callback_data": "k8s_logs_select"}
                ],
                [
                    {"text": "🔄 Rollout Restart", "callback_data": "k8s_restart_select"},
                    {"text": "📈 Metrics", "callback_data": "k8s_metrics"}
                ],
                [
                    {"text": "⬅️ Назад", "callback_data": "menu_main"}
                ]
            ]
        }

    def build_monitoring_menu(self) -> dict[str, Any]:
        """Меню моніторингу."""
        return {
            "inline_keyboard": [
                [
                    {"text": "💾 Диск", "callback_data": "sys_disk"},
                    {"text": "🧠 RAM", "callback_data": "sys_memory"},
                    {"text": "⚡ CPU", "callback_data": "sys_cpu"}
                ],
                [
                    {"text": "⏰ Uptime", "callback_data": "sys_uptime"},
                    {"text": "🖥️ System Info", "callback_data": "sys_info"}
                ],
                [
                    {"text": "🔍 OpenSearch", "callback_data": "mon_opensearch"},
                    {"text": "📐 Qdrant", "callback_data": "mon_qdrant"}
                ],
                [
                    {"text": "⚙️ Celery Workers", "callback_data": "mon_celery"},
                    {"text": "📊 Backend Health", "callback_data": "mon_backend"}
                ],
                [
                    {"text": "🔄 Повний статус", "callback_data": "status_full"}
                ],
                [
                    {"text": "⬅️ Назад", "callback_data": "menu_main"}
                ]
            ]
        }

    def build_deploy_menu(self) -> dict[str, Any]:
        """Меню Deploy/Git."""
        return {
            "inline_keyboard": [
                [
                    {"text": "📊 Git Status", "callback_data": "git_status"},
                    {"text": "📜 Git Log", "callback_data": "git_log"}
                ],
                [
                    {"text": "📥 Git Pull", "callback_data": "git_pull"},
                    {"text": "📊 Git Diff", "callback_data": "git_diff"}
                ],
                [
                    {"text": "💾 Commit Changes", "callback_data": "git_commit_prompt"},
                    {"text": "📤 Push", "callback_data": "git_push"}
                ],
                [
                    {"text": "🚀 ПОВНИЙ ДЕПЛОЙ", "callback_data": "deploy_full"}
                ],
                [
                    {"text": "📋 ArgoCD Apps", "callback_data": "argocd_apps"},
                    {"text": "🔄 ArgoCD Sync", "callback_data": "argocd_sync_select"}
                ],
                [
                    {"text": "⬅️ Назад", "callback_data": "menu_main"}
                ]
            ]
        }

    def build_network_menu(self) -> dict[str, Any]:
        """Меню мережі."""
        return {
            "inline_keyboard": [
                [
                    {"text": "🔗 Ngrok Info", "callback_data": "ngrok_info"},
                    {"text": "📡 SSH Config", "callback_data": "ssh_config"}
                ],
                [
                    {"text": "🔄 Restart Ngrok", "callback_data": "ngrok_restart"},
                    {"text": "📋 Connection Info", "callback_data": "connect_info"}
                ],
                [
                    {"text": "⬅️ Назад", "callback_data": "menu_main"}
                ]
            ]
        }

    def build_ai_menu(self) -> dict[str, Any]:
        """Меню AI."""
        return {
            "inline_keyboard": [
                [
                    {"text": "🔍 Пошук", "callback_data": "ai_search_prompt"},
                    {"text": "🧠 Аналіз", "callback_data": "ai_analyze_prompt"}
                ],
                [
                    {"text": "💬 Чат з AI", "callback_data": "ai_chat"},
                    {"text": "🤖 LLM Council", "callback_data": "ai_council"}
                ],
                [
                    {"text": "📊 LLM Провайдери", "callback_data": "menu_llm"},
                    {"text": "📈 AI Статистика", "callback_data": "ai_stats"}
                ],
                [
                    {"text": "⬅️ Назад", "callback_data": "menu_main"}
                ]
            ]
        }

    def build_llm_menu(self) -> dict[str, Any]:
        """Меню LLM провайдерів."""
        return {
            "inline_keyboard": [
                [
                    {"text": "📋 Список провайдерів", "callback_data": "llm_list"},
                    {"text": "➕ Додати ключ", "callback_data": "llm_add_key"}
                ],
                [
                    {"text": "🧪 Тестувати ключ", "callback_data": "llm_test_key"},
                    {"text": "📊 Статистика", "callback_data": "llm_stats"}
                ],
                [
                    {"text": "⬅️ Назад", "callback_data": "menu_ai"}
                ]
            ]
        }

    def build_settings_menu(self) -> dict[str, Any]:
        """Меню налаштувань."""
        return {
            "inline_keyboard": [
                [
                    {"text": "🔁 Auto Deploy", "callback_data": "settings_auto_deploy"},
                    {"text": "↩️ Auto Rollback", "callback_data": "settings_auto_rollback"}
                ],
                [
                    {"text": "🔄 Auto Restart Ngrok", "callback_data": "settings_auto_restart"},
                    {"text": "👤 Authorization", "callback_data": "settings_auth"}
                ],
                [
                    {"text": "🧠 LLM Settings", "callback_data": "menu_llm"},
                    {"text": "📊 Bot Stats", "callback_data": "settings_bot_stats"}
                ],
                [
                    {"text": "⬅️ Назад", "callback_data": "menu_main"}
                ]
            ]
        }

    def build_confirmation_menu(self, task_id: str, description: str, is_dangerous: bool = False) -> dict[str, Any]:
        """Меню підтвердження виконання задачі."""
        confirm_text = "✅ Підтвердити" if not is_dangerous else "⚠️ Підтвердити (НЕБЕЗПЕЧНО)"

        return {
            "inline_keyboard": [
                [
                    {"text": confirm_text, "callback_data": f"confirm_{task_id}"},
                    {"text": "❌ Скасувати", "callback_data": f"cancel_{task_id}"}
                ]
            ]
        }

    def build_quick_actions_menu(self) -> dict[str, Any]:
        """Меню швидких дій (inline) - популярні команди одним кліком."""
        return {
            "inline_keyboard": [
                [
                    {"text": "🔄 Restart Backend", "callback_data": "quick_restart_backend"},
                    {"text": "📜 Backend Logs", "callback_data": "quick_logs_backend"}
                ],
                [
                    {"text": "📥 Git Pull", "callback_data": "quick_git_pull"},
                    {"text": "🚀 Full Deploy", "callback_data": "quick_deploy"}
                ],
                [
                    {"text": "🎮 GPU Status", "callback_data": "quick_gpu"},
                    {"text": "🖥️ NVIDIA Status", "callback_data": "quick_nvidia"}
                ],
                [
                    {"text": "📊 All Status", "callback_data": "quick_status"},
                    {"text": "⬅️ Меню", "callback_data": "menu_main"}
                ]
            ]
        }

    def build_quick_actions_keyboard(self) -> dict[str, Any]:
        """Клавіатура швидких дій (reply keyboard)."""
        return {
            "keyboard": [
                [
                    {"text": "📊 Статус"},
                    {"text": "🎮 NVIDIA"},
                    {"text": "🐳 Docker"}
                ],
                [
                    {"text": "☸️ K8s"},
                    {"text": "📦 Git"},
                    {"text": "🔗 Ngrok"}
                ],
                [
                    {"text": "🧠 AI"},
                    {"text": "🚀 Деплой"},
                    {"text": "❓ Меню"}
                ]
            ],
            "resize_keyboard": True,
            "one_time_keyboard": False
        }

    def get_menu_for_state(self, state: MenuState) -> dict[str, Any]:
        """Отримує меню для стану."""
        menu_map = {
            MenuState.MAIN: self.build_main_menu,
            MenuState.DOCKER: self.build_docker_menu,
            MenuState.KUBERNETES: self.build_kubernetes_menu,
            MenuState.MONITORING: self.build_monitoring_menu,
            MenuState.DEPLOY: self.build_deploy_menu,
            MenuState.GIT: self.build_deploy_menu,
            MenuState.AI: self.build_ai_menu,
            MenuState.SETTINGS: self.build_settings_menu,
            MenuState.LLM: self.build_llm_menu,
        }

        builder = menu_map.get(state, self.build_main_menu)
        return builder()


class MessageFormatter:
    """Форматування красивих повідомлень."""

    @staticmethod
    def format_welcome() -> str:
        """Привітальне повідомлення v2.0."""
        return """
🚀 *Predator Analytics AI Assistant v2.0*

Вітаю! Я твій персональний AI-помічник для управління серверами.

*✨ Що я вмію:*
• 📊 Моніторинг локального та NVIDIA сервера
• 🐳 Управління Docker контейнерами
• ☸️ Kubernetes моніторинг
• 🎮 GPU статус та nvidia-smi
• 📦 Git/Deploy операції
• 🧠 AI пошук та аналіз
• 💬 Розуміння природної мови

*🎯 Як працювати:*
➤ Використовуй меню (кнопки нижче)
➤ Або просто напиши що потрібно!
➤ Я сам виконаю після підтвердження

*💡 Приклади команд:*
• "Перезапусти backend"
• "GPU статус"
• "Деплой на nvidia"
• "Покажи логи celery"
• "Бекап postgres"

*📡 Ngrok:*
Надішли ngrok дані — автоматично оновлю SSH

👇 *Обери дію з меню:*
"""

    @staticmethod
    def format_nvidia_welcome(host: str | None = None, is_connected: bool = False) -> str:
        """Привітальний екран з інформацією про NVIDIA."""
        nvidia_status = ""
        if host:
            status_emoji = "🟢" if is_connected else "🟡"
            nvidia_status = f"\n\n*{status_emoji} NVIDIA Сервер:* `{host}`"
        else:
            nvidia_status = "\n\n*⚪ NVIDIA Сервер:* Не підключено"

        return f"""
🚀 *Predator Analytics AI Assistant v2.0*
{nvidia_status}

*Швидкі дії:*
"""

    @staticmethod
    def format_task_confirmation(description: str, commands: list[str], is_dangerous: bool = False) -> str:
        """Форматує підтвердження задачі."""
        warning = "\n⚠️ *УВАГА: Потенційно небезпечна операція!*\n" if is_dangerous else ""

        # Форматуємо команди, приховуючи REMOTE: префікс для читабельності
        formatted_commands = []
        for cmd in commands:
            if cmd.startswith("REMOTE:"):
                formatted_commands.append(f"🖥️ {cmd.replace('REMOTE:', '')}")
            elif cmd.startswith("ARGOCD_"):
                formatted_commands.append(f"🔄 {cmd}")
            else:
                formatted_commands.append(f"💻 {cmd}")

        commands_text = "\n".join(formatted_commands)

        return f"""
🔧 *Підтвердіть виконання:*
{warning}
📋 *Задача:* {description}

*Команди для виконання:*
```
{commands_text}
```

Натисніть кнопку для підтвердження або скасування.
"""

    @staticmethod
    def format_task_result(description: str, output: str, error: str | None = None,
                           execution_time_ms: float = 0) -> str:
        """Форматує результат виконання."""
        status = "✅ *Успішно виконано*" if not error else "❌ *Помилка виконання*"
        time_str = f"⏱️ {execution_time_ms:.0f}ms" if execution_time_ms > 0 else ""

        # Очищаємо output від службових префіксів
        clean_output = output.replace("[NVIDIA Server] ", "🖥️ ")

        result = f"""
{status}

📋 *Задача:* {description}
{time_str}

*Результат:*
```
{clean_output[:2500]}
```
"""

        if error:
            result += f"""
*Помилка:*
```
{error[:500]}
```
"""

        return result

    @staticmethod
    def format_menu_header(title: str, description: str = "") -> str:
        """Форматує заголовок меню."""
        header = f"*{title}*"
        if description:
            header += f"\n_{description}_"
        return header

    @staticmethod
    def format_server_status(local_status: dict, nvidia_status: dict | None = None) -> str:
        """Форматує статус серверів."""
        msg = "📊 *Статус серверів*\n\n"

        # Локальний сервер
        msg += "*💻 Локальний (Mac):*\n"
        msg += f"• CPU: {local_status.get('cpu', 'N/A')}\n"
        msg += f"• RAM: {local_status.get('memory', 'N/A')}\n"
        msg += f"• Disk: {local_status.get('disk', 'N/A')}\n"
        msg += f"• Docker: {local_status.get('docker', 'N/A')}\n"

        # NVIDIA сервер
        if nvidia_status:
            status_emoji = "🟢" if nvidia_status.get('connected') else "🔴"
            msg += f"\n*{status_emoji} NVIDIA Сервер:*\n"
            if nvidia_status.get('connected'):
                msg += f"• Host: `{nvidia_status.get('host', 'N/A')}`\n"
                msg += f"• GPU: {nvidia_status.get('gpu', 'N/A')}\n"
                msg += f"• Docker: {nvidia_status.get('docker', 'N/A')}\n"
            else:
                msg += "• Не підключено\n"

        return msg

    @staticmethod
    def format_quick_stats(stats: dict) -> str:
        """Форматує швидку статистику."""
        return f"""
📈 *Статистика бота*

*Сьогодні:*
• 🔧 Виконано задач: {stats.get('tasks_today', 0)}
• ✅ Успішних: {stats.get('success_today', 0)}
• ❌ Помилок: {stats.get('errors_today', 0)}

*Всього:*
• 📊 Всього задач: {stats.get('total_tasks', 0)}
• ⏰ Uptime бота: {stats.get('uptime', 'N/A')}

*Останні дії:*
{stats.get('recent_actions', 'Немає даних')}
"""

    @staticmethod
    def format_connection_info(ssh_host: str, ssh_port: int, http_url: str | None = None) -> str:
        """Форматує інформацію про підключення."""
        return f"""
🔗 *Інформація про підключення*

*SSH:*
```
ssh -p {ssh_port} root@{ssh_host}
```
або
```
ssh dev-ngrok
```

*HTTP:* {http_url or 'N/A'}

*SCP (копіювання файлів):*
```
scp -P {ssh_port} file.txt root@{ssh_host}:~/
```
"""


# Singleton
menu_builder = TelegramMenuBuilder()
message_formatter = MessageFormatter()

