# 03. LLM, Agents & MLOps Specification

## 1. Огляд
Модуль охоплює роботу з великими мовними моделями, мульти-агентну систему (MAS) та процеси безперервного покращення якості (Self-Learning/MLOps).

## 2. LLM / Multi-Agent System (MAS)
### Система моделей
*   **Model Router / Provider Drum**: Логіка вибору моделі під задачу (швидкість vs вартість vs якість).
*   **Режими роботи**:
    *   **Local-first**: Ollama (Llama 3, Mistral, Gemma) — для базових задач, приватності.
    *   **External APIs**: GPT-4o, Claude 3.5, Gemini, DeepSeek — для складних міркувань ("піки якості").

### Агенти (Ролі)
1.  **Orchestrator/Arbiter**: Розподіляє задачі, зводить результати.
2.  **Retriever/Searcher**: Шукає інформацію в базі знань.
3.  **Analyst**: Аналізує дані, робить висновки.
4.  **RedTeam**: Критикує відповіді, шукає помилки/галюцинації.
5.  **Synthesizer**: Генерує фінальний звіт.
6.  **DatasetInspector**: Перевіряє якість даних для донавчання.
7.  **LoRATrainer**: Керує процесом донавчання.

## 3. MLOps & Self-Improvement Loop (♾️)

### Інструменти
*   **MLflow**: Трекінг експериментів, реєстр моделей.
*   **DVC (Data Version Control)**: Версіонування датасетів.
*   **H2O / AutoML**: Для табличних ML задач (класифікація/регресія).
*   **Evaluation Harness**: Фреймворк для автоматичної оцінки якості відповідей LLM.

### Цикл самовдосконалення (Self-Improvement Loop)
1.  **Collection**: Збір слабких кейсів (low feedback score, red team flags).
2.  **Dataset Prep**: `DatasetInspector` чистить і розмічає дані.
3.  **Augmentation**: `SyntheticDataAgent` генерує подібні приклади для балансу.
4.  **Training**: `LoRATrainer` запускає fine-tuning (LoRA/QLoRA) локальної моделі.
5.  **Evaluation**: Порівняння нової моделі з базовою (win-rate).
6.  **Deployment**:
    *   **Canary**: Викотка на 5-10% трафіку.
    *   **Rollback**: Авто-відкат, якщо метрики впали.

## 4. Implementation Blueprints

### Directory Structure
```
backend/
  src/
    agents/
      definitions/
        analyst.yaml
        arbiter.yaml
      orchestrator.py
    mlops/
      training/
        lora_train.py
      evaluation/
        rubric.py
```

### Pipelines (K8s)
*   Використовувати **K8s Jobs** для тренування (GPU required).
*   Job має монтувати PVC з датасетом і кешем HuggingFace.
*   MLflow сервер має бути доступний всередині кластера для логування метрик.
