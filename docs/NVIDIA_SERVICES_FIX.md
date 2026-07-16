# 🔧 Відновлення непрацюючих сервісів на NVIDIA сервері

## Проблема

На NVIDIA сервері (194.177.1.240) вимкнені критичні сервіси через обмеження ресурсів:
- **OpenSearch** — OOM (потрібно >2GB RAM)
- **Qdrant** — replicaCount: 0 (вимкнено)
- **MinIO** — не сконфігуровано
- **LiteLLM** — OOM
- **Otel Collector** — конфлікт портів 8888
- **Tempo** — невідома конфігурація
- **MLflow** — не сконфігуровано

## Рішення

Оптимізовано ресурси для вимкнених сервісів у Helm values файлах:

### 1. OpenSearch
- **Змінено**: `replicas: 2` → `replicas: 1` (singleNode)
- **Змінено**: Memory `4Gi` → `2Gi`
- **Змінено**: CPU `2` → `1`
- **Змінено**: Java opts `-Xms2g -Xmx2g` → `-Xms1g -Xmx1g`

### 2. Qdrant
- **Змінено**: Memory `4Gi` → `2Gi`
- **Змінено**: CPU `2` → `1`
- **Змінено**: Persistence `20Gi` → `10Gi`

### 3. MinIO
- **Змінено**: Memory `512Mi` → `256Mi` (requests)
- **Змінено**: CPU `200m` → `100m` (requests)
- **Змінено**: Persistence `100Gi` → `20Gi`

### 4. Ollama
- **Змінено**: Memory `16Gi` → `8Gi`
- **Змінено**: CPU `4` → `2`
- **Змінено**: Persistence `50Gi` → `20Gi`
- **Змінено**: Моделі: `llama3.2`, `qwen2.5`, `qwen3`, `nomic-embed-text` → `qwen2.5:4b`, `nomic-embed-text`

## Інструкція для деплою

### Крок 1: Підключення до NVIDIA сервера

```bash
ssh user@194.177.1.240
```

### Крок 2: Перехід до директорії Helm чартів

```bash
cd /path/to/predator/helm/predator-umbrella
```

### Крок 3: Оновлення values файлу

Використати оптимізований файл `values-compute-nvidia.yaml`:

```bash
helm upgrade predator-v61 . -f values-compute-nvidia.yaml -n predator-v61
```

Або для середовища NVIDIA:

```bash
cd /path/to/predator/environments/nvidia
helm upgrade predator-nvidia . -f values.yaml -n predator-nvidia
```

### Крок 4: Перевірка статусу подів

```bash
kubectl get pods -n predator-v61
```

Очікуємо, що всі поди будуть у статусі `Running`:
- `qdrant-0`
- `opensearch-0`
- `minio-0`
- `ollama-0`

### Крок 5: Перевірка логів при необхідності

```bash
# OpenSearch
kubectl logs -n predator-v61 deployment/opensearch -f

# Qdrant
kubectl logs -n predator-v61 deployment/qdrant -f

# MinIO
kubectl logs -n predator-v61 deployment/minio -f
```

### Крок 6: Перевірка доступності сервісів

```bash
# OpenSearch
kubectl port-forward -n predator-v61 svc/opensearch 9200:9200
curl http://localhost:9200/_cluster/health

# Qdrant
kubectl port-forward -n predator-v61 svc/qdrant 6333:6333
curl http://localhost:6333/healthz

# MinIO
kubectl port-forward -n predator-v61 svc/minio 9000:9000
curl http://localhost:9000/minio/health/live
```

## Очікуваний результат

Після застосування змін:
- ✅ **OpenSearch** — працює з 2Gi RAM (singleNode)
- ✅ **Qdrant** — працює з 2Gi RAM (replicaCount: 1)
- ✅ **MinIO** — працює з 512Mi RAM
- ✅ **Ollama** — працює з 8Gi RAM (менші моделі)

## Функціонал, який відновиться

1. **Повнотекстовий пошук** (OpenSearch)
2. **RAG та семантичний пошук** (Qdrant)
3. **Завантаження файлів** (MinIO)
4. **AI Gateway** (Ollama з меншими моделями)

## Моніторинг

Після деплою моніторити ресурси:

```bash
kubectl top pods -n predator-v61
kubectl top nodes
```

Якщо поди все ще мають OOM, додатково зменшити memory limits у values файлі.

## Відкат

Якщо виникнуть проблеми, відкотити зміни:

```bash
helm rollback predator-v61 -n predator-v61
```

## Файли, які змінено

1. `/Users/Shared/Predator_60/environments/nvidia/values.yaml`
2. `/Users/Shared/Predator_60/helm/predator-umbrella/values-compute-nvidia.yaml`
