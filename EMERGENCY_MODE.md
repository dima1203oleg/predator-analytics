# 🆘 EMERGENCY MODE: NVIDIA Offline

Якщо NVIDIA сервер відключився (світло пропало, падіння мережі і т.д.), можеш користуватись PREDATOR локально на Маці!

## 🚀 Швидкий старт (коли NVIDIA DOWN)

```bash
# 1️⃣ Запустити локальну інфраструктуру
cd deploy/litellm
bash start-emergency.sh

# Чекати ~30 сек на запуск контейнерів

# 2️⃣ Запустити Backend
cd services/core-api
python -m uvicorn app.main:app --reload

# 3️⃣ Запустити Frontend
cd apps/predator-analytics-ui
npm run dev

# 4️⃣ Відкрити браузер
# http://localhost:3030
```

---

## 📊 Що працюватиме в Emergency Mode?

| Компонент | Статус | Деталі |
|-----------|--------|---------|
| **Frontend (React)** | ✅ | http://localhost:3030 |
| **Backend (FastAPI)** | ✅ | http://localhost:8000 |
| **LiteLLM Proxy** | ✅ | http://localhost:4000 (GROQ/HF/Together) |
| **Ollama** | ⚠️ | Якщо встановлена на Маці |
| **PostgreSQL** | ✅ | SQLite fallback (`predator_local.db`) |
| **Redis** | ✅ | В памяті (не персистентно) |
| **Neo4j** | ❌ | Потребує NVIDIA |
| **Kafka** | ❌ | Потребує NVIDIA |
| **OpenSearch** | ❌ | Потребує NVIDIA |
| **MinIO** | ❌ | Потребує NVIDIA |

---

## 🤖 AI Моделі (безплатні)

Навіть без NVIDIA, маєш доступ до:

- **Groq** (llama-3.3-70b) — найшвидша, 500 token/sec
- **HuggingFace** (Llama-2-70b) — стабільна, безпатна
- **Together AI** (Llama-3-70b) — 1M token/день безплатно

Просто заповни ключі в `.env.remote`:

```bash
GROQ_API_KEY_1="gsk_YOUR_KEY"
HF_API_KEY="hf_YOUR_KEY"
TOGETHER_API_KEY="b27_YOUR_KEY"
```

---

## 📡 Архітектура Emergency Mode

```
┌─────────────────────────────────────────────────────────┐
│  Frontend React (localhost:3030)                        │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│  Backend FastAPI (localhost:8000)                       │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┬─────────────────┐
        │                         │                 │
┌───────▼────────┐    ┌──────────▼────────┐    ┌──▼──────────┐
│ SQLite         │    │ ULTRA-ROUTER      │    │ Redis       │
│ (локально)     │    │ (Groq/HF/Together)│    │ (memory)    │
└────────────────┘    └───────────────────┘    └─────────────┘
```

---

## ✅ Переваги Emergency Mode

✅ **Полна функціональність** OSINT, аналітика, AI Copilot  
✅ **Безплатні AI моделі** (Groq, HF, Together)  
✅ **Локальна база** (SQLite) — нічого з сервера не потрібно  
✅ **Швидко** запускається (~30 сек)  

---

## ⚠️ Обмеження

- ❌ Graph DB (Neo4j) — потребує NVIDIA
- ❌ Kafka (Event streaming) — потребує NVIDIA
- ❌ OpenSearch (повнотекстовий пошук) — потребує NVIDIA
- ⚠️ Redis — тільки в памяті (втратиться при перезавантаженні)
- ⚠️ SQLite — медленніша за PostgreSQL, але достатня для розробки

---

## 🔄 Автоматичний Fallback

Конфіг автоматично:

1. **Спробує NVIDIA** (основна)
2. **Якщо недоступна** → перейде на **SQLite** + **ULTRA-ROUTER**
3. **Коли NVIDIA повернеться** → автоматично переключиться назад

Це значить: **ти можеш розробляти без перервання!**

---

## 🛑 Зупинити Emergency Mode

```bash
cd deploy/litellm
bash stop-emergency.sh
```

---

## 💡 Поради

**Для найкращого досвіду:**

1. Встановити **Ollama** локально (опціонально)
   ```bash
   brew install ollama
   ollama pull llama2
   ```

2. Заповнити **реальні ключі** для Groq/HF/Together

3. Мати **Docker запущений** на Маці

4. **Інтернет** має працювати (для Groq/HF/Together)

---

## 🆘 Проблеми?

- ❌ **ULTRA-ROUTER не запускається?**  
  `docker logs ultra-router-v55.3`

- ❌ **Ollama не знаходить моделі?**  
  `ollama pull llama2`

- ❌ **Backend не з'єднується з БД?**  
  Перевір: `sqlite3 predator_local.db ".tables"`

---

**🦅 PREDATOR v55.3 — наука має продовжуватися, навіть коли світло пропало!** ⚡

