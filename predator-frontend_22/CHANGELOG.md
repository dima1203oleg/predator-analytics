
# 📜 CHANGELOG — Predator Analytics

Формат:  
- Версії нумеруються як `vMajor.Minor.Patch`.
- Нові релізи додаються **вгору** списку.

---

## [v21.0] — LoRA Trainer & SaaS Hardening (planned)

**Статус:** Planning / In Development  
**Фокус:** Self-Learning Loop Completion + External Integrations

### Основні зміни

- **LoRA Trainer Pipeline**
  - Job/CronJob для автоматичного донавчання.
  - **Backends:**
    - `hf-peft` (Native): Локальне тренування на GPU кластера.
    - `h2o` (External): Делегування тренування в **H2O LLM Studio**.
  - **Artifacts:** Експорт адаптерів для:
    - **Ollama** (авто-генерація Modelfile).
    - **LM Studio** (підготовка до GGUF).
  - **Tracking:** Таблиця `lora_training_runs` з підтримкою external run IDs.

- **SaaS Hardening**
  - Tenant ID у всіх логах та білінг-подіях.
  - Тарифні плани та квоти.

- **Admin UX 2.0**
  - Розширені модалки для перегляду Q/A семплів.
  - Ручний запуск експорту та тренування.

---

## [v20.0] — Singularity Edition (released)

**Статус:** Stable  
**Основні фічі:**
- Mini Stack 2–6 (ETL + AI Brain).
- Security (Keycloak, Vault).
- Observability (Prometheus, Grafana, Loki).
- Self-Learning Loop v1 (Data Collection).

---

## [v22.0+] — Unreleased / Future

**Плани:**
- **Model Router / A/B Testing:**
  - Динамічний роутинг між Ollama, LM Studio, H2O та Cloud-провайдерами.
  - A/B тестування промптів та моделей.
- **Advanced Synthetic Data:**
  - Генерація синтетичних даних через H2O/SDV для пре-тренування.
- **Model Experiments UI:**
  - Візуальне порівняння метрик різних LoRA-ранів (Native vs H2O).
