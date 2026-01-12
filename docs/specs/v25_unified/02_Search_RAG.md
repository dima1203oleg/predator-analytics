# 02. Search & RAG Specification

## 1. Огляд
Модуль відповідає за індексацію даних, виконання пошукових запитів (текстових і векторних) та генерацію відповідей з використанням LLM (RAG).

## 2. Сховища (Storage Domain)
*   **PostgreSQL/Timescale**: "Джерело істини". Зберігає сирі нормалізовані дані, зв'язки, метадані, історію аудитів.
*   **MinIO**: Об'єктне сховище для оригіналів файлів (artifacts).
*   **Redis**: Кешування гарячих запитів, сесій користувачів, черги задач.
*   **OpenSearch**:
    *   Full-text search (BM25).
    *   Агрегації для аналітики.
    *   ILM (Index Lifecycle Management) для ротації логів/даних.
*   **Qdrant**: Векторна база даних (Vector DB) для семантичного пошуку.

## 3. Search & RAG Architecture
*   **Hybrid Search Router**:
    *   Приймає запит користувача.
    *   Робить паралельний запит у OpenSearch (keyword match).
    *   Робить паралельний запит у Qdrant (embedding match).
    *   **Reranker**: Комбінує результати, ранжує їх за релевантністю (Cross-Encoder модель).
*   **RAG Orchestrator**:
    *   Формує контекст для LLM з відібраних чанків даних.
    *   Керує довжиною контексту (Context Window management).
*   **Answer Compiler**:
    *   Генерує фінальну відповідь.
    *   Додає посилання на джерела (XAI).
    *   Форматує у Markdown/PDF звіти.

## 4. Алгоритм Hybrid Search + RAG

1.  **User Query** -> `Search API`.
2.  **Query Expansion** (опційно): LLM переписує запит для кращого пошуку.
3.  **Retrieval**:
    *   `OpenSearch`: пошук по ключовим словам, фільтри по датах/метаданих.
    *   `Qdrant`: пошук по векторах (dense retrieval).
4.  **Reranking**: Сортування об'єднаного списку результатів (Score Fusion).
5.  **Generation**:
    *   Топ-N чанків подаються в промпт LLM.
    *   LLM генерує відповідь з цитуванням.
6.  **Response**: Повернення відповіді користувачеві.

## 5. Implementation Blueprints

### Directory Structure
```
backend/
  src/
    search/
      engines/
        opensearch_client.py
        qdrant_client.py
      reranking/
        cross_encoder.py
      rag/
        context_builder.py
        generator.py
```

### Configs
*   **Embeddings**: `all-MiniLM-L6-v2` або `text-embedding-3-small` (якщо external).
*   **Reranker**: `ms-marco-MiniLM-L-6-v2` (локально).
*   **Qdrant Collection**: налаштувати metrics (Cosine/DotProduct) відповідно до моделі.
