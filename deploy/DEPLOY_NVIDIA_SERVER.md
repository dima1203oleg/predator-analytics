# 🚀 PREDATOR Analytics v55.1 — Деплой на NVIDIA Server

**IP сервера**: `194.177.1.240`

## Передумови

1. SSH доступ до сервера (можливо потрібен VPN)
2. Docker та Docker Compose встановлені
3. Git репозиторій склоновано

## Крок 1: Підключення до сервера

```bash
ssh root@194.177.1.240
cd /path/to/predator-analytics
```

## Крок 2: Оновлення коду

```bash
git pull origin main
```

## Крок 3: Застосування міграцій БД

```bash
# Якщо PostgreSQL вже запущений
docker exec predator-postgres psql -U predator -d predator_db -f /tmp/004_ingestion_pipeline.sql

# Або скопіювати файл і виконати
docker cp db/postgres/migrations/004_ingestion_pipeline.sql predator-postgres:/tmp/
docker exec predator-postgres psql -U predator -d predator_db -f /tmp/004_ingestion_pipeline.sql
```

## Крок 4: Ініціалізація Kafka Topics

```bash
docker exec predator-redpanda rpk topic create predator.ingestion.raw --partitions 6 --replicas 1
docker exec predator-redpanda rpk topic create predator.ingestion.enriched --partitions 6 --replicas 1
docker exec predator-redpanda rpk topic create predator.ingestion.dlq --partitions 3 --replicas 1
docker exec predator-redpanda rpk topic create predator.analytics.cers --partitions 3 --replicas 1
docker exec predator-redpanda rpk topic create predator.alerts.triggers --partitions 3 --replicas 1

# Перевірка
docker exec predator-redpanda rpk topic list
```

## Крок 5: Ініціалізація MinIO Buckets

```bash
# Використовуємо mc (MinIO Client) через Docker
docker run --rm --network predator-network --entrypoint /bin/sh minio/mc -c "
  mc alias set predator http://minio:9000 \${MINIO_ROOT_USER} \${MINIO_ROOT_PASSWORD} &&
  mc mb predator/raw-uploads --ignore-existing &&
  mc mb predator/predator-uploads --ignore-existing &&
  mc mb predator/predator-exports --ignore-existing &&
  mc ls predator/
"
```

## Крок 6: Запуск Ingestion Worker

```bash
# Для production
docker compose -f docker-compose.prod.yml up -d --build ingestion-worker redpanda neo4j

# Перевірка статусу
docker ps | grep ingestion
docker logs predator-ingestion-worker --tail 50
```

## Крок 7: Перевірка Health Endpoints

```bash
# Liveness
docker exec predator-ingestion-worker python3 -c "
import urllib.request
print(urllib.request.urlopen('http://localhost:8080/health').read().decode())
"

# Readiness
docker exec predator-ingestion-worker python3 -c "
import urllib.request
print(urllib.request.urlopen('http://localhost:8080/ready').read().decode())
"
```

Очікуваний результат:
```json
{"status": "ok"}
{"status": "ready", "kafka_connected": true, "postgres_connected": true, "ready": true}
```

## Крок 8: Тестування Ingestion Pipeline

```bash
# 1. Створити тестовий CSV файл
cat > /tmp/test_declarations.csv << 'EOF'
declaration_number,declaration_date,company_edrpou,product_description,uktzed_code,customs_value,weight,country_origin,customs_post
MD/2024/001234,2024-01-15,12345678,Комп'ютерне обладнання,8471300000,15000.50,120.5,CN,Київська митниця
MD/2024/001235,2024-01-16,87654321,Текстильні вироби,6204430000,8500.00,45.2,TR,Одеська митниця
EOF

# 2. Завантажити в MinIO
docker run --rm --network predator-network -v /tmp/test_declarations.csv:/tmp/test.csv minio/mc \
  cp /tmp/test.csv predator/raw-uploads/test_declarations.csv

# 3. Надіслати Kafka повідомлення
docker exec predator-redpanda rpk topic produce predator.ingestion.raw << 'EOF'
{"job_id": "test-001", "tenant_id": "550e8400-e29b-41d4-a716-446655440000", "user_id": "550e8400-e29b-41d4-a716-446655440001", "file_name": "test_declarations.csv", "file_size_bytes": 500, "file_content_hash": "abc123", "upload_timestamp": 1710240000, "s3_bucket_path": "s3://raw-uploads/test_declarations.csv"}
EOF

# 4. Перевірити логи
docker logs predator-ingestion-worker --tail 50
```

## Troubleshooting

### Self-hosted GitHub Runner не працює

```bash
# Перевірити статус runner
cd /path/to/actions-runner
./svc.sh status

# Перезапустити
./svc.sh stop
./svc.sh start
```

### PostgreSQL connection failed

```bash
# Перевірити чи PostgreSQL запущений
docker ps | grep postgres

# Перевірити credentials в .env
cat .env | grep POSTGRES
```

### Kafka connection failed

```bash
# Перевірити чи Redpanda запущений
docker ps | grep redpanda

# Перевірити health
curl http://localhost:9644/v1/status/ready
```

---

**Версія**: v55.1 Ironclad  
**Дата**: 2026-03-12
