# PREDATOR Analytics v56.5-ELITE — Мережева автономія та Резильєнтність (NVIDIA_ZROK)

## Опис

Оскільки система може розгортатися у ворожих або обмежених мережевих середовищах (за корпоративними фаєрволами або NAT без білої IP-адреси), їй потрібен "тунель" для зв'язку.

## Архітектура

### 1. ZROK Tunneling (Bypass & Proxy)

**P2P Оверлей:**

ZROK (на базі OpenZiti) створює зашифрований peer-to-peer тунель. Це дозволяє отримувати доступ до localhost:3030 (UI) та localhost:8000 (API) з будь-якої точки світу без відкриття портів на роутері.

**Dark Network:**

Система не "відсвічує" в інтернеті (не сканується через Shodan), оскільки не має публічних відкритих портів, окрім P2P-з'єднання, яке вимагає криптографічної аутентифікації.

**Конфігурація ZROK:**

```bash
# Встановлення ZROK
curl -sSL https://get.zrok.io | sh

# Реєстрація в ZROK
zrok enable <token>

# Створення тунелю для Frontend (порт 3030)
zrok share public localhost:3030 --headless

# Створення тунелю для Backend (порт 8000)
zrok share public localhost:8000 --headless
```

**Автоматичний запуск через tmux:**

```bash
#!/bin/bash
# scripts/start_zrok_tunnels.sh

# Створення tmux session
tmux new-session -d -s zrok_tunnels

# Тунель для Frontend
tmux send-keys -t zrok_tunnels "zrok share public localhost:3030 --headless" C-m

# Тунель для Backend
tmux split-window -t zrok_tunnels
tmux send-keys -t zrok_tunnels "zrok share public localhost:8000 --headless" C-m

echo "ZROK тунелі запущено в tmux session: zrok_tunnels"
```

**Моніторинг тунелів:**

```bash
#!/bin/bash
# scripts/monitor_zrok.sh

# Перевірка статусу тунелів
zrok list

# Якщо тунель не активний, перезапустити
if ! zrok list | grep -q "active"; then
    echo "Тунель не активний, перезапуск..."
    ./scripts/start_zrok_tunnels.sh
fi
```

### 2. Agentic Sync (Синхронізація Знань)

Якщо розгортається кілька "бойових" нод системи (наприклад, у різних підрозділах), векторні бази (Qdrant) та журнали рішень обмінюються даними через ZROK.

Якщо Нода А виявила новий патерн поведінки (наприклад, нову схему ухилення на митниці), знання про цей патерн автоматично передаються в GLM-5.1 на Ноді Б.

**Реалізація синхронізації:**

```python
import asyncio
from qdrant_client import QdrantClient

class AgenticSync:
    """Синхронізація знань між нодами."""
    
    def __init__(self, local_qdrant: QdrantClient, remote_zrok_url: str):
        self.local_qdrant = local_qdrant
        self.remote_zrok_url = remote_zrok_url
    
    async def sync_investigations(self):
        """Синхронізація розслідувань між нодами."""
        
        # Отримання локальних розслідувань
        local_investigations = self.local_qdrant.scroll(
            collection_name="investigations",
            limit=100
        )
        
        # Відправка на віддалену ноду через ZROK
        for investigation in local_investigations[0]:
            await self.send_to_remote_node(investigation)
    
    async def send_to_remote_node(self, investigation: dict):
        """Відправка розслідування на віддалену ноду."""
        
        import aiohttp
        
        async with aiohttp.ClientSession() as session:
            await session.post(
                f"{self.remote_zrok_url}/api/v1/vector-router/save",
                json={
                    "query": investigation.payload["query"],
                    "cypher_query": investigation.payload["cypher_query"],
                    "result": investigation.payload["result"],
                    "pattern": investigation.payload["pattern"]
                }
            )
    
    async def receive_from_remote_node(self):
        """Отримання розслідувань з віддаленої ноди."""
        
        # Прослуховування ZROK тунелю для вхідних даних
        while True:
            # Отримання даних з віддаленої ноди
            # Збереження в локальну Qdrant
            await asyncio.sleep(60)  # Перевірка кожну хвилину
```

**Конфігурація синхронізації:**

```yaml
# config/agentic_sync.yaml
sync:
  enabled: true
  remote_nodes:
    - name: "Node A"
      zrok_url: "https://node-a.share.zrok.io"
    - name: "Node B"
      zrok_url: "https://node-b.share.zrok.io"
  sync_interval: 300  # секунд
  collections:
    - investigations
    - decision_ledgers
```

## Переваги

- **Мережева автономія** — Робота в обмежених мережевих середовищах
- **Dark Network** — Система не сканується через Shodan
- **P2P Тунелювання** — Доступ без відкриття портів
- **Синхронізація знань** — Автоматичний обмін патернами між нодами

## Наступні кроки

1. Налаштувати ZROK тунелі для Frontend та Backend
2. Створити автоматичний запуск через tmux
3. Реалізувати Agentic Sync для синхронізації знань
4. Налаштувати моніторинг тунелів
5. Інтегрувати з Qdrant для синхронізації розслідувань
