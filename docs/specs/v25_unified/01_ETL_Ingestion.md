# 01. ETL & Ingestion Domain Specification

## 1. Огляд
Цей модуль відповідає за отримання даних із зовнішніх джерел, їх парсинг, нормалізацію, валідацію та збереження у відповідних сховищах системи.

## 2. Джерела даних
*   **XLSX/CSV**: Основні структуровані файли.
*   **PDF**: Неструктуровані документи (потребують OCR/парсингу).
*   **Telegram**: Повідомлення та медіа з каналів/чатів (через Telethon).
*   **Web/OSINT**: Дані з веб-сторінок (Playwright/Scrapy).
*   **Публічні реєстри**: Дані з державних баз України (через API/дампи).

## 3. Компоненти
1.  **Upload Gateway**: Точка входу для файлів (REST API / UI Upload).
2.  **Ingestion Manager**: Оркестратор процесів завантаження.
3.  **File Registry**: База метаданих файлів (хеші, статуси, власники).
4.  **Parser Workers**: Воркери для специфічних форматів (Excel parser, PDF extractor).
5.  **Normalizer/Validator**: Приведення даних до канонічної схеми.
6.  **Dedup/Idempotency Engine**: Запобігання дублям.

## 4. Потік даних (XLSX/CSV End-to-End)

```mermaid
sequenceDiagram
  participant U as User/UI
  participant ING as Ingestion API
  participant Q as Queue (Redis/Rabbit)
  participant W as Worker
  participant PG as PostgreSQL
  participant OS as OpenSearch
  participant QD as Qdrant
  participant UI as Nexus Core UI

  U->>ING: Upload file + metadata
  ING->>PG: Create File Registry record (Status: PENDING)
  ING->>Q: Enqueue parse job
  ING-->>U: 202 Accepted

  Q->>W: Dispatch job
  W->>W: Parse File -> Normalize Data -> Validate Schema
  
  par Storage Operations
    W->>PG: Upsert normalized tables (Data Lake)
    W->>OS: Index documents (Search Index)
    W->>QD: Upsert vectors (Embeddings)
  end
  
  W->>PG: Update job status (DONE)
  UI->>PG: Poll status
  UI-->>U: Show completion + Links to reports
```

## 5. Implementation Blueprints

### Directory Structure
```
backend/
  src/
    ingestion/
      parsers/
        excel.py
        pdf.py
      processors/
        normalizer.py
        deduplicator.py
      router.py
```

### Helm / Configs
*   **Queue**: Використовувати черги з dead-letter exchange для фейлів.
*   **Resources**: Воркери потребують більше CPU для PDF/OCR.
*   **Storage**: Великі файли вантажити в S3 (MinIO), в базу — посилання.
