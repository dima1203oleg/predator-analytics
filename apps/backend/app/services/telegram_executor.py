"""
Telegram Task Executor - Виконує задачі після підтвердження користувачем
Замість інструкцій "як зробити" - реально виконує дії
"""
import os
import re
import json
import asyncio
import subprocess
import logging
from typing import Dict, Any, Optional, List, Tuple, Callable
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
import hashlib
import httpx

logger = logging.getLogger(__name__)

# Environment variables for service URLs
OPENSEARCH_URL = os.getenv("OPENSEARCH_URL", "http://localhost:9200")
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
MLFLOW_URL = os.getenv("MLFLOW_URL", "http://localhost:5000")


class TaskStatus(Enum):
    """Статус задачі"""
    PENDING = "pending"           # Очікує підтвердження
    CONFIRMED = "confirmed"       # Підтверджено, готово до виконання
    EXECUTING = "executing"       # Виконується
    COMPLETED = "completed"       # Успішно завершено
    FAILED = "failed"             # Помилка
    CANCELLED = "cancelled"       # Скасовано


class TaskCategory(Enum):
    """Категорія задачі"""
    DOCKER = "docker"
    GIT = "git"
    KUBERNETES = "kubernetes"
    SYSTEM = "system"
    DATABASE = "database"
    API = "api"
    FILE = "file"
    LLM = "llm"
    DEPLOY = "deploy"
    MONITOR = "monitor"
    SEARCH = "search"
    # Нові категорії
    REMOTE = "remote"           # Віддалений NVIDIA сервер
    BACKUP = "backup"           # Бекапи
    MLFLOW = "mlflow"           # MLflow операції
    ARGOCD = "argocd"           # ArgoCD CI/CD
    GPU = "gpu"                 # GPU-специфічні команди
    NETWORK = "network"         # Ngrok/SSH
    CELERY = "celery"           # Celery workers
    OPENSEARCH = "opensearch"   # OpenSearch
    QDRANT = "qdrant"           # Qdrant vector DB
    OTHER = "other"


@dataclass
class PendingTask:
    """Задача, що очікує підтвердження"""
    task_id: str
    user_id: int
    chat_id: int
    category: TaskCategory
    description: str
    commands: List[str]                    # Shell команди для виконання
    is_dangerous: bool = False             # Потенційно небезпечна (rm, drop, etc.)
    requires_confirmation: bool = True      # Потребує підтвердження
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    timeout_seconds: int = 300              # Скільки секунд чекати підтвердження
    callback_data: Optional[str] = None     # Дані для callback button

    def is_expired(self) -> bool:
        """Перевіряє чи задача прострочена"""
        age = (datetime.now(timezone.utc) - self.created_at).total_seconds()
        return age > self.timeout_seconds


@dataclass
class ExecutionResult:
    """Результат виконання задачі"""
    task_id: str
    status: TaskStatus
    output: str
    error: Optional[str] = None
    execution_time_ms: float = 0
    commands_executed: List[str] = field(default_factory=list)


class TaskExecutor:
    """Виконувач задач з підтвердженням"""

    def __init__(self, project_dir: str = None):
        # Use environment variable, fallback to /app (Docker) or current directory
        self.project_dir = project_dir or os.getenv("PROJECT_ROOT", "/app")
        self.pending_tasks: Dict[str, PendingTask] = {}
        self.execution_history: List[ExecutionResult] = []

        # Безпечні шаблони команд
        self.safe_patterns = {
            # Docker
            "docker_ps": ("docker ps --format 'table {{.Names}}\t{{.Status}}'", False),
            "docker_up": ("docker compose up -d", False),
            "docker_down": ("docker compose down", False),
            "docker_restart": ("docker compose restart {service}", False),
            "docker_logs": ("docker compose logs --tail=100 {service}", False),
            "docker_build": ("docker compose up -d --build {service}", False),

            # Git
            "git_status": ("git status --short", False),
            "git_pull": ("git pull origin main", False),
            "git_log": ("git log -n 5 --oneline", False),
            "git_diff": ("git diff --stat", False),
            "git_add": ("git add .", True),
            "git_commit": ("git commit -m '{message}'", True),
            "git_push": ("git push origin main", True),

            # Kubernetes
            "k8s_pods": ("kubectl get pods -A", False),
            "k8s_nodes": ("kubectl get nodes", False),
            "k8s_services": ("kubectl get services -A", False),
            "k8s_logs": ("kubectl logs {pod} -n {namespace} --tail=50", False),
            "k8s_restart": ("kubectl rollout restart deployment/{deployment} -n {namespace}", True),

            # System
            "sys_disk": ("df -h /", False),
            "sys_memory": ("vm_stat", False),
            "sys_cpu": ("top -l 1 -n 0 | grep 'CPU'", False),
            "sys_uptime": ("uptime", False),

            # Files
            "file_list": ("ls -la {path}", False),
            "file_read": ("cat {path}", False),
            "file_tail": ("tail -n 50 {path}", False),
        }

        # Небезпечні патерни (потребують особливого підтвердження)
        self.dangerous_patterns = [
            r"rm\s+-rf",
            r"drop\s+database",
            r"drop\s+table",
            r"truncate",
            r"DELETE\s+FROM",
            r"mkfs",
            r"dd\s+if=",
            r":\(\)\{",  # Fork bomb
            r">\s*/dev/sd",
            r"format\s+C:",
        ]

    def generate_task_id(self, user_id: int, description: str) -> str:
        """Генерує унікальний ID задачі"""
        content = f"{user_id}_{description}_{datetime.now().isoformat()}"
        return hashlib.md5(content.encode()).hexdigest()[:12]

    def is_command_dangerous(self, command: str) -> bool:
        """Перевіряє чи команда небезпечна"""
        for pattern in self.dangerous_patterns:
            if re.search(pattern, command, re.IGNORECASE):
                return True
        return False

    async def analyze_request(self, text: str, user_id: int, chat_id: int) -> Optional[PendingTask]:
        """
        Аналізує запит користувача та визначає що потрібно виконати
        Повертає PendingTask якщо знайдена дія для виконання
        """
        text_lower = text.lower().strip()

        # ======== ВІДДАЛЕНИЙ СЕРВЕР NVIDIA ========
        if any(kw in text_lower for kw in ["nvidia", "сервер", "remote", "віддалений", "gpu сервер", "на сервері"]):
            return await self._analyze_remote_request(text, text_lower, user_id, chat_id)

        # ======== GPU КОМАНДИ ========
        if any(kw in text_lower for kw in ["gpu", "відеокарта", "cuda", "nvidia-smi"]):
            return await self._analyze_gpu_request(text, text_lower, user_id, chat_id)

        # ======== DOCKER КОМАНДИ ========
        if any(kw in text_lower for kw in ["docker", "контейнер", "сервіс"]):
            return await self._analyze_docker_request(text, text_lower, user_id, chat_id)

        # ======== GIT КОМАНДИ ========
        if any(kw in text_lower for kw in ["git", "коміт", "пуш", "пул", "commit", "push", "pull"]):
            return await self._analyze_git_request(text, text_lower, user_id, chat_id)

        # ======== KUBERNETES ========
        if any(kw in text_lower for kw in ["k8s", "kubernetes", "под", "pod", "кластер"]):
            return await self._analyze_k8s_request(text, text_lower, user_id, chat_id)

        # ======== ARGOCD ========
        if any(kw in text_lower for kw in ["argocd", "argo", "sync", "синхронізуй"]):
            return await self._analyze_argocd_request(text, text_lower, user_id, chat_id)

        # ======== БАЗИ ДАНИХ ========
        if any(kw in text_lower for kw in ["database", "база", "postgres", "redis", "opensearch", "qdrant"]):
            return await self._analyze_database_request(text, text_lower, user_id, chat_id)

        # ======== БЕКАПИ ========
        if any(kw in text_lower for kw in ["backup", "бекап", "резервна копія", "зберегти дані"]):
            return await self._analyze_backup_request(text, text_lower, user_id, chat_id)

        # ======== MLFLOW ========
        if any(kw in text_lower for kw in ["mlflow", "experiment", "модель", "ml"]):
            return await self._analyze_mlflow_request(text, text_lower, user_id, chat_id)

        # ======== CELERY ========
        if any(kw in text_lower for kw in ["celery", "worker", "task", "черга"]):
            return await self._analyze_celery_request(text, text_lower, user_id, chat_id)

        # ======== СИСТЕМНІ КОМАНДИ ========
        if any(kw in text_lower for kw in ["диск", "пам'ять", "память", "cpu", "процесор", "статус", "система"]):
            return await self._analyze_system_request(text, text_lower, user_id, chat_id)

        # ======== ДЕПЛОЙ ========
        if any(kw in text_lower for kw in ["деплой", "deploy", "випустити", "release", "оновити"]):
            return await self._analyze_deploy_request(text, text_lower, user_id, chat_id)

        # ======== ФАЙЛОВІ ОПЕРАЦІЇ ========
        if any(kw in text_lower for kw in ["файл", "створи", "відкрий", "покажи", "прочитай"]):
            return await self._analyze_file_request(text, text_lower, user_id, chat_id)

        return None

    async def _analyze_docker_request(self, text: str, text_lower: str, user_id: int, chat_id: int) -> PendingTask:
        """Аналізує Docker запит"""
        task_id = self.generate_task_id(user_id, text)

        # Визначаємо сервіс якщо вказано
        services = ["redis", "postgres", "qdrant", "opensearch", "minio", "backend", "frontend", "celery", "nginx", "mlflow"]
        target_service = None
        for svc in services:
            if svc in text_lower:
                target_service = svc
                break

        commands = []
        description = ""
        requires_confirmation = True

        if any(kw in text_lower for kw in ["запусти", "start", "підніми", "up"]):
            if target_service:
                commands = [f"docker compose up -d {target_service}"]
                description = f"▶️ Запустити сервіс {target_service}"
            else:
                commands = ["docker compose up -d"]
                description = "▶️ Запустити всі Docker сервіси"

        elif any(kw in text_lower for kw in ["зупини", "stop", "вимкни", "down"]):
            if target_service:
                commands = [f"docker compose stop {target_service}"]
                description = f"⏹️ Зупинити сервіс {target_service}"
            else:
                commands = ["docker compose down"]
                description = "⏹️ Зупинити всі Docker сервіси"

        elif any(kw in text_lower for kw in ["перезапусти", "restart", "рестарт"]):
            if target_service:
                commands = [f"docker compose restart {target_service}"]
                description = f"🔄 Перезапустити сервіс {target_service}"
            else:
                commands = ["docker compose restart"]
                description = "🔄 Перезапустити всі Docker сервіси"

        elif any(kw in text_lower for kw in ["білд", "build", "зібрати", "пересобрати"]):
            if target_service:
                commands = [f"docker compose up -d --build {target_service}"]
                description = f"🔨 Пересобрати та запустити {target_service}"
            else:
                commands = ["docker compose up -d --build"]
                description = "🔨 Пересобрати та запустити всі сервіси"

        elif any(kw in text_lower for kw in ["логи", "logs", "лог"]):
            if target_service:
                commands = [f"docker compose logs --tail=100 {target_service}"]
                description = f"📜 Показати логи {target_service}"
                requires_confirmation = False  # Безпечна операція
            else:
                commands = ["docker compose logs --tail=50"]
                description = "📜 Показати останні логи всіх сервісів"
                requires_confirmation = False

        elif any(kw in text_lower for kw in ["статус", "status", "список", "ps"]):
            commands = ["docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"]
            description = "📊 Показати статус Docker контейнерів"
            requires_confirmation = False

        else:
            # Загальна дія - показати статус
            commands = ["docker ps --format 'table {{.Names}}\t{{.Status}}'"]
            description = "📊 Показати статус Docker контейнерів"
            requires_confirmation = False

        task = PendingTask(
            task_id=task_id,
            user_id=user_id,
            chat_id=chat_id,
            category=TaskCategory.DOCKER,
            description=description,
            commands=commands,
            requires_confirmation=requires_confirmation,
            callback_data=f"exec_{task_id}"
        )

        if requires_confirmation:
            self.pending_tasks[task_id] = task

        return task

    async def _analyze_git_request(self, text: str, text_lower: str, user_id: int, chat_id: int) -> PendingTask:
        """Аналізує Git запит"""
        task_id = self.generate_task_id(user_id, text)
        commands = []
        description = ""
        requires_confirmation = True
        is_dangerous = False

        if any(kw in text_lower for kw in ["пул", "pull", "оновити код"]):
            commands = ["git fetch origin", "git pull origin main"]
            description = "📥 Pull останніх змін з репозиторію"

        elif any(kw in text_lower for kw in ["статус", "status", "зміни"]):
            commands = ["git status --short"]
            description = "📊 Показати статус Git репозиторію"
            requires_confirmation = False

        elif any(kw in text_lower for kw in ["коміт", "commit", "закомітити", "зберегти зміни"]):
            # Витягуємо повідомлення коміту
            msg_match = re.search(r'(?:повідомлення|message|з текстом|msg)[:\s]+["\']?(.+?)["\']?$', text, re.IGNORECASE)
            if msg_match:
                commit_msg = msg_match.group(1).strip()
            else:
                commit_msg = f"Auto-commit from Telegram at {datetime.now().strftime('%Y-%m-%d %H:%M')}"

            commands = ["git add .", f'git commit -m "{commit_msg}"']
            description = f"💾 Закомітити зміни: '{commit_msg[:50]}...'"
            is_dangerous = True

        elif any(kw in text_lower for kw in ["пуш", "push", "відправити", "запушити"]):
            commands = ["git push origin main"]
            description = "📤 Відправити зміни на GitHub"
            is_dangerous = True

        elif any(kw in text_lower for kw in ["лог", "log", "історія", "history"]):
            commands = ["git log -n 10 --oneline --graph"]
            description = "📜 Показати історію комітів"
            requires_confirmation = False

        elif any(kw in text_lower for kw in ["diff", "різниця", "що змінено"]):
            commands = ["git diff --stat HEAD~5"]
            description = "📊 Показати різницю (diff)"
            requires_confirmation = False

        else:
            commands = ["git status --short", "git log -n 3 --oneline"]
            description = "📊 Git статус та останні коміти"
            requires_confirmation = False

        task = PendingTask(
            task_id=task_id,
            user_id=user_id,
            chat_id=chat_id,
            category=TaskCategory.GIT,
            description=description,
            commands=commands,
            requires_confirmation=requires_confirmation,
            is_dangerous=is_dangerous,
            callback_data=f"exec_{task_id}"
        )

        if requires_confirmation:
            self.pending_tasks[task_id] = task

        return task

    async def _analyze_k8s_request(self, text: str, text_lower: str, user_id: int, chat_id: int) -> PendingTask:
        """Аналізує Kubernetes запит"""
        task_id = self.generate_task_id(user_id, text)
        commands = []
        description = ""
        requires_confirmation = False

        if any(kw in text_lower for kw in ["поди", "pods", "под"]):
            commands = ["kubectl get pods -A -o wide"]
            description = "☸️ Показати всі поди Kubernetes"

        elif any(kw in text_lower for kw in ["ноди", "nodes", "нода", "сервери"]):
            commands = ["kubectl get nodes -o wide"]
            description = "☸️ Показати ноди кластера"

        elif any(kw in text_lower for kw in ["сервіси", "services", "сервіс"]):
            commands = ["kubectl get services -A"]
            description = "☸️ Показати всі сервіси"

        elif any(kw in text_lower for kw in ["рестарт", "restart", "перезапусти"]):
            # Витягуємо назву deployment
            deploy_match = re.search(r'(?:deployment|деплоймент|додаток)[:\s]+(\w+)', text_lower)
            if deploy_match:
                deployment = deploy_match.group(1)
                commands = [f"kubectl rollout restart deployment/{deployment} -n predator"]
                description = f"🔄 Перезапустити deployment {deployment}"
                requires_confirmation = True
            else:
                commands = ["kubectl rollout restart deployment/predator-backend -n predator"]
                description = "🔄 Перезапустити backend deployment"
                requires_confirmation = True

        elif any(kw in text_lower for kw in ["логи", "logs"]):
            commands = ["kubectl logs -n predator -l app=predator-backend --tail=100"]
            description = "📜 Показати логи backend pod'ів"

        else:
            commands = [
                "kubectl get nodes -o wide",
                "kubectl get pods -A | head -20"
            ]
            description = "☸️ Огляд Kubernetes кластера"

        task = PendingTask(
            task_id=task_id,
            user_id=user_id,
            chat_id=chat_id,
            category=TaskCategory.KUBERNETES,
            description=description,
            commands=commands,
            requires_confirmation=requires_confirmation,
            callback_data=f"exec_{task_id}"
        )

        if requires_confirmation:
            self.pending_tasks[task_id] = task

        return task

    async def _analyze_system_request(self, text: str, text_lower: str, user_id: int, chat_id: int) -> PendingTask:
        """Аналізує системний запит"""
        task_id = self.generate_task_id(user_id, text)
        commands = []
        description = ""

        if any(kw in text_lower for kw in ["диск", "disk", "місце", "storage"]):
            commands = ["df -h /", "du -sh ~/Documents/Predator_21/* 2>/dev/null | head -10"]
            description = "💾 Показати використання диску"

        elif any(kw in text_lower for kw in ["пам'ять", "память", "memory", "ram"]):
            commands = ["vm_stat | head -10", "top -l 1 -n 0 | grep 'PhysMem'"]
            description = "🧠 Показати використання пам'яті"

        elif any(kw in text_lower for kw in ["cpu", "процесор", "навантаження"]):
            commands = ["top -l 1 -n 0 | grep 'CPU'", "sysctl -n hw.ncpu"]
            description = "⚡ Показати навантаження CPU"

        elif any(kw in text_lower for kw in ["uptime", "аптайм", "час роботи"]):
            commands = ["uptime"]
            description = "⏰ Показати час роботи системи"

        else:
            # Загальний статус
            commands = [
                "uptime",
                "df -h / | tail -1",
                "top -l 1 -n 0 | grep 'CPU\\|PhysMem'"
            ]
            description = "📊 Системний статус"

        return PendingTask(
            task_id=task_id,
            user_id=user_id,
            chat_id=chat_id,
            category=TaskCategory.SYSTEM,
            description=description,
            commands=commands,
            requires_confirmation=False,  # Системні запити завжди безпечні
            callback_data=f"exec_{task_id}"
        )

    async def _analyze_deploy_request(self, text: str, text_lower: str, user_id: int, chat_id: int) -> PendingTask:
        """Аналізує запит на деплой"""
        task_id = self.generate_task_id(user_id, text)

        commands = [
            "git fetch origin",
            "git pull origin main",
            "docker compose up -d --build"
        ]
        description = "🚀 Повний деплой: pull + build + restart"

        task = PendingTask(
            task_id=task_id,
            user_id=user_id,
            chat_id=chat_id,
            category=TaskCategory.DEPLOY,
            description=description,
            commands=commands,
            requires_confirmation=True,
            is_dangerous=True,
            callback_data=f"exec_{task_id}"
        )

        self.pending_tasks[task_id] = task
        return task

    async def _analyze_file_request(self, text: str, text_lower: str, user_id: int, chat_id: int) -> PendingTask:
        """Аналізує файловий запит"""
        task_id = self.generate_task_id(user_id, text)

        # Витягуємо шлях до файлу
        path_match = re.search(r'файл[:\s]+([^\s]+)', text_lower)
        file_path = path_match.group(1) if path_match else "."

        if any(kw in text_lower for kw in ["покажи", "прочитай", "read", "cat"]):
            commands = [f"cat {file_path} | head -50"]
            description = f"📄 Прочитати файл {file_path}"
        elif any(kw in text_lower for kw in ["список", "list", "ls"]):
            commands = [f"ls -la {file_path}"]
            description = f"📁 Список файлів у {file_path}"
        else:
            commands = ["ls -la ."]
            description = "📁 Показати файли в проекті"

        return PendingTask(
            task_id=task_id,
            user_id=user_id,
            chat_id=chat_id,
            category=TaskCategory.FILE,
            description=description,
            commands=commands,
            requires_confirmation=False,
            callback_data=f"exec_{task_id}"
        )

    # ==================== НОВІ КАТЕГОРІЇ ====================

    async def _analyze_remote_request(self, text: str, text_lower: str, user_id: int, chat_id: int) -> PendingTask:
        """Аналізує запит для віддаленого NVIDIA сервера"""
        task_id = self.generate_task_id(user_id, text)
        commands = []
        description = ""
        requires_confirmation = True
        is_remote = True  # Позначаємо що це віддалена команда

        if any(kw in text_lower for kw in ["статус", "status", "як справи"]):
            commands = [
                "REMOTE:hostname",
                "REMOTE:uptime",
                "REMOTE:docker ps --format 'table {{.Names}}\t{{.Status}}' | head -10",
                "REMOTE:nvidia-smi --query-gpu=name,memory.used,memory.total --format=csv,noheader 2>/dev/null || echo 'GPU N/A'"
            ]
            description = "🖥️ Статус NVIDIA сервера"
            requires_confirmation = False

        elif any(kw in text_lower for kw in ["docker", "контейнер"]):
            if "запусти" in text_lower or "up" in text_lower:
                commands = ["REMOTE:cd ~/predator-analytics && docker compose up -d"]
                description = "🐳 Запустити Docker на NVIDIA сервері"
            elif "зупини" in text_lower or "down" in text_lower:
                commands = ["REMOTE:cd ~/predator-analytics && docker compose down"]
                description = "⏹️ Зупинити Docker на NVIDIA сервері"
            elif "перезапусти" in text_lower:
                commands = ["REMOTE:cd ~/predator-analytics && docker compose restart"]
                description = "🔄 Перезапустити Docker на NVIDIA сервері"
            else:
                commands = ["REMOTE:docker ps --format 'table {{.Names}}\t{{.Status}}'"]
                description = "🐳 Docker статус на NVIDIA сервері"
                requires_confirmation = False

        elif any(kw in text_lower for kw in ["деплой", "deploy", "оновити"]):
            commands = [
                "REMOTE:cd ~/predator-analytics && git pull origin main",
                "REMOTE:cd ~/predator-analytics && docker compose pull",
                "REMOTE:cd ~/predator-analytics && docker compose up -d --build"
            ]
            description = "🚀 Деплой на NVIDIA сервері"

        elif any(kw in text_lower for kw in ["лог", "logs"]):
            service = "backend"
            for svc in ["backend", "frontend", "celery", "redis", "postgres", "ollama"]:
                if svc in text_lower:
                    service = svc
                    break
            commands = [f"REMOTE:cd ~/predator-analytics && docker compose logs --tail=100 {service}"]
            description = f"📜 Логи {service} на NVIDIA сервері"
            requires_confirmation = False

        else:
            # Загальний статус
            commands = [
                "REMOTE:hostname && uptime",
                "REMOTE:df -h / | tail -1",
                "REMOTE:free -h | grep Mem"
            ]
            description = "🖥️ Огляд NVIDIA сервера"
            requires_confirmation = False

        task = PendingTask(
            task_id=task_id,
            user_id=user_id,
            chat_id=chat_id,
            category=TaskCategory.REMOTE,
            description=description,
            commands=commands,
            requires_confirmation=requires_confirmation,
            callback_data=f"exec_{task_id}"
        )

        if requires_confirmation:
            self.pending_tasks[task_id] = task

        return task

    async def _analyze_gpu_request(self, text: str, text_lower: str, user_id: int, chat_id: int) -> PendingTask:
        """Аналізує GPU запит (виконується на NVIDIA сервері)"""
        task_id = self.generate_task_id(user_id, text)

        if any(kw in text_lower for kw in ["статус", "status", "моніторинг"]):
            commands = [
                "REMOTE:nvidia-smi",
                "REMOTE:nvidia-smi --query-gpu=name,memory.used,memory.total,temperature.gpu,utilization.gpu --format=csv"
            ]
            description = "🎮 GPU статус (nvidia-smi)"
        elif any(kw in text_lower for kw in ["процес", "process", "що запущено"]):
            commands = ["REMOTE:nvidia-smi --query-compute-apps=pid,name,used_memory --format=csv"]
            description = "🎮 GPU процеси"
        elif any(kw in text_lower for kw in ["пам'ять", "memory", "vram"]):
            commands = ["REMOTE:nvidia-smi --query-gpu=memory.used,memory.free,memory.total --format=csv"]
            description = "🎮 GPU пам'ять"
        else:
            commands = ["REMOTE:nvidia-smi --query-gpu=name,memory.used,memory.total,utilization.gpu,temperature.gpu --format=csv,noheader"]
            description = "🎮 GPU інформація"

        return PendingTask(
            task_id=task_id,
            user_id=user_id,
            chat_id=chat_id,
            category=TaskCategory.GPU,
            description=description,
            commands=commands,
            requires_confirmation=False,
            callback_data=f"exec_{task_id}"
        )

    async def _analyze_database_request(self, text: str, text_lower: str, user_id: int, chat_id: int) -> PendingTask:
        """Аналізує запит бази даних"""
        task_id = self.generate_task_id(user_id, text)
        commands = []
        description = ""
        requires_confirmation = False

        if "postgres" in text_lower:
            if any(kw in text_lower for kw in ["статус", "status"]):
                commands = ["docker exec predator_postgres psql -U predator -c '\\l' 2>/dev/null || echo 'PostgreSQL not running'"]
                description = "🗄️ PostgreSQL статус"
            elif any(kw in text_lower for kw in ["запит", "query", "виконай"]):
                # Витягуємо SQL запит
                sql_match = re.search(r'(?:запит|query)[:\s]+(.+)', text, re.IGNORECASE)
                if sql_match:
                    sql = sql_match.group(1).strip()
                    commands = [f"docker exec predator_postgres psql -U predator -c \"{sql}\""]
                    description = f"🗄️ SQL запит: {sql[:50]}..."
                    requires_confirmation = True

        elif "redis" in text_lower:
            if any(kw in text_lower for kw in ["статус", "status", "info"]):
                commands = ["docker exec predator_redis redis-cli INFO | head -30"]
                description = "🔴 Redis статус"
            elif "keys" in text_lower or "ключі" in text_lower:
                commands = ["docker exec predator_redis redis-cli KEYS '*' | head -20"]
                description = "🔴 Redis ключі"

        elif "opensearch" in text_lower:
            commands = [
                f"curl -s {OPENSEARCH_URL}/_cluster/health | python3 -m json.tool 2>/dev/null || echo 'OpenSearch not available'",
                f"curl -s {OPENSEARCH_URL}/_cat/indices?v | head -20"
            ]
            description = "🔍 OpenSearch статус"

        elif "qdrant" in text_lower:
            commands = [
                f"curl -s {QDRANT_URL}/collections | python3 -m json.tool 2>/dev/null || echo 'Qdrant not available'"
            ]
            description = "📐 Qdrant статус"

        else:
            # Всі бази
            commands = [
                "docker exec predator_postgres psql -U predator -c 'SELECT 1' 2>/dev/null && echo '✅ PostgreSQL OK' || echo '❌ PostgreSQL FAIL'",
                "docker exec predator_redis redis-cli PING 2>/dev/null && echo '✅ Redis OK' || echo '❌ Redis FAIL'",
                f"curl -s {OPENSEARCH_URL}/_cluster/health | grep -q 'green\\|yellow' && echo '✅ OpenSearch OK' || echo '⚠️ OpenSearch'",
                f"curl -s {QDRANT_URL}/collections | grep -q 'collections' && echo '✅ Qdrant OK' || echo '⚠️ Qdrant'"
            ]
            description = "🗄️ Статус всіх баз даних"

        task = PendingTask(
            task_id=task_id,
            user_id=user_id,
            chat_id=chat_id,
            category=TaskCategory.DATABASE,
            description=description,
            commands=commands,
            requires_confirmation=requires_confirmation,
            callback_data=f"exec_{task_id}"
        )

        if requires_confirmation:
            self.pending_tasks[task_id] = task

        return task

    async def _analyze_backup_request(self, text: str, text_lower: str, user_id: int, chat_id: int) -> PendingTask:
        """Аналізує запит бекапу"""
        task_id = self.generate_task_id(user_id, text)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        if "postgres" in text_lower or "база" in text_lower:
            commands = [
                f"docker exec predator_postgres pg_dump -U predator predator > ~/backups/postgres_backup_{timestamp}.sql",
                f"echo 'Backup saved to ~/backups/postgres_backup_{timestamp}.sql'"
            ]
            description = f"💾 Бекап PostgreSQL ({timestamp})"
        elif "redis" in text_lower:
            commands = [
                "docker exec predator_redis redis-cli BGSAVE",
                f"docker cp predator_redis:/data/dump.rdb ~/backups/redis_backup_{timestamp}.rdb"
            ]
            description = f"💾 Бекап Redis ({timestamp})"
        else:
            commands = [
                "mkdir -p ~/backups",
                f"docker exec predator_postgres pg_dump -U predator predator > ~/backups/postgres_{timestamp}.sql",
                f"docker cp predator_redis:/data/dump.rdb ~/backups/redis_{timestamp}.rdb 2>/dev/null || true",
                f"echo 'Backups saved to ~/backups/'"
            ]
            description = f"💾 Повний бекап баз ({timestamp})"

        task = PendingTask(
            task_id=task_id,
            user_id=user_id,
            chat_id=chat_id,
            category=TaskCategory.BACKUP,
            description=description,
            commands=commands,
            requires_confirmation=True,
            is_dangerous=False,
            callback_data=f"exec_{task_id}"
        )

        self.pending_tasks[task_id] = task
        return task

    async def _analyze_argocd_request(self, text: str, text_lower: str, user_id: int, chat_id: int) -> PendingTask:
        """Аналізує ArgoCD запит"""
        task_id = self.generate_task_id(user_id, text)

        # Визначаємо target (nvidia, oracle, macbook)
        target = "nvidia"
        for t in ["nvidia", "oracle", "macbook"]:
            if t in text_lower:
                target = t
                break

        if any(kw in text_lower for kw in ["sync", "синхронізуй", "деплой"]):
            commands = [f"ARGOCD_SYNC:{target}"]
            description = f"🔄 ArgoCD Sync для {target}"
            requires_confirmation = True
        elif any(kw in text_lower for kw in ["статус", "status", "apps"]):
            commands = [f"ARGOCD_STATUS:{target}"]
            description = f"📊 ArgoCD статус для {target}"
            requires_confirmation = False
        elif any(kw in text_lower for kw in ["rollback", "відкат"]):
            commands = [f"ARGOCD_ROLLBACK:{target}"]
            description = f"↩️ ArgoCD Rollback для {target}"
            requires_confirmation = True
        else:
            commands = [f"ARGOCD_STATUS:{target}"]
            description = f"📊 ArgoCD статус"
            requires_confirmation = False

        task = PendingTask(
            task_id=task_id,
            user_id=user_id,
            chat_id=chat_id,
            category=TaskCategory.ARGOCD,
            description=description,
            commands=commands,
            requires_confirmation=requires_confirmation,
            callback_data=f"exec_{task_id}"
        )

        if requires_confirmation:
            self.pending_tasks[task_id] = task

        return task

    async def _analyze_mlflow_request(self, text: str, text_lower: str, user_id: int, chat_id: int) -> PendingTask:
        """Аналізує MLflow запит"""
        task_id = self.generate_task_id(user_id, text)

        if any(kw in text_lower for kw in ["experiment", "експеримент"]):
            commands = [f"curl -s {MLFLOW_URL}/api/2.0/mlflow/experiments/search | python3 -m json.tool 2>/dev/null | head -50"]
            description = "📊 MLflow експерименти"
        elif any(kw in text_lower for kw in ["model", "модел"]):
            commands = [f"curl -s {MLFLOW_URL}/api/2.0/mlflow/registered-models/search | python3 -m json.tool 2>/dev/null | head -50"]
            description = "🤖 MLflow моделі"
        elif any(kw in text_lower for kw in ["run", "запуск"]):
            commands = [f"curl -s {MLFLOW_URL}/api/2.0/mlflow/runs/search -d '{{}}' | python3 -m json.tool 2>/dev/null | head -50"]
            description = "🏃 MLflow запуски"
        else:
            commands = [
                f"curl -s {MLFLOW_URL}/health 2>/dev/null && echo '✅ MLflow OK' || echo '❌ MLflow not available'",
                f"curl -s {MLFLOW_URL}/api/2.0/mlflow/experiments/search | python3 -c 'import sys,json; d=json.load(sys.stdin); print(\"Experiments:\", len(d.get(\"experiments\", [])))' 2>/dev/null || true"
            ]
            description = "📊 MLflow статус"

        return PendingTask(
            task_id=task_id,
            user_id=user_id,
            chat_id=chat_id,
            category=TaskCategory.MLFLOW,
            description=description,
            commands=commands,
            requires_confirmation=False,
            callback_data=f"exec_{task_id}"
        )

    async def _analyze_celery_request(self, text: str, text_lower: str, user_id: int, chat_id: int) -> PendingTask:
        """Аналізує Celery запит"""
        task_id = self.generate_task_id(user_id, text)

        if any(kw in text_lower for kw in ["worker", "воркер"]):
            commands = [
                "docker exec predator_celery celery -A app.core.celery_app inspect active 2>/dev/null || echo 'Celery not running'"
            ]
            description = "⚙️ Celery workers"
        elif any(kw in text_lower for kw in ["task", "задачі", "черга"]):
            commands = [
                "docker exec predator_celery celery -A app.core.celery_app inspect scheduled 2>/dev/null || echo 'No scheduled tasks'"
            ]
            description = "📋 Celery задачі"
        elif any(kw in text_lower for kw in ["перезапусти", "restart"]):
            commands = ["docker compose restart celery"]
            description = "🔄 Перезапустити Celery"
            return PendingTask(
                task_id=task_id,
                user_id=user_id,
                chat_id=chat_id,
                category=TaskCategory.CELERY,
                description=description,
                commands=commands,
                requires_confirmation=True,
                callback_data=f"exec_{task_id}"
            )
        else:
            commands = [
                "docker exec predator_celery celery -A app.core.celery_app inspect ping 2>/dev/null && echo '✅ Celery OK' || echo '❌ Celery not running'"
            ]
            description = "⚙️ Celery статус"

        return PendingTask(
            task_id=task_id,
            user_id=user_id,
            chat_id=chat_id,
            category=TaskCategory.CELERY,
            description=description,
            commands=commands,
            requires_confirmation=False,
            callback_data=f"exec_{task_id}"
        )

    async def execute_task(self, task: PendingTask) -> ExecutionResult:
        """
        Виконує задачу - підтримує локальні, віддалені та ArgoCD команди

        Префікси команд:
        - REMOTE: - виконується на віддаленому NVIDIA сервері через SSH
        - ARGOCD_SYNC: - синхронізація ArgoCD
        - ARGOCD_STATUS: - статус ArgoCD
        - без префікса - локальна команда
        """
        import time
        start_time = time.time()

        outputs = []
        errors = []

        # Імпортуємо remote_server якщо потрібно
        remote_server_manager = None
        if any(cmd.startswith("REMOTE:") for cmd in task.commands):
            try:
                from .remote_server import remote_server
                remote_server_manager = remote_server
            except ImportError:
                errors.append("Remote server module not available")

        try:
            for cmd in task.commands:
                logger.info(f"Executing: {cmd}")

                # ======== REMOTE КОМАНДИ ========
                if cmd.startswith("REMOTE:"):
                    actual_cmd = cmd.replace("REMOTE:", "", 1)

                    if remote_server_manager:
                        result = await remote_server_manager.execute_remote(actual_cmd, timeout=120)
                        if result.success:
                            outputs.append(f"[NVIDIA Server] {result.output}")
                        else:
                            errors.append(f"[NVIDIA Server] {result.error}")
                    else:
                        errors.append("No connection to NVIDIA server. Send ngrok data first.")
                    continue

                # ======== ARGOCD КОМАНДИ ========
                if cmd.startswith("ARGOCD_"):
                    # Формат: ARGOCD_ACTION:target
                    parts = cmd.split(":")
                    action = parts[0]  # ARGOCD_SYNC, ARGOCD_STATUS, etc.
                    target = parts[1] if len(parts) > 1 else "nvidia"

                    # Отримуємо credentials з env
                    argocd_server = os.getenv(f"ARGOCD_{target.upper()}_SERVER", os.getenv("ARGOCD_SERVER", ""))
                    argocd_token = os.getenv(f"ARGOCD_{target.upper()}_TOKEN", os.getenv("ARGOCD_TOKEN", ""))

                    if not argocd_server or not argocd_token:
                        outputs.append(f"⚠️ ArgoCD credentials for {target} not configured")
                        continue

                    try:
                        async with httpx.AsyncClient(timeout=30, verify=False) as client:
                            headers = {"Authorization": f"Bearer {argocd_token}"}

                            if action == "ARGOCD_STATUS":
                                resp = await client.get(f"{argocd_server}/api/v1/applications", headers=headers)
                                if resp.status_code == 200:
                                    apps = resp.json().get("items", [])
                                    status_lines = [f"📊 ArgoCD Apps ({len(apps)} total):"]
                                    for app in apps[:10]:
                                        name = app.get("metadata", {}).get("name", "?")
                                        status = app.get("status", {}).get("sync", {}).get("status", "?")
                                        health = app.get("status", {}).get("health", {}).get("status", "?")
                                        emoji = "✅" if health == "Healthy" else "⚠️" if health == "Progressing" else "❌"
                                        status_lines.append(f"{emoji} {name}: {status}/{health}")
                                    outputs.append("\n".join(status_lines))
                                else:
                                    errors.append(f"ArgoCD API error: {resp.status_code}")

                            elif action == "ARGOCD_SYNC":
                                app_name = f"predator-{target}"
                                resp = await client.post(
                                    f"{argocd_server}/api/v1/applications/{app_name}/sync",
                                    headers=headers,
                                    json={}
                                )
                                if resp.status_code in [200, 201]:
                                    outputs.append(f"✅ ArgoCD sync initiated for {app_name}")
                                else:
                                    errors.append(f"ArgoCD sync failed: {resp.status_code}")

                            elif action == "ARGOCD_ROLLBACK":
                                app_name = f"predator-{target}"
                                # Get current revision first
                                resp = await client.get(f"{argocd_server}/api/v1/applications/{app_name}", headers=headers)
                                if resp.status_code == 200:
                                    history = resp.json().get("status", {}).get("history", [])
                                    if len(history) >= 2:
                                        prev_revision = history[-2].get("revision", "")
                                        resp = await client.post(
                                            f"{argocd_server}/api/v1/applications/{app_name}/rollback",
                                            headers=headers,
                                            json={"id": prev_revision}
                                        )
                                        if resp.status_code in [200, 201]:
                                            outputs.append(f"↩️ Rollback to {prev_revision[:8]} initiated")
                                        else:
                                            errors.append(f"Rollback failed: {resp.status_code}")
                                    else:
                                        outputs.append("⚠️ Not enough history for rollback")
                                else:
                                    errors.append(f"Failed to get app history: {resp.status_code}")

                    except Exception as e:
                        errors.append(f"ArgoCD error: {str(e)}")
                    continue

                # ======== ЛОКАЛЬНІ КОМАНДИ ========
                result = subprocess.run(
                    cmd,
                    shell=True,
                    capture_output=True,
                    text=True,
                    timeout=120,
                    cwd=self.project_dir
                )

                if result.stdout:
                    outputs.append(result.stdout)
                if result.stderr and result.returncode != 0:
                    errors.append(result.stderr)
                elif result.stderr:
                    # Деякі команди виводять в stderr навіть при успіху
                    outputs.append(result.stderr)

            execution_time = (time.time() - start_time) * 1000

            # Видаляємо задачу з pending
            if task.task_id in self.pending_tasks:
                del self.pending_tasks[task.task_id]

            full_output = "\n".join(outputs) if outputs else "Виконано без виводу"
            full_error = "\n".join(errors) if errors else None

            exec_result = ExecutionResult(
                task_id=task.task_id,
                status=TaskStatus.COMPLETED if not errors else TaskStatus.FAILED,
                output=full_output[:3000],
                error=full_error[:1000] if full_error else None,
                execution_time_ms=execution_time,
                commands_executed=task.commands
            )

            self.execution_history.append(exec_result)
            return exec_result

        except subprocess.TimeoutExpired:
            return ExecutionResult(
                task_id=task.task_id,
                status=TaskStatus.FAILED,
                output="",
                error="⏱️ Timeout: команда виконувалась занадто довго (>120с)",
                commands_executed=task.commands
            )
        except Exception as e:
            logger.error(f"Task execution error: {e}")
            return ExecutionResult(
                task_id=task.task_id,
                status=TaskStatus.FAILED,
                output="",
                error=str(e),
                commands_executed=task.commands
            )

    def confirm_task(self, task_id: str) -> Optional[PendingTask]:
        """Підтверджує задачу для виконання"""
        if task_id in self.pending_tasks:
            task = self.pending_tasks[task_id]
            task.requires_confirmation = False
            return task
        return None

    def cancel_task(self, task_id: str) -> bool:
        """Скасовує задачу"""
        if task_id in self.pending_tasks:
            del self.pending_tasks[task_id]
            return True
        return False

    def get_pending_task(self, task_id: str) -> Optional[PendingTask]:
        """Отримує pending задачу"""
        return self.pending_tasks.get(task_id)

    def cleanup_expired_tasks(self):
        """Очищує прострочені задачі"""
        expired = [tid for tid, task in self.pending_tasks.items() if task.is_expired()]
        for tid in expired:
            del self.pending_tasks[tid]
        return len(expired)


# Singleton
task_executor = TaskExecutor()
