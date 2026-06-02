# Реєстр історичних даних митних декларацій

## Огляд

Система для зберігання та аналізу історичних даних митних декларацій за період 5-8 років (60-96 місяців).

## Архітектура

### 1. Інтеграція з Excel файлами

**Файл:** `libs/core/integrations/customs_excel_import.py`

- `CustomsExcelImporter` - імпортер даних з Excel файлів
- `BatchExcelImporter` - пакетний імпортер для багатьох файлів
- Підтримка великих файлів через pandas
- Нормалізація даних та конвертація типів

### 2. ETL процес

**Файл:** `libs/core/etl/customs_declarations_etl.py`

- `CustomsDeclarationsETL` - основний ETL процес
- `HistoricalDataLoader` - завантажувач історичних даних
- Підтримка щомісячного імпорту
- Статистика та моніторинг

### 3. Оптимізація бази даних

**Файл:** `db/postgres/historical_data_optimization.sql`

- Партиціонування за місяцями (declarations_historical)
- BRIN індекси для великих таблиць
- Матеріалізовані представлення для аналітики
- Автоматичне архівування старих даних
- Функції для моніторингу розміру партицій

### 4. Скрипт імпорту

**Файл:** `scripts/import_customs_excel.py`

```bash
# Оцінка обсягу даних
python scripts/import_customs_excel.py --directory /Users/dima1203/Desktop --tenant-id <tenant_id> --estimate-only

# Повний імпорт
python scripts/import_customs_excel.py --directory /Users/dima1203/Desktop --tenant-id <tenant_id> --start-year 2019 --end-year 2027
```

### 5. API Endpoints

**Файл:** `app/api/v1/historical_declarations.py`

- `/api/v1/historical/declarations` - отримання декларацій
- `/api/v1/historical/statistics/monthly` - щомісячна статистика
- `/api/v1/historical/statistics/uktzed` - статистика по УКТЗЕД
- `/api/v1/historical/statistics/importers` - статистика по імпортерах
- `/api/v1/historical/statistics/customs-posts` - статистика по митних постах
- `/api/v1/historical/trends` - тренд імпорту
- `/api/v1/historical/summary` - підсумок за період

## Використання

### Крок 1: Підготовка бази даних

```bash
# Виконати оптимізацію схеми
psql -U predator -d predator_db -f db/postgres/historical_data_optimization.sql
```

### Крок 2: Оцінка обсягу даних

```bash
python scripts/import_customs_excel.py \
    --directory /Users/dima1203/Desktop \
    --tenant-id a0000000-0000-0000-0000-000000000001 \
    --estimate-only
```

### Крок 3: Імпорт даних

```bash
python scripts/import_customs_excel.py \
    --directory /Users/dima1203/Desktop \
    --tenant-id a0000000-0000-0000-0000-000000000001 \
    --start-year 2019 \
    --end-year 2027
```

### Крок 4: Перевірка через API

```bash
# Отримати декларації за період
curl "http://localhost:8000/api/v1/historical/declarations?start_date=2024-03-01&end_date=2024-03-31&limit=100"

# Отримати щомісячну статистику
curl "http://localhost:8000/api/v1/historical/statistics/monthly?start_date=2024-01-01&end_date=2024-12-31"

# Отримати підсумок
curl "http://localhost:8000/api/v1/historical/summary?start_date=2024-01-01&end_date=2024-12-31"
```

## Структура файлів

Файли повинні мати назву в форматі: `Місяць_Рік.xlsx`

Наприклад:
- `Січень_2024.xlsx`
- `Лютий_2024.xlsx`
- `Березень_2024.xlsx`
- ...

## Очікуваний обсяг даних

- Один місяць: ~237MB
- 5 років (60 місяців): ~14.2GB
- 8 років (96 місяців): ~22.7GB

## Оптимізації продуктивності

1. **Партиціонування за місяцями** - швидкий доступ до даних за період
2. **BRIN індекси** - компактні індекси для послідовних даних
3. **Матеріалізовані представлення** - попередньо обчислена статистика
4. **Автовакуум** - автоматичне очищення та оптимізація
5. **Архівування** - автоматичне переміщення старих даних (>5 років)

## Моніторинг

### Перевірка розміру партицій

```sql
SELECT * FROM get_partition_sizes();
```

### Оновлення матеріалізованих представлень

```sql
SELECT refresh_historical_materialized_views();
```

### Статистика імпорту

```sql
SELECT * FROM import_metadata ORDER BY start_time DESC LIMIT 10;
```

## Обмеження

- Максимальний розмір Excel файлу: ~500MB
- Рекомендований розмір партії: 10,000 рядків
- Кількість паралельних воркерів: 4
- Період архівування: 5 років

## Наступні кроки

1. Інтеграція з реальним API податкової служби
2. Автоматичний імпорт нових файлів (watchdog)
3. Інтеграція з ClickHouse для OLAP аналітики
4. Додавання графічних візуалізацій
5. Оптимізація для реального часу
