# 🎯 Telegram Bot V4.0 - Advanced Examples & Extensions

## 📚 Приклади використання

### 1. Моніторинг системи

#### Базовий моніторинг:
```
Користувач: Покажи статус системи
Бот:
🖥️ SYSTEM STATUS
CPU: 45%
Memory: 60% (8GB / 16GB)
Disk: 35% (350GB / 1TB)
```

#### Детальний аналіз:
```
Користувач: Які процеси споживають найбільше ресурсів?
Бот:
🔄 TOP PROCESSES (by CPU)
**python** (PID: 1234)
  CPU: 15.2% | RAM: 8.5%

**docker** (PID: 5678)
  CPU: 12.1% | RAM: 5.2%
```

### 2. AI Асистент

#### Аналіз коду:
```
Користувач: Проаналізуй цей код:
def process_data(data):
    result = []
    for item in data:
        if item > 0:
            result.append(item * 2)
    return result

Бот:
🔍 Аналіз коду:

✅ Позитивні моменти:
- Простий та зрозумілий код
- Правильна логіка фільтрації

⚠️ Рекомендації:
1. Використайте list comprehension для кращої продуктивності:
   result = [item * 2 for item in data if item > 0]

2. Додайте type hints:
   def process_data(data: List[int]) -> List[int]:

3. Додайте docstring для документації
```

#### Планування задач:
```
Користувач: Допоможи спланувати міграцію бази даних

Бот:
🎯 ПЛАН МІГРАЦІЇ БАЗИ ДАНИХ

**Етап 1: Підготовка (1-2 дні)**
- [ ] Аналіз поточної структури БД
- [ ] Створення backup
- [ ] Тестування backup/restore
- [ ] Підготовка rollback плану

**Етап 2: Розробка (3-5 днів)**
- [ ] Написання міграційних скриптів
- [ ] Тестування на dev середовищі
- [ ] Code review
- [ ] Документація

**Етап 3: Тестування (2-3 дні)**
- [ ] Тестування на staging
- [ ] Performance тести
- [ ] Валідація даних
- [ ] UAT

**Етап 4: Деплой (1 день)**
- [ ] Створення production backup
- [ ] Виконання міграції
- [ ] Валідація
- [ ] Моніторинг

**Ризики:**
- Втрата даних → Backup
- Downtime → Blue-green deployment
- Performance → Індексація
```

### 3. Автоматизація

#### Створення workflow:
```
Користувач: Створи workflow для автоматичного деплою

Бот:
🔄 DEPLOYMENT WORKFLOW

**Тригер:** Git push to main branch

**Кроки:**
1. 🧪 Run tests
   - Unit tests
   - Integration tests
   - E2E tests

2. 🏗️ Build
   - Docker build
   - Tag image
   - Push to registry

3. 🚀 Deploy
   - Update Kubernetes
   - Rolling update
   - Health check

4. ✅ Verify
   - Smoke tests
   - Monitoring alerts
   - Rollback if needed

**Налаштування:**
- Auto-rollback: Enabled
- Notifications: Telegram
- Max deploy time: 10 min
```

### 4. Управління Docker

#### Список контейнерів:
```
Користувач: Покажи Docker контейнери

Бот:
🐳 DOCKER CONTAINERS

**predator_backend** ✅ Running
  Ports: 8000:8000
  Uptime: 2 days

**postgres** ✅ Running
  Ports: 5432:5432
  Uptime: 5 days

**redis** ✅ Running
  Ports: 6379:6379
  Uptime: 5 days
```

#### Перезапуск контейнера:
```
Користувач: Перезапусти predator_backend

Бот:
🔄 Restarting predator_backend...
✅ Container restarted successfully
⏱️ Time: 3.2s
```

### 5. Аналітика та звіти

#### Real-time метрики:
```
Користувач: Покажи метрики за останню годину

Бот:
📊 METRICS (Last Hour)

**Requests:**
- Total: 1,234
- Success: 1,180 (95.6%)
- Errors: 54 (4.4%)

**Response Time:**
- Avg: 145ms
- P95: 320ms
- P99: 580ms

**Top Endpoints:**
1. /api/v1/data - 456 requests
2. /api/v1/analytics - 234 requests
3. /api/v1/health - 189 requests
```

## 🔧 Розширення функціоналу

### Додавання власних команд

#### 1. Створіть новий контролер:

```python
class CustomController:
    """Ваш власний контролер"""

    @staticmethod
    async def custom_function(param: str) -> str:
        """Ваша функція"""
        # Ваша логіка
        result = f"Processed: {param}"
        return result

    @staticmethod
    async def get_custom_data() -> Dict[str, Any]:
        """Отримати дані"""
        return {
            "status": "ok",
            "data": [1, 2, 3],
            "timestamp": datetime.now().isoformat()
        }
```

#### 2. Додайте меню:

```python
@staticmethod
def get_custom_menu() -> InlineKeyboardMarkup:
    """Власне меню"""
    buttons = [
        [
            InlineKeyboardButton(text="🎯 Action 1", callback_data="custom_action1"),
            InlineKeyboardButton(text="🎯 Action 2", callback_data="custom_action2")
        ],
        [
            InlineKeyboardButton(text="📊 Get Data", callback_data="custom_data"),
            InlineKeyboardButton(text="⚙️ Settings", callback_data="custom_settings")
        ],
        [InlineKeyboardButton(text="🏠 Main Menu", callback_data="main_menu")]
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)
```

#### 3. Додайте handler:

```python
@dp.message(F.text == "🎯 Custom Section")
async def show_custom_section(message: types.Message):
    """Власний розділ"""
    text = """
🎯 **CUSTOM SECTION**

Опис вашого розділу...

Оберіть дію:
    """
    await message.answer(
        text,
        reply_markup=MenuSystem.get_custom_menu(),
        parse_mode="Markdown"
    )

@dp.callback_query(F.data.startswith("custom_"))
async def cb_custom(callback: types.CallbackQuery):
    """Обробка callback"""
    action = callback.data.split("_")[1]

    if action == "action1":
        result = await CustomController.custom_function("test")
        await callback.message.edit_text(
            f"✅ {result}",
            reply_markup=MenuSystem.get_custom_menu()
        )
    elif action == "data":
        data = await CustomController.get_custom_data()
        await callback.message.edit_text(
            f"📊 **Data:**\n```json\n{json.dumps(data, indent=2)}\n```",
            reply_markup=MenuSystem.get_custom_menu(),
            parse_mode="Markdown"
        )

    await callback.answer()
```

### Інтеграція з базою даних

```python
import asyncpg

class DatabaseController:
    """Контролер бази даних"""

    def __init__(self, db_url: str):
        self.db_url = db_url
        self.pool = None

    async def connect(self):
        """Підключення до БД"""
        self.pool = await asyncpg.create_pool(self.db_url)

    async def execute_query(self, query: str) -> List[Dict]:
        """Виконати запит"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query)
            return [dict(row) for row in rows]

    async def get_table_info(self, table_name: str) -> str:
        """Інформація про таблицю"""
        query = f"""
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = '{table_name}'
        """
        columns = await self.execute_query(query)

        result = f"📊 **Table: {table_name}**\n\n"
        for col in columns:
            result += f"- **{col['column_name']}**: {col['data_type']}"
            if col['is_nullable'] == 'NO':
                result += " (NOT NULL)"
            result += "\n"

        return result

# Використання:
db = DatabaseController("postgresql://user:pass@localhost/db")
await db.connect()

@dp.callback_query(F.data == "db_info")
async def show_db_info(callback: types.CallbackQuery):
    info = await db.get_table_info("users")
    await callback.message.edit_text(info, parse_mode="Markdown")
```

### Інтеграція з Kubernetes

```python
from kubernetes import client, config

class KubernetesController:
    """Контролер Kubernetes"""

    def __init__(self):
        config.load_kube_config()
        self.v1 = client.CoreV1Api()
        self.apps_v1 = client.AppsV1Api()

    async def get_pods(self, namespace: str = "default") -> str:
        """Список pods"""
        pods = self.v1.list_namespaced_pod(namespace)

        result = f"☸️ **Pods in {namespace}**\n\n"
        for pod in pods.items:
            status = pod.status.phase
            emoji = "✅" if status == "Running" else "⚠️"
            result += f"{emoji} **{pod.metadata.name}**\n"
            result += f"  Status: {status}\n"
            result += f"  Node: {pod.spec.node_name}\n\n"

        return result

    async def scale_deployment(self, name: str, replicas: int, namespace: str = "default") -> str:
        """Масштабування deployment"""
        body = {"spec": {"replicas": replicas}}
        self.apps_v1.patch_namespaced_deployment_scale(
            name, namespace, body
        )
        return f"✅ Scaled {name} to {replicas} replicas"

# Використання:
k8s = KubernetesController()

@dp.callback_query(F.data == "k8s_pods")
async def show_k8s_pods(callback: types.CallbackQuery):
    pods = await k8s.get_pods()
    await callback.message.edit_text(pods, parse_mode="Markdown")
```

### Інтеграція з Prometheus/Grafana

```python
import aiohttp

class MonitoringController:
    """Контролер моніторингу"""

    def __init__(self, prometheus_url: str, grafana_url: str):
        self.prometheus_url = prometheus_url
        self.grafana_url = grafana_url

    async def query_prometheus(self, query: str) -> Dict:
        """Запит до Prometheus"""
        url = f"{self.prometheus_url}/api/v1/query"
        params = {"query": query}

        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params) as response:
                return await response.json()

    async def get_cpu_usage(self) -> str:
        """CPU usage"""
        query = 'avg(rate(cpu_usage_seconds_total[5m])) * 100'
        result = await self.query_prometheus(query)

        if result['status'] == 'success':
            value = float(result['data']['result'][0]['value'][1])
            return f"📊 CPU Usage: {value:.2f}%"
        return "❌ Failed to get CPU usage"

    async def get_grafana_dashboard_url(self, dashboard_id: str) -> str:
        """URL Grafana dashboard"""
        return f"{self.grafana_url}/d/{dashboard_id}"

# Використання:
monitoring = MonitoringController(
    "http://prometheus:9090",
    "http://grafana:3000"
)

@dp.callback_query(F.data == "monitoring_cpu")
async def show_cpu_usage(callback: types.CallbackQuery):
    cpu = await monitoring.get_cpu_usage()
    await callback.message.edit_text(cpu)
```

### Сповіщення та алерти

```python
class AlertController:
    """Контролер алертів"""

    def __init__(self, bot: Bot, admin_id: int):
        self.bot = bot
        self.admin_id = admin_id
        self.thresholds = {
            "cpu": 80,
            "memory": 85,
            "disk": 90
        }

    async def check_system_health(self):
        """Перевірка здоров'я системи"""
        cpu = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory().percent
        disk = psutil.disk_usage('/').percent

        alerts = []

        if cpu > self.thresholds["cpu"]:
            alerts.append(f"🚨 CPU: {cpu}% (threshold: {self.thresholds['cpu']}%)")

        if memory > self.thresholds["memory"]:
            alerts.append(f"🚨 Memory: {memory}% (threshold: {self.thresholds['memory']}%)")

        if disk > self.thresholds["disk"]:
            alerts.append(f"🚨 Disk: {disk}% (threshold: {self.thresholds['disk']}%)")

        if alerts:
            message = "⚠️ **SYSTEM ALERTS**\n\n" + "\n".join(alerts)
            await self.bot.send_message(self.admin_id, message, parse_mode="Markdown")

    async def start_monitoring(self):
        """Запуск моніторингу"""
        while True:
            await self.check_system_health()
            await asyncio.sleep(60)  # Перевірка кожну хвилину

# Використання в main():
alert_controller = AlertController(bot, TELEGRAM_ADMIN_ID)
asyncio.create_task(alert_controller.start_monitoring())
```

## 🎨 Кастомізація інтерфейсу

### Власні емодзі та стилі:

```python
class EmojiTheme:
    """Тема емодзі"""

    # System
    CPU = "🔥"
    MEMORY = "💾"
    DISK = "💿"
    NETWORK = "🌐"

    # Status
    SUCCESS = "✅"
    ERROR = "❌"
    WARNING = "⚠️"
    INFO = "ℹ️"

    # Actions
    START = "▶️"
    STOP = "⏹️"
    RESTART = "🔄"
    PAUSE = "⏸️"

    # Sections
    DASHBOARD = "📊"
    AI = "🤖"
    SYSTEM = "⚙️"
    ANALYTICS = "📈"

# Використання:
status = f"{EmojiTheme.CPU} CPU: 45%"
```

### Форматування повідомлень:

```python
class MessageFormatter:
    """Форматування повідомлень"""

    @staticmethod
    def format_table(headers: List[str], rows: List[List[str]]) -> str:
        """Форматування таблиці"""
        result = "```\n"

        # Headers
        result += " | ".join(headers) + "\n"
        result += "-" * (len(" | ".join(headers))) + "\n"

        # Rows
        for row in rows:
            result += " | ".join(row) + "\n"

        result += "```"
        return result

    @staticmethod
    def format_progress_bar(percent: float, width: int = 20) -> str:
        """Прогрес бар"""
        filled = int(width * percent / 100)
        bar = "█" * filled + "░" * (width - filled)
        return f"[{bar}] {percent:.1f}%"

    @staticmethod
    def format_code_block(code: str, language: str = "") -> str:
        """Блок коду"""
        return f"```{language}\n{code}\n```"

# Використання:
table = MessageFormatter.format_table(
    ["Name", "Status", "CPU"],
    [
        ["Backend", "Running", "45%"],
        ["Frontend", "Running", "12%"]
    ]
)

progress = MessageFormatter.format_progress_bar(75)
# [███████████████░░░░░] 75.0%
```

## 📊 Статистика та метрики

```python
class StatsController:
    """Контролер статистики"""

    def __init__(self, redis_client):
        self.redis = redis_client

    async def track_command(self, user_id: int, command: str):
        """Трекінг команд"""
        key = f"stats:commands:{user_id}"
        await self.redis.hincrby(key, command, 1)

    async def get_user_stats(self, user_id: int) -> str:
        """Статистика користувача"""
        key = f"stats:commands:{user_id}"
        commands = await self.redis.hgetall(key)

        if not commands:
            return "📊 Немає статистики"

        total = sum(int(v) for v in commands.values())

        result = f"📊 **Ваша статистика**\n\n"
        result += f"Всього команд: {total}\n\n"

        # Топ команд
        sorted_commands = sorted(
            commands.items(),
            key=lambda x: int(x[1]),
            reverse=True
        )[:5]

        result += "**Топ команд:**\n"
        for cmd, count in sorted_commands:
            percent = int(count) / total * 100
            result += f"- {cmd}: {count} ({percent:.1f}%)\n"

        return result

# Використання:
stats = StatsController(redis)

@dp.message()
async def track_message(message: types.Message):
    await stats.track_command(message.from_user.id, message.text)
    # ... обробка повідомлення
```

## 🔐 Безпека

### Авторизація користувачів:

```python
class AuthController:
    """Контролер авторизації"""

    def __init__(self, redis_client):
        self.redis = redis_client
        self.allowed_users = set()

    async def is_authorized(self, user_id: int) -> bool:
        """Перевірка авторизації"""
        return user_id in self.allowed_users or user_id == TELEGRAM_ADMIN_ID

    async def add_user(self, user_id: int):
        """Додати користувача"""
        self.allowed_users.add(user_id)
        await self.redis.sadd("authorized_users", user_id)

    async def remove_user(self, user_id: int):
        """Видалити користувача"""
        self.allowed_users.discard(user_id)
        await self.redis.srem("authorized_users", user_id)

# Middleware для перевірки:
auth = AuthController(redis)

@dp.message()
async def check_auth(message: types.Message, handler, event):
    if not await auth.is_authorized(message.from_user.id):
        await message.answer("❌ Доступ заборонено")
        return
    return await handler(message, event)
```

---

**Це лише початок! Експериментуйте та створюйте власні розширення! 🚀**
