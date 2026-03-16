# Аудит PREDATOR Analytics v55.2-SM

## Зміст
- [1. Виконавчий підсумок](#1-Виконавчий-підсумок)
- [2. Перевірка HR-правил](#2-Перевірка-HR-правил)
- [3. Архітектурний аудит (18 пунктів)](#3-Архітектурний-аудит-18-пунктів)
- [4. Стан даних та відсутність моків](#4-Стан-даних-та-відсутність-моків)
- [5. Інвентар тестів і покриття](#5-Інвентар-тестів-і-покриття)
- [6. Пріоритетні розриви та ризики](#6-Пріоритетні-розриви-та-ризики)
- [7. Рекомендації та план виправлень](#7-Рекомендації-та-план-виправлень)

## 1. Виконавчий підсумок
- Статус: _у процесі аудиту v55.2-SM_
- Ключові знахідки: _TBD після прогону тестів_
- Блокери продакшну: _TBD_

## 2. Перевірка HR-правил
| Код | Опис | Перевірка | Статус | Нотатки |
|-----|------|-----------|--------|---------|
| HR-01 | Python 3.12 тільки | mypy/pytest target-version=py312 | TODO | |
| HR-02 | Mypy strict, без Any | mypy strict (mypy.ini) | TODO | |
| HR-03/HR-04 | Док/коменти/UI лише українською | Локалізаційний лінт + візуальна вибірка | TODO | |
| HR-05 | Docker multi-stage, USER predator | Огляд Dockerfile (backend/frontend) | TODO | |
| HR-06 | Відсутність секретів у коді | Trivy fs + secret-scan | TODO | |
| HR-07 | Немає SELECT * | Ruff rule + grep | TODO | |
| HR-08 | Ресурсні ліміти подів | Kyverno/Helm charts | TODO | |
| HR-09 | Кожна зміна з тестами | CI coverage gate | TODO | |
| HR-10 | UI порт 3030, mock 9080 | docker-compose.frontend.yml / mock-api-server.mjs | TODO | |
| HR-12 | Ruff | ruff check | TODO | |
| HR-13 | Формат коміту | Git hook/ручна перевірка | TODO | |
| HR-14 | Залежності < 1 року | safety/pip + npm audit | TODO | |
| HR-15 | Без SaaS | Code review | TODO | |
| HR-16 | WORM без UPDATE/DELETE | init.sql тригери, інтеграційний тест | TODO | |
| HR-17 | Без деплою без CI/CD | Політика/ArgoCD | TODO | |
| HR-18 | Нема прямого доступу до prod DB | Політика/сікрети | TODO | |
| HR-19 | Заборона одночасно STT+LLM на GPU | GPU guard тест | TODO | |
| HR-20 | Без англійських лейблів у UI | Локалізаційний скан UI | TODO | |

## 3. Архітектурний аудит (18 пунктів)
Шаблон оцінки: _стан_, _докази/посилання_, _ризик_, _дії/ETA_.
1. Репозиторій/структура — перевірка проти v55.2; дублікати сервісів/мертвий код.
2. Фронтенд (70+ в’ю, 270+ компонентів) — маршрути, залежності, стан, i18n, реальні джерела даних.
3. API (19 роутерів, OpenAPI) — контракти, схеми, помилки, SSE/WS.
4. Пайплайни інгестії/ETL — шляхи файлів, валідація, фічі, індексація.
5. Kafka топіки/групи/DLQ — retry/ідемпотентність, споживачі.
6. Бази/схеми (PG/CH/Neo4j/OS/Qdrant/Redis/MinIO) — індекси, RLS, WORM.
7. ML моделі/версії/дрейф — регресійні тести проти еталонів.
8. Графова аналітика — UEID резолюція, центральність, запити.
9. OSINT інтеграції — SpiderFoot/Amass/Sherlock/Maigret/Twint/Instaloader.
10. CI/CD — GH Actions, Helm, ArgoCD, GitOps синхрони.
11. Kubernetes — мережеві політики, HPA, секрети, ресурси.
12. Спостережуваність — Prometheus/Grafana/Loki/Alertmanager.
13. Тести — pytest/vitest/playwright/k6/chaos/security.
14. Безпека — Keycloak/RBAC/RLS/secret mgmt, ZAP/bandit/safety/npm audit.
15. Джерела даних/реєстри — YASeeker, завантаження, OSINT файли.
16. Неповні фічі/моки — виявити та вимкнути.
17. Продуктивність — API p95, бандл UI, GPU/DB гарячі точки.
18. Production readiness — зведення по PRODUCTION_CERTIFICATION.

## 4. Стан даних та відсутність моків
- Виявлені мок-джерела (UI): _TODO після сканування src/**/*mock*.ts, fixtures_
- Виявлені мок-джерела (API): _TODO ingestion stubs/фейкові джерела_
- План відключення: перевести на реальні ендпоїнти /api/v1... та джерела Kafka/OpenSearch/Neo4j.

## 5. Інвентар тестів і покриття
- Backend (pytest): services/core-api/tests (health/metrics) — план розширення: ingestion, risk, graph, osint, wrom/rls.
- Frontend (vitest/playwright): src/__tests__, features/*/__tests__, e2e/ — перевірити джерела даних, i18n, realtime.
- Навантаження/chaos: tests/load, k6 сценарії, chaos scripts (pod kill, Kafka down, partition, disk full).
- Security: bandit, safety (pip), npm audit, Trivy fs, ZAP baseline.

## 6. Пріоритетні розриви та ризики
- P0: Моки/заглушки у production шляхах; відсутність критичних тестів інгестії/OSINT/graph; незахищені секрети.
- P1: Низьке покриття pytest/vitest; відсутність перф/chaos/security прогонів; неперевірені GPU guard (HR-19).
- P2: Оптимізація бандлів UI, індексів БД, регресії ML/дрейф.

## 7. Рекомендації та план виправлень
- Короткострокові (≤24h): запустити ruff/mypy/pytest; інвентар моків; перевірити Dockerfile USER predator; додати тести health/metrics/ingestion happy-path.
- Середньострокові (≤1 тиждень): покрити ingestion I1–I5, OSINT інтеграції, graph/Neo4j, risk/CERS; підготувати k6 + Lighthouse; security скани (bandit/safety/npm audit/Trivy/ZAP).
- Довгострокові (>1 тиждень): дрейф/ML регресії, autoscaling/HPA тюнінг, оптимізація бандлів, повний chaos suite, DR тести.
