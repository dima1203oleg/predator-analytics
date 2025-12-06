# Технічне Завдання: Платформа Семантичного Пошуку та Аналітики Даних (Predator Analytics v21.0)

**Версія:** 21.0.0 (Extended)  
**Дата:** 2025-12-06  
**Статус:** Затверджено до реалізації

---

## 1. Вступ та Цілі Проекту

Цей документ є повним, розширеним Технічним Завданням (ТЗ) на розробку платформи **Predator Analytics**. Система призначена для глибокого семантичного пошуку, моніторингу та аналітики великих масивів даних (Prozorro, EDR, News, Corporate Data) з використанням технологій штучного інтелекту (LLM, Embeddings).

### 1.1 Бізнес-цілі
1.  **Монетизація:** Створення продукту з моделлю підписки (Freemium/Pro/Enterprise).
2.  **Утримання клієнтів:** Забезпечення найкращого UX на ринку завдяки швидкості та релевантності пошуку.
3.  **Гнучкість:** Можливість швидкого підключення нових джерел даних (Notion, Slack, Google Drive).

### 1.2 Технічні цілі
1.  **Продуктивність:** Пошук < 500мс (P95), обробка 10K+ документів/годину.
2.  **Якість пошуку:** Recall > 90%, Precision > 80% завдяки гібридному підходу (Keyword + Vector + Reranking).
3.  **Відмовостійкість:** SLA 99.9%, Zero Downtime Deployments.
4.  **Масштабованість:** Горизонтальне масштабування компонентів через HPA в Kubernetes.

---

## 2. Архітектура Системи

Система побудована на базі мікросервісної архітектури, керованої подіями (Event-Driven), з чітким розділенням на шари.

### 2.1 Високорівнева схема (Mermaid)

```mermaid
flowchart TD
    subgraph Clients["Клієнти"]
        Web[Web UI (React)]
        Mobile[Mobile App (Future)]
        ExtAPI[External Integrations]
    end

    subgraph LB["Load Balancer / Ingress"]
        Traefik[Traefik Ingress]
    end

    subgraph Backend["Backend Layer"]
        API[FastAPI Gateway]
        Auth[Auth Service (JWT/OAuth)]
    end

    subgraph AI_ML["AI & ML Layer"]
        Rerank[Reranker Service (Cross-Encoder)]
        Summ[Summarizer (T5/BART)]
        Embed[Embedding Service (Sentence-BERT)]
    end

    subgraph DataPlane["Data & Search Layer"]
        PG[(PostgreSQL - Gold/Staging)]
        OS[(OpenSearch - Text)]
        QD[(Qdrant - Vectors)]
        Redis[(Redis - Cache/Queue)]
        MinIO[(MinIO - Blob Storage)]
    end

    subgraph Agents["Background Agents"]
        Parser[Parser Agent (Celery)]
        Processor[Processor Agent (Cleaning)]
        Indexer[Indexer Agent]
    end

    Clients --> LB
    LB --> API
    API --> Auth
    API --> Redis
    API --> PG
    API --> OS
    API --> QD
    API --> Rerank

    Parser --> Redis
    Parser --> MinIO
    Processor --> PG
    Indexer --> Embed
    Indexer --> OS
    Indexer --> QD
```

---

## 3. Компоненти Платформи

### 3.1 Frontend (Web UI)
*   **Технології:** React.js, TypeScript, Material-UI (MUI), Redux Toolkit.
*   **Функції:**
    *   Гібридний пошуковий рядок з автодоповненням.
    *   Візуалізація зв'язків (Graph View).
    *   Особистий кабінет (історія, обране, налаштування алерів).
    *   **Dashboard:** Інтегровані віджети з OpenSearch Dashboard для аналітики.
*   **Вимоги доступності:** WCAG 2.1 AA (контрастність, навігація клавіатурою).

### 3.2 Backend API
*   **Технології:** Python 3.11, FastAPI, Pydantic, SQLAlchemy, AsyncPG.
*   **Роль:** Оркестрація запитів, бізнес-логіка, агрегація результатів пошуку.
*   **Безпека:** Rate Limiting (100 req/min free, 1000 req/min pro), Validation, Security Headers.

### 3.3 ML & Search Services (Advanced)
*   **Embedding Service:** Генерує вектори (384/768 dim) з тексту. Модель: `all-MiniLM-L6-v2` або `multilingual-e5`.
*   **Reranker:** Покращує релевантність. Переранжовує ТОП-50 кандидатів від OpenSearch/Qdrant. Модель: `cross-encoder/ms-marco-MiniLM-L-6-v2`.
*   **Summarizer:** Генерує стислий зміст довгих документів. Модель: `facebook/bart-large-cnn` або OpenAI API.

### 3.4 Background Agents (ETL)
*   **Parser (Sherlock):** Збір даних (Web scraping, API polling). Підтримка OAuth для Google Drive/Notion.
*   **Processor (Watson):** Очищення, нормалізація, NER (виділення імен, компаній), анонімізація PII.
*   **Indexer (Moriarty):** Асинхронна індексація. Стратегія "Near Real-Time".

### 3.5 Storage Layer
*   **PostgreSQL:**
    *   `staging`: Сирі дані, логи помилок.
    *   `gold`: Чисті дані, користувачі, підписки.
*   **OpenSearch:** Повнотекстовий пошук, фасетна навігація, логи системи.
    *   **OpenSearch Dashboard:** Використовується для внутрішнього моніторингу пошукових метрик та візуалізації даних.
*   **Qdrant:** Векторний пошук (HNSW індекс).
*   **MinIO:** Зберігання оригіналів файлів (PDF, DOCX) та бекапів.

---

## 4. Потоки Даних (Data Flow)

### 4.1 ETL Pipeline (Ingest -> Index)
1.  **Ingest:** Parser отримує дані -> перевіряє хеш (дедуплікація) -> зберігає в `staging` + MinIO.
2.  **Queue:** Подія `new_raw_data` відправляється в RabbitMQ/Redis.
3.  **Process:** Processor вичитує подію -> чистить текст -> витягує метадані -> зберігає в `gold`.
4.  **Index:** Indexer отримує `gold` документ -> генерує вектор (Embedding Service) -> пише в Qdrant + OpenSearch.

### 4.2 Search Pipeline (Hybrid with Reranking)
1.  **Query:** Користувач вводить запит "Корупція в будівництві 2024".
2.  **Parallel Search:**
    *   *Text:* OpenSearch (BM25) шукає за ключовими словами -> повертає ТОП-100.
    *   *Vector:* Qdrant (Cosine) шукає за сенсом -> повертає ТОП-100.
3.  **Merge:** Об'єднання результатів (Weighted Fuse: 0.3 vector + 0.7 text).
4.  **Rerank:** Reranker оцінює релевантність об'єднаного списку -> формує фінальний ТОП-20.
5.  **Enrich:** Backend додає сніпети, хайлайти та метадані з Postgres.
6.  **Response:** JSON відповідь фронтенду.

---

## 5. Інтеграції з зовнішніми сервісами

| Сервіс | Тип інтеграції | Призначення | Реалізація |
|--------|----------------|-------------|------------|
| **Notion** | OAuth + API | Експорт звітів, імпорт Knowledge Base. | `NotionClient` в Backend. |
| **Slack** | Webhook / Bot | Альоти про нові тендери/новини. | Celery Task -> Slack API. |
| **Google Drive** | OAuth + API | Індексація корпоративних документів. | Спеціальний Parser модуль. |

---

## 6. Інфраструктура та DevOps

### 6.1 Середовища (Environment Matrix)
*   **Local (Mac):** Docker Compose (Full stack emulation).
*   **Dev (Oracle):** K3s Cluster, Helm Values (Resource constraints).
*   **Prod (Server):** K3s Cluster (HA), MetalLB, Dedicated Storage.

### 6.2 CI/CD (GitHub Actions)
*   **CI:** Lint -> Unit Tests -> Build Docker Images -> Vulnerability Scan (Trivy) -> Push to GHCR.
*   **CD:** Update Helm Values (GitOps repo) -> ArgoCD Sync -> Deploy to Cluster.

### 6.3 Backup & Disaster Recovery
*   **Backup:**
    *   PostgreSQL: `pg_dump` щоночі в S3/MinIO.
    *   OpenSearch: Snapshots в S3/MinIO.
    *   etcd (K8s): Щоденний снепшот.
*   **RPO (Recovery Point Objective):** 24 години (для MVP), 1 година (Target).
*   **RTO (Recovery Time Objective):** 4 години.
*   **Zero Downtime:** Rolling Updates для Deployment стратегії.

---

## 7. Моніторинг та Observability

### 7.1 Інструменти
*   **Metrics:** Prometheus (scraping кожні 15s).
*   **Visualization:** Grafana (Dashboards: "Predator Overview", "Search Quality", "Infrastructure").
*   **Logs:** Fluent Bit -> OpenSearch -> OpenSearch Dashboard.
*   **Tracing:** Jaeger (опціонально для налагодження повільних запитів).

### 7.2 Ключові метрики (SLIs)
*   **Latency:** Час відповіді `/search`.
*   **Saturation:** % використання CPU/RAM нодами.
*   **Traffic:** RPS (Requests per Second).
*   **Errors:** % 5xx відповідей.

---

## 8. Безпека

1.  **Шифрування:**
    *   TLS 1.3 для всіх зовнішніх з'єднань (Ingress).
    *   Шифрування дисків (LUKS) на серверах.
2.  **Автентифікація:**
    *   JWT Tokens (Access: 15min, Refresh: 7days).
    *   OAuth2 (Google, GitHub login).
3.  **Compliance:**
    *   Підготовка до GDPR (право на забуття, експорт даних).
    *   OWASP Top 10 захист на рівні коду та WAF.

---

## 9. План Реалізації (Roadmap)

### Phase 1: Foundation (✅ Completed)
*   Core Backend API.
*   Basic ETL (Csv/Json).
*   Infrastructure as Code (Helm/Make).
*   Basic Search (OpenSearch).

### Phase 2: Intelligence (🚧 Current)
*   Hybrid Search (OpenSearch + Qdrant).
*   Auth Module integration.
*   Monitoring Setup (Prometheus/Grafana).

### Phase 3: Expansion (Planned Q1 2026)
*   Reranker & Summarizer Integration.
*   External Integrations (Slack/Notion).
*   Billing & Subscriptions.

### Phase 4: Enterprise (Planned Q2 2026)
*   Multi-tenant support.
*   Advanced RBAC.
*   Auditing & Compliance certifications.

---

## 10. Фінансові Метрики та SLA

### 10.1 SLA (Service Level Agreement)
| Показник | Gold Plan | Enterprise Plan |
|----------|-----------|-----------------|
| Uptime | 99.5% | 99.9% |
| Support Response | 24 год | 1 год |
| RPO | 24 год | 1 год |

### 10.2 Оцінка вартості інфраструктури (Monthly)
| Ресурс | Опис | Орієнтовна вартість |
|--------|------|---------------------|
| Server (Bare Metal) | 64GB RAM, 16 Core, 2TB NVMe | $80 - $120 |
| Backup Storage | S3 Standard (1TB) | ~$25 |
| Domain/SSL | Cloudflare Pro | $20 |
| **Total** | | **~$150 / міс** |

---

*Документ затверджено: Tech Lead / Architect*
