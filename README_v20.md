
# 🧠 Predator Analytics

**Predator Analytics** — це AI-платформа для розумної аналітики даних (митниця, податки, реєстри, OSINT), побудована на:

- ETL → AI Brain → Self-Learning Loop
- Kubernetes + Helm + ArgoCD (**GitOps-only** підхід)
- Повній Observability (Prometheus / Grafana / Loki / (опц.) OTEL)
- SaaS-архітектурі з **multi-tenant**, білінгом та self-learning

> Актуальна стабільна версія: **v20.0 — Singularity Edition**  
> Наступна цільова версія: **v21.0 — LoRA Trainer & SaaS Hardening**

---

## 📊 1. Статус проєкту

- ✅ **v20.0 — Singularity Edition**  
  Pre-Prod / Prod-ready, орієнтовано на деплой на **NVIDIA / Oracle**.
- 🧠 **v21.0 — LoRA Trainer & SaaS Hardening**  
  Повністю спроєктовано, є детальний roadmap + TZ, готово до імплементації.
- 🏗 **v19.x — Predator_analytics_19 Bootstrap**  
  Історичний **bootstrap**-репо, з якого виріс поточний стек.

Докладна історія версій: дивись **[`CHANGELOG.md`](./CHANGELOG.md)**.

---

## 📚 2. Документація (як читати цей репозиторій)

Основні документи:

### Релізи

- `docs/RELEASE_NOTES_v20.0.md` — що саме вміє **v20.0 (Singularity Edition)**  
- `docs/RELEASE_NOTES_v21.0.md` — що планується у **v21.0 (LoRA Trainer & SaaS Hardening)**  

### Роадмап та технічні завдання

- `docs/ROADMAP_v21.0.md` — high-level roadmap для **v21.0**
- `docs/TZ_LoRA_Trainer_v1.0.md` — детальне **ТЗ на LoRA Trainer Job (v21.0)**

### Пре-прод / деплой / тести

- `docs/PREPROD_CHECKLIST.md` — покроковий чекліст перед деплоєм (**Pre-Prod / Prod**)
- `tests/smoke-admin.http` — **smoke-тести** для:
  - auth (Keycloak),
  - `council/run`,
  - `etl/upload` + `etl/imports/{id}`,
  - admin-ендпоінти (`api-usage`, `training-samples`),
  - `council/feedback`.

### Contributing / OSS-набір

- `CONTRIBUTING.md` — як правильно робити внесок
- `.github/ISSUE_TEMPLATE/*.md` — шаблони **Bug / Feature** issues
- `.github/PULL_REQUEST_TEMPLATE.md` — шаблон **Pull Request**
- `CHANGELOG.md` — історія версій і лінки на реліз-ноти

**Рекомендований порядок читання для нової людини:**

1. `README.md` (цей файл)
2. `CHANGELOG.md`
3. `docs/RELEASE_NOTES_v20.0.md`
4. `docs/PREPROD_CHECKLIST.md`
5. `tests/smoke-admin.http` — щоб руками “відчути” API
6. `docs/ROADMAP_v21.0.md` + `docs/TZ_LoRA_Trainer_v1.0.md` — щоб зрозуміти куди рухаємось далі

---

## 🏗 3. Архітектура (Mini Stack 2–6 + Admin UI)

### 3.1. Компоненти Mini Stack v20.0

**ETL (`ua-sources`)**

- `POST /etl/upload` — завантаження **XLSX/CSV**
- `GET /etl/imports/{id}` — статус імпорту

**AI Brain (`predator-brain`)**

- `POST /council/run` — основний **inference endpoint**
- `POST /council/feedback` — фідбек для **Self-Learning Loop**

**Security**

- **Keycloak** (JWT Bearer, `get_current_user()` + ролі)
- **Vault + ExternalSecrets**
- **TLS-ready Ingress** (готовність до production TLS)

**Observability**

- `/metrics` → Prometheus (RPS, latency, помилки)
- **Grafana**-дашборди (ETL, council, системні метрики)
- **Loki** — структуровані JSON-логи
- (опц.) **OTEL-трейсинг** (traces)

**Billing / Rate limiting / Audit**

- **Redis-based rate limiting** (429 при перевищенні)
- Таблиця `api_usage_events` (usage + billing + audit trail)
- Логування викликів:
  - `/council/run`
  - `/etl/upload`
  - `/etl/imports/{id}`

**Self-Learning Loop (v1)**

- Таблиця `brain_training_samples` для збереження Q/A-семплів
- Автоматичний логінг **успішних відповідей** AI Brain
- `training_export.py` → експорт позитивних семплів у JSONL:
  - `/data/datasets/brain/brain_dataset_*.jsonl`
- **CronJob `brain-trainer`**, який періодично генерує датасети

**Admin UI**

- `DashboardView` — основний дашборд (AI Brain + ETL статуси)
- `SettingsView` — керування feature flags та env:
  - `metrics`, `billing`, `rate-limit`, `brain-trainer`, `mac/nvidia/oracle`
- `AdminDashboard` — моніторинг:
  - `api_usage_events` (billing/audit)
  - `brain_training_samples` (self-learning)

> Деталі реалізації дивись у:  
> `docs/RELEASE_NOTES_v20.0.md`

### 3.2. Діаграма архітектури (TODO)

```text
[Клієнт/Адмін UI] → [Gateway/Ingress] → [predator-brain]
                             ↘→ [ua-sources → PostgreSQL]
                             ↘→ [Redis / rate limit]
                             ↘→ [Prometheus / Grafana / Loki]
                             ↘→ [Keycloak / Vault]
```

---

## 🌍 4. Середовища: mac / nvidia / oracle

Проєкт орієнтований на три типових середовища:

- 🖥 **mac** — локальна розробка (MacBook + Docker / minikube / k3s)
- 🧪 **nvidia** — lab-кластер з GPU (наприклад, NVIDIA 1080, 64GB RAM)
- ☁️ **oracle** — prod-like / prod (Oracle Kubernetes чи інший cloud K8s)

Конфігурація per env живе у:
- `k8s/argocd/envs/predator-mac.yaml`
- `k8s/argocd/envs/predator-nvidia.yaml`
- `k8s/argocd/envs/predator-oracle.yaml`

Через них керується, зокрема, вмикання:
- `brain-trainer` CronJob,
- майбутнього `lora-trainer` (v21.0),
- специфічних параметрів для mac / nvidia / oracle.

---

## ⚙️ 5. Quickstart (Dev, env = mac)

Нижче — концептуальний шлях. Конкретні команди залежать від твоєї docker-compose / Helm-конфігурації.

### 5.1. Передумови

На локальній машині бажано мати:
- Docker або локальний Kubernetes (minikube / k3d / k3s)
- `kubectl`, `helm`
- python 3.10+ / 3.11+
- node 18+ + npm / yarn
- VS Code / інший редактор + REST Client розширення (для `tests/smoke-admin.http`)

### 5.2. Старт стеку (умовно)

1. Підняти базові сервіси: PostgreSQL, Redis, Keycloak, Vault, MinIO тощо.
2. Запустити бекенд-сервіси:
   - `predator-brain`
   - `ua-sources`
3. Запустити фронтенд (Dashboard + Admin UI).
4. Переконатися, що всі сервіси доступні локально (mac env).

### 5.3. Smoke-тести (`tests/smoke-admin.http`)

1. Встанови розширення REST Client у VS Code.
2. Відкрий `tests/smoke-admin.http`.
3. Встанови `@env = mac` і підстав свої Keycloak креденшли.
4. По черзі виконай запити:
   - `login`
   - `council_run`
   - `etl_upload` + `etl_import_status`
   - `admin_api_usage`
   - `admin_training_samples`
   - `council_feedback_positive`

Якщо всі основні запити повертають очікувані 200/401/429 — стек живий і готовий до розробки.

---

## 🚀 6. Pre-Prod / Prod Flow (деплой v20.0)

Для деплою на **nvidia / oracle**:

1. Пройти `docs/PREPROD_CHECKLIST.md` крок за кроком.
2. Виконати `helm upgrade --install ...` або дати ArgoCD синхронізувати зміни.
3. Переконатися, що всі ArgoCD apps → **Healthy + Synced**.
4. Прогнати `tests/smoke-admin.http` проти відповідного env:
   - `@env = nvidia`
   - або `@env = oracle`
5. Перевірити:
   - метрики в Grafana,
   - логи в Loki,
   - нові записи в `api_usage_events` та `brain_training_samples`.

Якщо все зелено — **v20.0** вважається успішно задеплоєним.

---

## 🧭 7. Роадмап: v21.0 і далі

### v21.0 — LoRA Trainer & SaaS Hardening

Ключові елементи (див. також `docs/ROADMAP_v21.0.md` та `docs/TZ_LoRA_Trainer_v1.0.md`):

- **LoRA Trainer Job / CronJob**
  - Читає JSONL з `/data/datasets/brain/brain_dataset_*.jsonl`
  - Тренує LoRA-адаптер для базової моделі (наприклад, `llama3-8b`)
  - Зберігає адаптер у `/data/adapters/brain/{run_id_or_timestamp}/`
  - Логує запуск + метрики в таблицю `lora_training_runs`
- **SaaS Hardening**
  - `tenant_id` у JWT-клеймах та `api_usage_events`
  - Підготовка до планів `free / paid / enterprise`
  - Агрегації usage per tenant для білінгу та звітності
- **Admin UX 2.0**
  - Detail-модалка для `training_samples` (повний Q/A + metadata + кнопки positive/negative)
  - Кнопка “Export now” (REST-хук для ручного запуску експорту датасетів)
  - Фільтри / сортування в AdminDashboard (по tenant_id, label, exported, тощо)

### v22.0+ — Model Router / A/B Testing / DR

Кандидатні напрямки:

- **Model Router / A/B Testing**
  - Роутер між базовою моделлю та LoRA-адаптерами
  - A/B-тести (random / rules-based)
- **DR / Backup Policy**
  - Політики backup/restore для:
    - LoRA-адаптерів,
    - `lora_training_runs`,
    - конфігів моделей
- **Model Experiments UI**
  - Панель у адмінці: список адаптерів, метрики, статус (active/inactive), кнопка activate/deactivate.

Деталі майбутніх версій — у `CHANGELOG.md` + `docs/ROADMAP_v21.0.md`.

---

## 🤝 8. Внесок (Contributing)

Ми вітаємо будь-яку допомогу:
- 📝 виправлення багів
- ⚙️ покращення інфраструктури (Helm, ArgoCD, CI/CD)
- 🧪 тести
- 📚 документація

Перед першим внеском, будь ласка, прочитай:
- [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- шаблони issues у `.github/ISSUE_TEMPLATE/`
- шаблон PR у `.github/PULL_REQUEST_TEMPLATE.md`

Основні принципи:
- Описуй зміни у Pull Request (що, де, чому).
- По можливості, додавай/оновлюй:
  - `CHANGELOG.md`
  - `docs/RELEASE_NOTES_*.md`
  - тести (якщо змінюється логіка).

---

## 📄 9. Ліцензія

🔒 Ліцензія буде додана окремо (наприклад, MIT, Apache-2.0 або інша).  
Поки що вважай, що код приватний / умовно OSS, залежно від реального статусу проєкту.

---

## 💿 10. Статус

**Predator Analytics v20.0 (Singularity Edition)** — це вже реальний SaaS-продукт рівня enterprise, з:
- Mini Stack 2–6,
- Admin UI,
- Self-Learning Loop (v1),
- GitOps-only деплоєм,
- готовністю до LoRA self-improvement циклів у v21.0.

Ласкаво просимо в екосистему **Predator Analytics** 🧠🚀
