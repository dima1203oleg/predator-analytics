# Predator CLI

Уніфікований інтерфейс командного рядка для платформи Predator Analytics.

## Встановлення

```bash
cd libs/cli
pip install -e .
```

## Використання

### Ingestion (Завантаження даних)
```bash
# Завантажити CSV файл
predator ingest --file data/customs_march_2024.csv --type customs

# Завантажити з кастомною назвою
predator ingest --file data.xlsx --type generic --name "Мої дані"

# Асинхронне завантаження (не чекати завершення)
predator ingest --file big_file.csv --type customs --async
```

### Training (Тренування моделей)
```bash
# Тренувати embeddings модель
predator train --dataset-id 550e8400-e29b-41d4-a716-446655440000 --target embeddings

# Тренувати з конфігурацією
predator train --dataset-id UUID --target reranker --config config.json
```

### Search (Пошук)
```bash
# Гібридний пошук
predator search --query "митні декларації 2024" --mode hybrid

# Семантичний пошук з лімітом
predator search --query "корупційні схеми" --mode semantic --limit 20

# Вивести як JSON
predator search --query "тендери" --output json
```

### Status (Статус)
```bash
# Статус конкретного job
predator status --job-id 550e8400-e29b-41d4-a716-446655440000

# Загальний статус системи
predator status
```

### Sync (Синхронізація)
```bash
# Синхронізувати джерело
predator sync --source-id UUID

# Синхронізувати всі джерела
predator sync --all

# Примусова повна синхронізація
predator sync --all --force
```

### Health (Перевірка здоров'я)
```bash
predator health
```

### Config (Конфігурація)
```bash
# Показати конфігурацію
predator config --show

# Встановити параметр
predator config --set api_url http://localhost:8090/api
```

## Змінні середовища

- `PREDATOR_API_URL` - URL бекенду (default: http://localhost:8090/api)
- `PREDATOR_API_TOKEN` - API токен для авторизації

## Приклади

### Повний цикл ETL
```bash
# 1. Завантажити дані
predator ingest --file customs_data.csv --type customs

# 2. Перевірити статус
predator status --job-id <JOB_ID>

# 3. Виконати пошук
predator search --query "імпорт з Китаю" --mode hybrid
```

### Тренування моделі
```bash
# 1. Перевірити доступні датасети
predator status --all --type dataset

# 2. Запустити тренування
predator train --dataset-id <DATASET_ID> --target embeddings --async

# 3. Моніторити прогрес
predator status --job-id <JOB_ID>
```
