# 🚀 PREDATOR Analytics API Routing, Models & Fallback Інструкція

Цей документ описує конфігурацію роутингу, використання ключів API та інтеграцію моделей в Antigravity UI.

## 1. 🔑 Налаштування API ключів
Дані API ключів для сервісів (Gemini, Mistral) налаштовані та прокинуті у роутер.
Вони розташовані в `.env` файлі:
`deploy/litellm/.env`

Конфігураційний файл `deploy/litellm/config-antigravity.yaml` зчитує ці змінні і призначає їх для відповідних груп.

## 2. ⚙️ Інтеграція моделей в Antigravity UI

Для того, щоб перемикатися між 4 різними "характерами" і швидкостями (швидкий, кодинг, логіка, чат), потрібно додати їх у налаштування `Antigravity` в VS Code.

Перейдіть в **VS Code Settings** -> **Extensions** -> **Antigravity** (або натисніть іконку налаштувань у боковій панелі Antigravity). Додайте **4 Custom Models** (OpenAI compatible):

### Модель 1: Fast (Gemini Flash)
- **Base URL:** `http://localhost:4000/v1`
- **API Key:** `sk-antigravity-master-2026`
- **Model ID:** `ultra-router-fast`
- **Name:** `Ultra Router - Fast`

### Модель 2: Coding (Mistral Codestral)
- **Base URL:** `http://localhost:4000/v1`
- **API Key:** `sk-antigravity-master-2026`
- **Model ID:** `ultra-router-coding`
- **Name:** `Ultra Router - Coding`

### Модель 3: Reasoning (Gemini Pro)
- **Base URL:** `http://localhost:4000/v1`
- **API Key:** `sk-antigravity-master-2026`
- **Model ID:** `ultra-router-reasoning`
- **Name:** `Ultra Router - Reasoning`

### Модель 4: Chat (Gemini Base)
- **Base URL:** `http://localhost:4000/v1`
- **API Key:** `sk-antigravity-master-2026`
- **Model ID:** `ultra-router-chat`
- **Name:** `Ultra Router - Chat`

## 3. 🛡️ Тестування локального Fallback (Ollama)

Якщо API провайдера стає недоступним (або немає інтернету), LiteLLM автоматично здійснює fallback до локального Ollama сервера!

**Як перевірити:**
1. Запустіть локально Ollama на вашому Mac:
   `ollama serve` та `ollama run deepseek-r1:7b` (або `qwen3:8b`).
2. Вимкніть інтернет або замініть ключ в `config-antigravity.yaml` на неправильний (щоб зімітувати API Error).
3. Відправте запит до `ultra-router-fast` або `ultra-router-coding` через Antigravity UI.
4. LiteLLM автоматично перенаправить запит до локальної групи `http://host.docker.internal:11434`. У логах (`docker logs ultra-router-v5.0`) буде відображено перемикання fallback'у.

## 4. 🧠 Оптимізація Complexity Detection (Роутинг)

В масиві моделей додано спеціальну групу:
```yaml
  - model_name: ultra-router-auto
    litellm_params:
      model: router
```
Якщо в Antigravity ви оберете `ultra-router-auto`, вмикається `latency-based-routing` стратегія, а також може бути налаштований інтелектуальний шлюз LiteLLM для розпізнавання складності (наприклад, прості запити ідуть в `fast`, складні в `reasoning`). 
Наразі роутер балансує навантаження, забезпечує безперебійну роботу і відправляє складні запити на fallback, якщо основні ноди зайняті.
