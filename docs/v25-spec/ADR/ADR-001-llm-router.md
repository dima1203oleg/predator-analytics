# ADR-001: Вибір LLM Router Architecture

**Статус:** Прийнято
**Дата:** 10.01.2026
**Автор:** Chief Architect

---

## Контекст

Система потребує інтеграції з кількома LLM провайдерами для забезпечення:
- Високої доступності (fallback)
- Оптимізації витрат
- Можливості offline роботи

## Розглянуті Варіанти

### Варіант A: Прямі виклики до кожного LLM

```
Application → Groq API
           → Gemini API
           → Ollama (local)
```

**Плюси:**
- Простота реалізації
- Менше залежностей

**Мінуси:**
- Дублювання логіки fallback
- Складність управління API keys
- Немає уніфікованого інтерфейсу

### Варіант B: LiteLLM Gateway (Обрано ✅)

```
Application → LiteLLM Gateway → Groq (Primary)
                              → Gemini (Fallback)
                              → Ollama (Offline)
```

**Плюси:**
- ✅ Уніфікований OpenAI-compatible API
- ✅ Вбудований fallback та retry
- ✅ Rate limiting та caching
- ✅ Observability (metrics, logging)
- ✅ Cost tracking

**Мінуси:**
- Додатковий hop (мінімальна latency)
- Ще одна система для підтримки

### Варіант C: LangChain Router

**Плюси:**
- Потужна екосистема
- Chains та agents

**Мінуси:**
- Overhead для простих задач
- Версійна нестабільність

## Рішення

Обрано **Варіант B: LiteLLM Gateway** через:

1. **Уніфікованість** — один інтерфейс для 100+ LLM моделей
2. **Production-ready** — battle-tested, active development
3. **Нативна підтримка fallback** — автоматичне переключення
4. **Observability** — Prometheus metrics з коробки

## Наслідки

- Всі LLM виклики йдуть через LiteLLM endpoint
- Конфігурація моделей в `litellm_config.yaml`
- Fallback order: Groq → Gemini → Ollama
- Rate limits налаштовуються централізовано

## Код

```yaml
# configs/litellm_config.yaml
model_list:
  - model_name: fast
    litellm_params:
      model: groq/llama-3.1-8b-instant
      api_key: os.environ/GROQ_API_KEY
    model_info:
      max_tokens: 8192

  - model_name: fast
    litellm_params:
      model: gemini/gemini-1.5-flash
      api_key: os.environ/GEMINI_API_KEY

  - model_name: fast
    litellm_params:
      model: ollama/llama3.1
      api_base: http://ollama:11434

router_settings:
  routing_strategy: simple-shuffle
  num_retries: 3
  timeout: 60
```

---

## Зв'язки

- [ADR-002: Hybrid Search Architecture](./ADR-002-hybrid-search.md)
- [MASTER_SPEC_v45.md](../MASTER_SPEC_v45.md)
