# 🦅 PREDATOR Kaggle Node — Операційний Гайд (v63.2-ELITE)

> **АРХІТЕКТУРА**: FastAPI Native + zrok tunnel  
> **СТАТУС**: K3s/Docker **ЗАБОРОНЕНО** в Kaggle (kernel restrictions)

---

## Чому НЕ K3s?

Kaggle Container Runtime блокує критичні операції:

| Обмеження | Причина |
|---|---|
| `bind-mount /var/lib/kubelet` | **operation not permitted** → kubelet не стартує |
| `/proc/sys/*` | **read-only filesystem** → sysctl fails |
| `/dev/kmsg` | **не існує** → kubelet crash |
| `oom_score_adj` | **permission denied** → container restriction |

**Висновок**: Kubernetes (K3s/K8s/MicroK8s) **архітектурно неможливий** в Kaggle.

---

## Робоча Архітектура: Native Processes

```
┌──────────────────────────────────────────┐
│          Kaggle Notebook (30GB RAM)       │
│                                          │
│  ┌─────────────────────────────────────┐ │
│  │   FastAPI (uvicorn :8000)           │ │
│  │   ├── /api/v1/health               │ │
│  │   ├── /api/v1/factory/ooda         │ │
│  │   ├── /api/v1/risk/company/{ueid}  │ │
│  │   ├── /api/v1/tornado/stats        │ │
│  │   ├── /api/v1/osint/diligence/     │ │
│  │   └── /api/v1/analytics/summary    │ │
│  └───────────┬─────────────────────────┘ │
│              │                           │
│  ┌───────────▼─────────────────────────┐ │
│  │   zrok tunnel (latest)              │ │
│  │   → https://xxx.share.zrok.io      │ │
│  └─────────────────────────────────────┘ │
│                                          │
│  ┌─────────────────────────────────────┐ │
│  │   Keep-Alive Loop (30s heartbeat)   │ │
│  └─────────────────────────────────────┘ │
└──────────────────────────────────────────┘
         │
         ▼  (zrok public URL)
┌──────────────────────────────────┐
│  MacBook: PREDATOR UI (:3030)    │
│  VITE_API_BASE_URL = zrok URL    │
└──────────────────────────────────┘
```

---

## Інструкція запуску

### Крок 1: Завантаження блокноту

Файл: `predator_kaggle_final.ipynb`

1. Відкрийте [kaggle.com/code](https://www.kaggle.com/code)
2. **New Notebook → Import Notebook → Upload**
3. Завантажте `predator_kaggle_final.ipynb`

### Крок 2: Налаштування Kaggle

- **Accelerator**: None (CPU)
- **Persistence**: Files only
- **Internet**: ON (обов'язково!)

### Крок 3: Послідовний запуск клітинок

| Клітинка | Що робить | Час |
|---|---|---|
| 1 | pip install залежностей | ~15с |
| 2 | Завантаження актуального zrok | ~10с |
| 3 | Активація zrok токену | ~3с |
| 4 | Запис FastAPI backend | мить |
| 5 | Старт backend + тунель | ~10с |
| 6 | Keep-Alive моніторинг | ∞ (не зупиняти!) |

### Крок 4: Отримання URL

Після клітинки 5 ви побачите:

```
============================================================
🔥 PREDATOR KAGGLE NODE IS LIVE!
🔗 PUBLIC URL: https://xxxxx.share.zrok.io
============================================================
```

### Крок 5: Підключення UI

На MacBook оновіть `.env` або `AICopilot.tsx`:

```bash
VITE_API_BASE_URL=https://xxxxx.share.zrok.io
```

---

## Перевірка роботи

```bash
# Health Check
curl https://xxxxx.share.zrok.io/api/v1/health

# Очікувана відповідь:
# {"status":"ONLINE","mode":"KAGGLE_NATIVE","node":"KAGGLE_RESERVE",...}

# OODA Status
curl https://xxxxx.share.zrok.io/api/v1/factory/ooda

# Risk Engine
curl https://xxxxx.share.zrok.io/api/v1/risk/company/test-ueid-001
```

---

## Troubleshooting

### zrok: "out of date"
→ Клітинка 2 автоматично завантажує **останню** версію через GitHub API

### zrok: "already enabled"
→ Клітинка 3 виконує `zrok disable` перед `enable`

### Backend не відповідає
→ Перезапустіть клітинку 5 (вбиває попередній процес)

### Kaggle завершує сесію
→ Клітинка 6 (Keep-Alive) має працювати безперервно

---

## Обмеження

- **Без реальних БД**: Ендпоїнти повертають mock-дані (достатньо для health/failover)
- **Тунель тимчасовий**: URL змінюється при кожному перезапуску zrok
- **Сесія ~12 годин**: Kaggle обмежує час виконання
