# 🔍 Аналіз Mock-ів в Kaggle Backend v67

> **Дата**: 2026-06-02  
> **Файл**: `scripts/predator_kaggle_prod_v67.py`  
> **Статус**: ПОТРІБЕН РЕФАКТОРИНГ

---

## 📊 Поточний стан

Бекенд v67 використовує **5 mock-класів** та **генеровані фейкові дані**.

---

## ❌ Mock-класи (потрібно замінити)

### 1. Neo4jMock (рядки 307-328)
```python
class Neo4jMock:
    """Графова БД через NetworkX."""
    def __init__(self) -> None:
        self.graph = nx.DiGraph()
```
**Проблема**: Використовує NetworkX замість реального Neo4j  
**Рішення**: Замінити на `neo4j.GraphDatabase.driver()`  
**Реальні дані**: Підключення до Neo4j на iMac (192.168.0.200:7687)

### 2. RedisMock (рядки 331-349)
```python
class RedisMock:
    """Redis cache emulation."""
    def __init__(self) -> None:
        self.store: dict[str, Any] = {}
        self.ttl: dict[str, float] = {}
```
**Проблема**: Використовує Dict замість реального Redis  
**Рішення**: Замінити на `redis.Redis()`  
**Реальні дані**: Підключення до Redis на iMac (192.168.0.200:6379)

### 3. QdrantMock (рядки 352-376)
```python
class QdrantMock:
    """Векторна БД emulation."""
    def __init__(self) -> None:
        self.vectors: dict[str, dict] = {}
        self.payloads: dict[str, dict] = {}
```
**Проблема**: Використовує NumPy замість реального Qdrant  
**Рішення**: Замінити на `qdrant_client.QdrantClient()`  
**Реальні дані**: Підключення до Qdrant на iMac (192.168.0.200:6333)

### 4. KafkaMock (рядки 379-390)
```python
class KafkaMock:
    """Kafka topics emulation."""
    def __init__(self) -> None:
        self.topics: dict[str, list] = defaultdict(list)
```
**Проблема**: Використовує Threading замість реального Kafka  
**Рішення**: Замінити на `aiokafka.AIOKafkaProducer/Consumer`  
**Реальні дані**: Підключення до Kafka на iMac (192.168.0.200:9092)

### 5. MinIOMock (рядки 393-410)
```python
class MinIOMock:
    """Файлове сховище emulation."""
    def __init__(self, base_path: str = "/kaggle/working/storage") -> None:
        self.base_path = base_path
        os.makedirs(base_path, exist_ok=True)
```
**Проблема**: Використовує локальні файли замість реального MinIO  
**Рішення**: Замінити на `minio.Minio()`  
**Реальні дані**: Підключення до MinIO на iMac (192.168.0.200:9000)

---

## ❌ Генеровані фейкові дані (потрібно замінити)

### 1. Seed Data Generator (рядки 538-677)
```python
async def _seed_database() -> None:
    """Заповнення БД реалістичними даними."""
    # 500 компаній
    # 2000 транзакцій
    # 120 алертів
    # ~250 оцінок ризику
```
**Проблема**: Генерує фейкові компанії, транзакції, алерти  
**Рішення**: 
- Імпортувати реальні дані з PostgreSQL на iMac
- Використати реальні митні декларації
- Використати реальні реєстри (ЄДРПОУ)

### 2. Neo4j Graph Seed (рядки 805-819)
```python
# Збагачення Neo4j графа
for i in range(1, NUM_COMPANIES + 1):
    node_id = f"COMP-{i:04d}"
    neo4j.graph.add_node(node_id, ...)
```
**Проблема**: Створює фейкові вузли та зв'язки  
**Рішення**: Імпортувати реальний граф з Neo4j на iMac

### 3. Qdrant Vectors Seed (рядки 821-831)
```python
vectors_data = []
for i in range(1, min(201, NUM_COMPANIES + 1)):
    vec = np.random.default_rng(seed=i).random(128).tolist()
```
**Проблема**: Генерує випадкові вектори  
**Рішення**: Використати реальні embeddings з Qdrant на iMac

### 4. ETL Simulation (рядки 680-732)
```python
async def _run_etl_simulation():
    """Фонова задача, яка симулює безперервний ETL-парсинг."""
    # Симуляція додавання нових повідомлень з Telegram
    # Симуляція згадок у даркнеті
```
**Проблема**: Симулює ETL замість реального парсингу  
**Рішення**: Реальний ETL з реальних джерел (Telegram API, Darknet моніторинг)

### 5. OSINT Generated Data (рядки 553-595)
```python
# OSINT & ФІНАНСОВІ ПОТОКИ (Тіньовий парсинг)
for i in range(1, 101):
    session.add(TradeFlow(...))  # 100 фейкових потоків

channels = ["@customs_leak", "@smugglers_chat", ...]
for i in range(1, 51):
    session.add(TelegramMessage(...))  # 50 фейкових повідомлень
```
**Проблема**: Фейкові Telegram повідомлення, Darknet згадки, Trade flows  
**Рішення**: Реальний парсинг Telegram, Darknet, реєстрів

---

## 🎯 План рефакторингу

### Крок 1: Заміна mock-класів на реальні підключення

```python
# Замість Neo4jMock
from neo4j import GraphDatabase
neo4j_driver = GraphDatabase.driver("bolt://192.168.0.200:7687", auth=("neo4j", "password"))

# Замість RedisMock
import redis
redis_client = redis.Redis(host="192.168.0.200", port=6379, db=0)

# Замість QdrantMock
from qdrant_client import QdrantClient
qdrant_client = QdrantClient(url="http://192.168.0.200:6333")

# Замість KafkaMock
from aiokafka import AIOKafkaProducer, AIOKafkaConsumer
kafka_producer = AIOKafkaProducer(bootstrap_servers="192.168.0.200:9092")

# Замість MinIOMock
from minio import Minio
minio_client = Minio("192.168.0.200:9000", access_key="...", secret_key="...", secure=False)
```

### Крок 2: Заміна генерованих даних на реальні

```python
# Замість _seed_database()
async def _import_real_data():
    """Імпорт реальних даних з iMac PostgreSQL."""
    # Підключення до PostgreSQL на iMac
    # Імпорт компаній, транзакцій, алертів
    pass

# Замість ETL simulation
async def _run_real_etl():
    """Реальний ETL з реальних джерел."""
    # Telegram API парсинг
    # Darknet моніторинг
    # Реєстри (ЄДРПОУ, судовий реєстр)
    pass
```

### Крок 3: Оновлення конфігурації

```python
# Environment variables
POSTGRES_HOST = "192.168.0.200"
POSTGRES_PORT = 5432
NEO4J_URI = "bolt://192.168.0.200:7687"
REDIS_HOST = "192.168.0.200"
QDRANT_HOST = "192.168.0.200"
KAFKA_BOOTSTRAP = "192.168.0.200:9092"
MINIO_ENDPOINT = "192.168.0.200:9000"
```

---

## 📋 Чек-лист перевірки

Перед деплоєм перевірити:
- [ ] Немає класів Neo4jMock, RedisMock, QdrantMock, KafkaMock, MinIOMock
- [ ] Немає функції _seed_database() з генерованими даними
- [ ] Немає _run_etl_simulation() з симуляцією
- [ ] Всі підключення до реальних баз даних на iMac (192.168.0.200)
- [ ] Реальні дані імпортуються з PostgreSQL, Neo4j, Redis, Qdrant
- [ ] Реальний ETL з реальних джерел (Telegram, Darknet, реєстри)

---

## ⚠️ Примітка про Kaggle

Оскільки Kaggle не має доступу до локальної мережі (iMac 192.168.0.200), потрібно:

1. **Варіант A**: Розгорнути реальні бази даних в хмарі (AWS, GCP, Azure)
2. **Варіант B**: Використувати VPN/tunnel для доступу до iMac з Kaggle
3. **Варіант C**: Перенести бекенд з Kaggle на iMac (Compute Node)

**Рекомендовано**: Варіант C - розгорнути бекенд на iMac де вже є всі реальні бази даних.
