
# 📋 Технічне Завдання: LoRA Trainer Job v1.0

Версія: 1.1 (Extended Ecosystem Support)  
Статус: Ready for Implementation

---

## 1. Мета

Реалізувати **окремий Job/CronJob**, який:

1. Читає навчальні дані з JSONL-файлів, згенерованих Self-Learning Loop (`training_export.py`).
2. Запускає LoRA-файнтюнінг базової LLM-моделі.
   - Підтримує **локальне тренування** (HuggingFace/PEFT).
   - Підтримує **делегування в H2O LLM Studio** (через API).
3. Зберігає артефакти (LoRA-адаптер) та метрики.
4. Логує інформацію про запуск у таблицю `lora_training_runs`.
5. Експортує результати для inference-бекендів: **Ollama** та **LM Studio**.

---

## 2. Контекст і залежності

### 2.1. Інфраструктура v20.0
- **БД:** `brain_training_samples`.
- **Експорт:** JSONL у `/data/datasets/brain`.

### 2.2. Інтеграційні точки (v21.0 Extended)
- **Local Native:** HuggingFace `peft` + `transformers` (default).
- **External Training:** **H2O LLM Studio** (через REST API/Webhook).
- **Inference Targets:**
  - **Ollama:** Автоматична генерація `Modelfile`.
  - **LM Studio:** Експорт адаптерів у GGUF-сумісному форматі або інструкції для завантаження.

---

## 3. Функціональні вимоги

### 3.1. Конфігурація (ENV)

Додаються параметри для вибору бекенду та цілей експорту:

```bash
# Backend Selection
TRAINING_BACKEND="hf-peft" # або "h2o"

# Native Settings (HF/PEFT)
BASE_MODEL_NAME="llama3-8b"
LORA_RANK="8"
TRAIN_EPOCHS="3"

# H2O Settings (використовуються, якщо TRAINING_BACKEND="h2o")
H2O_API_URL="https://h2o-llm.internal"
H2O_API_KEY="secret-key-from-vault"

# Artifact Export
EXPORT_TARGETS="ollama,lmstudio" # список цілей через кому
```

### 3.2. Логіка роботи (Pipeline)

1. **Discovery & Prep:**
   - Пошук `brain_dataset_*.jsonl` у `/data/datasets/brain`.
   - Валідація JSONL та мердж у єдиний тренувальний файл.

2. **Training Execution:**
   - **Scenario A (Native `hf-peft`):**
     - Завантаження базової моделі.
     - Запуск `SFTTrainer` (HuggingFace).
     - Збереження адаптера локально в `/data/adapters/brain/{run_id}/`.
   - **Scenario B (H2O LLM Studio):**
     - Відправка JSONL-датасету на H2O API (`POST /api/datasets`).
     - Створення експерименту (`POST /api/experiments`) з конфігурацією LoRA.
     - Поллінг статусу (`GET /api/experiments/{id}`).
     - Після завершення: завантаження бінарників адаптера (`GET /api/experiments/{id}/download`).

3. **Post-Processing (Export):**
   - **LM Studio:**
     - Переконатися, що адаптер збережено у форматі, який LM Studio може підтягнути (або конвертація у GGUF через `llama.cpp` скрипт, якщо ресурси дозволяють).
     - Створити мета-файл `lmstudio_config.json`.
   - **Ollama:**
     - Згенерувати файл `Modelfile`, який базується на `FROM {BASE_MODEL}` та `ADAPTER {path_to_adapter}`.
     - (Опційно) Виконати команду `ollama create predator-v21:{run_id} -f Modelfile` через API Ollama.

4. **Logging:**
   - Запис у `lora_training_runs` із зазначенням `backend` ('hf-peft'/'h2o') та `external_run_id` (для H2O).

---

## 4. Схема БД: lora_training_runs (Extended)

```sql
CREATE TABLE IF NOT EXISTS lora_training_runs (
    id              BIGSERIAL PRIMARY KEY,
    dataset_paths   TEXT[] NOT NULL,
    base_model      TEXT NOT NULL,
    adapter_path    TEXT,
    
    -- Execution Context
    backend         TEXT NOT NULL DEFAULT 'hf-peft', -- 'hf-peft' | 'h2o'
    external_run_id TEXT,                            -- ID експерименту в H2O
    
    metrics         JSONB NOT NULL DEFAULT '{}'::jsonb, -- loss, accuracy, etc.
    status          TEXT NOT NULL,                      -- 'RUNNING', 'COMPLETED', 'FAILED'
    error_message   TEXT,
    
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 5. Архітектура модуля `app/lora_trainer/`

- `trainer_native.py` — логіка `peft`/`transformers`.
- `trainer_h2o.py` — клієнт для H2O LLM Studio API.
- `exporters.py` — логіка генерації `Modelfile` та підготовки для LM Studio.
- `run_trainer.py` — Entrypoint, читає ENV та вибирає стратегію.

---

## 6. Helm & Resources

- Для `hf-peft` режиму критична наявність GPU (NVIDIA node selector).
- Для `h2o` режиму Job працює як легковаговий клієнт (можна запускати на CPU, потрібен лише доступ до мережі).

---

## 7. Definition of Done

1. Job успішно тренує модель локально ("hf-peft").
2. Job успішно делегує тренування в H2O (якщо налаштовано `TRAINING_BACKEND="h2o"`).
3. Артефакти (адаптер) коректно зберігаються на PVC.
4. Автоматично генерується `Modelfile` для Ollama.
5. Адмін бачить статус "Remote Training (H2O)" у дашборді.
