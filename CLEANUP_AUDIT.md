# 🦅 Завдання: Аудит та Очищення NVIDIA Server (194.177.1.240)

## Контекст
Сервер NVIDIA використовується як production backend для PREDATOR Analytics v55.1.
**Мета**: Виявити та видалити гарячий мусор, освободити місце, підтримати чистоту дисків.

---

## ФАЗА 1️⃣: ДІАГНОСТИКА

### 1.1 Підключення до сервера
```bash
ssh predator@194.177.1.240
# або
ssh -i ~/.ssh/predator_nvidia_key predator@194.177.1.240
```

### 1.2 Перевірка дискового простору
```bash
# Загальна статистика
df -h

# Детальний аналіз за директоріями (топ 20)
du -sh /* 2>/dev/null | sort -rh | head -20

# Топ 50 найбільших файлів
find / -type f -size +100M 2>/dev/null | xargs du -h | sort -rh | head -50

# Топ директорій які займають місце
find / -maxdepth 3 -type d 2>/dev/null | xargs du -sh 2>/dev/null | sort -rh | head -30
```

---

## ФАЗА 2️⃣: КАТЕГОРИЗАЦІЯ МУСОРА

Перевір наступні директорії та видали те, що **НЕ входить** в цей список ДОЗВОЛЕНИХ:

### ✅ ДОЗВОЛЕНО (НЕ ЧИСТИТИ)
```
/home/predator/
├── predator-analytics/          ← основна папка проекту
├── services/
│   ├── core-api/                ← FastAPI production
│   ├── ingestion-worker/        ← Kafka consumer
│   ├── graph-service/           ← Neo4j algorithms
│   └── api-gateway/             ← Nginx/Traefik
├── db/
│   ├── postgres/data/           ← PRODUCTION DATA
│   ├── neo4j/data/              ← PRODUCTION DATA
│   └── redis/data/              ← PRODUCTION DATA
├── backups/                     ← SQL/Neo4j бекапи
└── deploy/
    ├── docker-compose.yml
    ├── helm/
    └── monitoring/

/var/lib/
├── postgresql/                  ← CRITICAL: DB files
├── neo4j/                       ← CRITICAL: Graph DB
└── redis/                       ← CRITICAL: Cache data

/data/                          ← MinIO, Qdrant storage
/opt/kafka/                     ← Kafka brokers
/opt/litellm/                   ← LiteLLM models
/opt/ollama/                    ← Ollama local models
```

### ❌ ВИДАЛИТИ (МУСОР)

#### A. Старі версії / Артефакти розробки
```bash
# Очищення pip cache
rm -rf ~/.cache/pip/*
rm -rf /var/cache/pip/*

# Очищення Docker
docker system prune -a --volumes --force
docker image prune -a -f
docker container prune -f
docker volume prune -f

# Node modules від старих версій (якщо є)
find /home/predator -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null

# Python __pycache__ та .pyc
find /home/predator -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null
find /home/predator -type f -name "*.pyc" -delete 2>/dev/null

# .venv директорії (КРІМ активного)
find /home/predator -type d -name ".venv" -not -path "*/predator-analytics/.venv" -exec rm -rf {} + 2>/dev/null
```

#### B. Тимчасові файли
```bash
# Логи старше 30 днів
find /var/log -type f -mtime +30 -delete 2>/dev/null

# /tmp файли
rm -rf /tmp/* 2>/dev/null
rm -rf /var/tmp/* 2>/dev/null

# Swap файли
rm -rf /swapfile* 2>/dev/null
```

#### C. Ліцензійні/демо версії (якщо є)
```bash
# Старі версії Docker images (dev теги)
docker images | grep "dev\|test\|tmp\|old" | awk '{print $3}' | xargs docker rmi -f 2>/dev/null

# Дублікати бекапів (старше 60 днів)
find /home/predator/backups -type f -mtime +60 -delete 2>/dev/null
```

#### D. Невикористовувані моделі Ollama
```bash
# Переглянути встановлені моделі
ollama list

# Видалити застарілі (не потрібні для production):
# ollama rm model-name
```

#### E. OpenSearch / Kafka стара індексація
```bash
# Архівні ES індекси (старше 90 днів)
curl -X DELETE http://194.177.1.240:9200/logs-*-90d-*

# Старі Kafka topics (якщо є dev/test)
kafka-topics --bootstrap-server 194.177.1.240:9092 --delete --topic test-* 2>/dev/null
```

---

## ФАЗА 3️⃣: ОЧИЩЕННЯ

### Порядок виконання:
```bash
#!/bin/bash
# filepath: cleanup_nvidia_server.sh
set -e

echo "🔧 PREDATOR Server Cleanup - ФАЗА 3"
echo "========================================"

# 1. Docker очищення
echo "1️⃣  Очищення Docker..."
docker system prune -a --volumes --force
docker image prune -a -f
echo "✅ Docker cleared"

# 2. Python cache
echo "2️⃣  Очищення Python cache..."
find /home/predator -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find /home/predator -type f -name "*.pyc" -delete 2>/dev/null || true
rm -rf ~/.cache/pip/*
echo "✅ Python cache cleared"

# 3. Тимчасові файли
echo "3️⃣  Очищення /tmp..."
rm -rf /tmp/* /var/tmp/* 2>/dev/null || true
echo "✅ Temp files cleared"

# 4. Старі логи (> 30 днів)
echo "4️⃣  Очищення старих логів..."
find /var/log -type f -mtime +30 -delete 2>/dev/null || true
journalctl --vacuum=30d
echo "✅ Logs cleaned"

# 5. Дублікати бекапів (> 60 днів)
echo "5️⃣  Очищення старих бекапів..."
find /home/predator/backups -type f -mtime +60 -delete 2>/dev/null || true
echo "✅ Old backups removed"

echo ""
echo "========================================"
echo "✨ Очищення завершено!"
```

---

## ФАЗА 4️⃣: ЗВІТ (FINAL REPORT)

Після очищення сформуй звіт у форматі:

```markdown
# 📊 NVIDIA Server Cleanup Report (194.177.1.240)

## 📅 Дата: $(date)
## 🔄 Версія Predator: v55.1

---

## 📈 Статистика диску

| Метрика | Перед | Після | Звільнено |
|---------|-------|-------|-----------|
| `/home` | XXX GB | XXX GB | XXX GB |
| `/var` | XXX GB | XXX GB | XXX GB |
| `/data` | XXX GB | XXX GB | XXX GB |
| **Загалом** | **XXX GB** | **XXX GB** | **XXX GB** |

---

## 🗑️ Видалено

### Docker
- [ ] Images: XXX (розмір: XXX GB)
- [ ] Containers: XXX
- [ ] Volumes: XXX

### Python Cache
- [ ] `__pycache__`: XXX директорій
- [ ] `.pyc` файли: XXX шт
- [ ] pip cache: XXX GB

### Логи & Temp
- [ ] `/var/log` старші 30 днів: XXX GB
- [ ] `/tmp`: XXX GB
- [ ] Journal: XXX GB

### Бекапи
- [ ] Бекапи старші 60 днів: XXX шт (XXX GB)

### Інше
- [ ] ES архівні індекси: XXX GB
- [ ] Старі Kafka topics: XXX

---

## ✅ Валідація

- [x] PostgreSQL (CRITICAL): online ✅
- [x] Neo4j (CRITICAL): online ✅
- [x] Redis (CRITICAL): online ✅
- [x] Kafka: online ✅
- [x] MinIO: online ✅
- [x] OpenSearch: online ✅
- [x] LiteLLM: online ✅

---

## 🎯 Рекомендації

1. **Налаштувати авторотацію логів** (`/etc/logrotate.d/predator`)
2. **Увімкнути автоочищення Docker** в `daemon.json`
3. **Налаштувати минімальний дисковий простір** (alert при < 10%)
4. **Запланувати наступне очищення**: за 30 днів

---

## 📝 Примітки
- Жоден production файл НЕ видалено
- Всі критичні БД перевірені та online
- Звільнено: **XXX GB**
```

---

## ⚠️ CRITICAL CHECKS

Перед видаленням:
1. **Backup**: `pg_dump && mongodump && redis-cli BGSAVE`
2. **Health check**: `docker ps`, `systemctl status`
3. **Disk usage**: Переконайся, що видаляєш > 1GB за раз

---

## КОМАНДИ ДЛЯ ШВИДКОЇ ПЕРЕВІРКИ

```bash
# Топ файлів які займають місце
find / -type f -size +500M 2>/dev/null | head -20

# Місце по юзерам
du -sh /home/*

# Топ директорій
du -sh /var/* | sort -rh | head -10

# Статус всіх сервісів
docker ps -a
systemctl list-units --type=service --state=running
```