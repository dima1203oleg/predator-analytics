# Архітектура Розподіленого Знання (Data Reactor Routing Architecture)

## 1. Концепція Розподілу
Одна декларація не є єдиним монолітним записом в одній базі даних. Вона розкладається на логічні рівні, створюючи багатовимірну проекцію реальності:
- **Факти (PostgreSQL)**: Жорстко структуровані транзакційні дані (дати, суми, контрагенти).
- **Зв'язки (Graph DB)**: Мережа взаємодій (Компанія → Декларація → Продукт → Країна).
- **Пошуково-текстовий Індекс (OpenSearch)**: Швидкий повнотекстовий пошук за описами товарів та номенклатурою.
- **Семантичний Простір (Qdrant)**: Векторні представлення (embeddings) для пошуку аномалій, схожих товарів та нетипових схем.
- **Стан Процесу (Redis)**: Тимчасовий стан обробки декларації (від завантаження до повної індексації).
- **Оригінал (MinIO)**: Сирі дані (excel/csv/json) для можливості повторної обробки (re-ingestion) без втрат.

## 2. Канонічна Модель Декларації
Єдина внутрішня структура, з якої генеруються всі інші представлення.

```json
{
  "declaration_id": "string (UUID or custom ID)",
  "import_date": "ISO8601 DateTime",
  "actor": {
    "company_id": "string",
    "company_name": "string",
    "country_code": "string"
  },
  "financials": {
    "total_value": "float",
    "currency": "string"
  },
  "items": [
    {
      "item_id": "string",
      "hs_code": "string",
      "description": "string",
      "weight": "float",
      "price": "float"
    }
  ],
  "metadata": {
    "source_file": "string",
    "parser_version": "string",
    "ingestion_timestamp": "ISO8601 DateTime"
  }
}
```

## 3. Правила Розподілу (Routing Engine Logic)
Router Engine отримує канонічну модель і розщеплює її на payload'и для кожної БД.

1. **PostgreSQL Payload**:
   - `declarations` table: `declaration_id`, `import_date`, `company_id`, `total_value`.
   - `declaration_items` table: `item_id`, `declaration_id`, `hs_code`, `weight`, `price`.
2. **Graph DB Payload**:
   - Nodes: `Company`, `Declaration`, `HS_Code`, `Country`.
   - Edges: `(Company)-[FILED]->(Declaration)`, `(Declaration)-[CONTAINS]->(HS_Code)`.
3. **OpenSearch Payload**:
   - Document ID = `item_id`.
   - Fields: `declaration_id`, `hs_code`, `description`, `company_name` (для фасетного пошуку).
4. **Qdrant Payload**:
   - Векторизація поля `description` + `hs_code`.
   - Vector ID = Hash(`item_id`).
   - Meta: `declaration_id`, `company_id`.

## 4. Подієва Модель (Event Pipeline)
Пайплайн не є синхронним переливанням. Це ланцюг подій:

- `DECLARATION_RECEIVED`: Файл завантажено.
- `DECLARATION_PARSED`: Трансформовано в Канонічну Модель.
- `DECLARATION_VALIDATED`: Дані перевірено на цілісність.
- `DECLARATION_SPLIT`: Router Engine розділив дані.
- `STORE_FACT_COMPLETED`: Записано в PostgreSQL.
- `STORE_GRAPH_COMPLETED`: Створено зв'язки в Graph DB.
- `STORE_SEARCH_COMPLETED`: Документи проіндексовані в OpenSearch.
- `STORE_VECTOR_COMPLETED`: Ембедінги створені та записані в Qdrant.
- `DECLARATION_FULLY_ASSIMILATED`: Усі компоненти підтвердили збереження (Агрегований стан з Redis).

## 5. Стратегія Розвитку
1. Відпрацювати шлях ОДНОГО рядка.
2. Гарантувати транзакційність або механізм retry при failed event.
3. Масштабувати на тисячі подій на секунду після стабілізації архітектури розщеплення.
