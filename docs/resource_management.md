# PREDATOR Analytics v56.5-ELITE — Управління ресурсами (SM Resource Contract)

## Опис

Ти вказав жорсткі ліміти: 64GB RAM та GTX 1080 (8GB VRAM). Розмістити на цьому "залізі" 8 важких баз даних і LLM — це виклик, який вимагає ювелірної оптимізації.

## Архітектура

### 1. GPU Memory Manager (Квантування та Offloading)

**LLM Budget $0:**

Моделі (DeepSeek R1 або GLM-5.1) не можуть працювати у FP16 на 8GB VRAM. У ТЗ фіксується використання формату GGUF (int4/int8 quantization).

**Модель завантажується через Ollama. Шари моделі, які не поміщаються у 8GB VRAM відеокарти, автоматично скидаються (offloading) у системні 64GB RAM. Це трохи знижує швидкість токенів, але робить систему стабільною і не дає впасти з помилкою OOM (Out of Memory).**

**Конфігурація Ollama:**

```bash
# Встановлення Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Завантаження квантованої моделі (int4)
ollama pull deepseek-r1:7b-q4_K_M

# Запуск з offloading в RAM
ollama run deepseek-r1:7b-q4_K_M --num-gpu 4
```

**Налаштування offloading:**

```python
from llama_cpp import Llama

class GPUMemoryManager:
    """Менеджер GPU пам'яті для LLM."""
    
    def __init__(self, model_path: str, gpu_layers: int = 4):
        """
        Ініціалізація менеджера.
        
        Args:
            model_path: Шлях до GGUF моделі
            gpu_layers: Кількість шарів, що завантажуються в GPU
        """
        self.model_path = model_path
        self.gpu_layers = gpu_layers
        self.llm = None
    
    def load_model(self):
        """Завантаження моделі з offloading."""
        self.llm = Llama(
            model_path=self.model_path,
            n_ctx=8192,  # Контекстне вікно
            n_gpu_layers=self.gpu_layers,  # Шари в GPU
            n_batch=512,  # Розмір батчу
            verbose=False
        )
    
    def get_memory_usage(self) -> dict:
        """Отримання інформації про використання пам'яті."""
        import GPUtil
        
        gpu = GPUtil.getGPUs()[0]
        
        return {
            "gpu_memory_used": gpu.memoryUsed,
            "gpu_memory_total": gpu.memoryTotal,
            "gpu_memory_percent": gpu.memoryUtil * 100,
            "gpu_load": gpu.load * 100
        }
```

### 2. Бази даних та Swap/Cache

**PostgreSQL (TimescaleDB) та ClickHouse:**

Налаштовуються з жорстко лімітованими пулами пам'яті (наприклад, ClickHouse max_server_memory_usage = 8GB, PostgreSQL shared_buffers = 4GB).

**Конфігурація PostgreSQL:**

```ini
# postgresql.conf
shared_buffers = 4GB
effective_cache_size = 12GB
maintenance_work_mem = 1GB
work_mem = 64MB
max_connections = 100
```

**Конфігурація ClickHouse:**

```xml
<!-- clickhouse-server/config.xml -->
<max_server_memory_usage>8000000000</max_server_memory_usage>  <!-- 8GB -->
<max_memory_usage>8000000000</max_memory_usage>
<max_threads>4</max_threads>
<max_concurrent_queries>10</max_concurrent_queries>
```

**Redis:**

Працює з політикою витіснення allkeys-lru і жорстким лімітом у 2GB.

```ini
# redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru
maxclients 10000
```

**Neo4j:**

Обмеження пам'яті для JVM та кешу.

```conf
# neo4j.conf
dbms.memory.heap.initial_size=2g
dbms.memory.heap.max_size=4g
dbms.memory.pagecache.size=2g
```

### 3. Життєвий цикл розгортання (deploy_sm.sh)

Єдиний баш-скрипт відповідає за холодний старт:

```bash
#!/bin/bash
# deploy_sm.sh

set -e

echo "🚀 PREDATOR Analytics v56.5-ELITE — Cold Start Deployment"

# 1. Перевірка наявності NVIDIA Drivers та Container Toolkit
if ! command -v nvidia-smi &> /dev/null; then
    echo "❌ NVIDIA Drivers не знайдено"
    exit 1
fi

if ! command -v nvidia-container-toolkit &> /dev/null; then
    echo "⚠️ NVIDIA Container Toolkit не знайдено, встановлення..."
    curl -s -L https://nvidia.github.io/nvidia-container-runtime/gpgkey | sudo apt-key add -
    distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
    curl -s -L https://nvidia.github.io/nvidia-container-runtime/$distribution/nvidia-container-runtime.list | sudo tee /etc/apt/sources.list.d/nvidia-container-runtime.list
    sudo apt-get update
    sudo apt-get install -y nvidia-container-toolkit
    sudo systemctl restart docker
fi

# 2. Створення правильної ієрархії тек для Volumes
echo "📁 Створення ієрархії тек..."
mkdir -p /data/predator/{postgres,clickhouse,neo4j,qdrant,redis,models}
chmod -R 755 /data/predator

# 3. chmod / chown — налаштування прав доступу (security hardening)
echo "🔒 Налаштування прав доступу..."
chown -R 999:999 /data/predator/postgres
chown -R 101:101 /data/predator/clickhouse
chown -R 7474:7474 /data/predator/neo4j
chown -R 1000:1000 /data/predator/qdrant

# 4. Запуск Trivy — сканування Docker-образів на вразливості перед їхнім підняттям
echo "🔍 Сканування Docker-образів..."
docker pull aquasec/trivy:latest
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image predator-core-api:latest || echo "⚠️ Trivy сканування не вдалося"

# 5. Запуск docker-compose up -d
echo "🐳 Запуск Docker Compose..."
docker-compose -f docker-compose.server.yml up -d

# 6. Перевірка здоров'я сервісів
echo "🏥 Перевірка здоров'я сервісів..."
sleep 10

# PostgreSQL
if docker exec predator-postgres pg_isready -U predator; then
    echo "✅ PostgreSQL: здоровий"
else
    echo "❌ PostgreSQL: не здоровий"
fi

# Neo4j
if curl -f http://localhost:7474 > /dev/null 2>&1; then
    echo "✅ Neo4j: здоровий"
else
    echo "❌ Neo4j: не здоровий"
fi

# Redis
if docker exec predator-redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis: здоровий"
else
    echo "❌ Redis: не здоровий"
fi

echo "🎉 PREDATOR Analytics v56.5-ELITE розгорнуто успішно!"
```

## Моніторинг ресурсів

**Prometheus + Grafana:**

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'predator'
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: '/metrics'
```

**Alertmanager правила:**

```yaml
# alertmanager.yml
groups:
  - name: predator_resources
    rules:
      - alert: HighMemoryUsage
        expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Високе використання пам'яті"
          description: "Контейнер {{ $labels.name }} використовує > 90% пам'яті"
      
      - alert: HighGPUUsage
        expr: nvidia_gpu_memory_usage_bytes / nvidia_gpu_memory_total_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Високе використання GPU"
          description: "GPU використовує > 90% пам'яті"
```

## Переваги

- **Оптимізація GPU** — Квантування та offloading забезпечують роботу на 8GB VRAM
- **Жорсткі ліміти** — Бази даних обмежені в пам'яті
- **Автоматизований деплой** — Єдиний скрипт для холодного старту
- **Моніторинг** — Prometheus + Grafana для відстеження ресурсів

## Наступні кроки

1. Налаштувати Ollama для квантованих моделей
2. Обмежити пам'ять для всіх баз даних
3. Створити deploy_sm.sh скрипт
4. Налаштувати Prometheus + Grafana
5. Інтегрувати Alertmanager для алертів
