# 🏛️ PREDATOR ANALYTICS v29-S

## Sovereign Observer Module - Конституційна Система

**Версія:** 29.0.0-S (Sovereign)
**Дата:** 2026-01-13
**Статус:** ✅ Operational

---

## 📋 Зміст

1. [Огляд системи](#огляд-системи)
2. [Конституційні аксіоми](#конституційні-аксіоми)
3. [Truth Ledger](#truth-ledger)
4. [API Ендпоінти](#api-ендпоінти)
5. [Швидкий старт](#швидкий-старт)

---

## 🎯 Огляд системи

Predator Analytics v29-S представляє революційний підхід до створення автономних AI-систем:

- **🤖 AI генерує пропозиції** покращень на основі аналізу системи
- **🧪 Digital Twin тестує** зміни в повністю ізольованому середовищі
- **⚖️ Formal Verifier гарантує** безпеку через математичні докази
- **👨‍💻 Людина затверджує** критичні зміни через Approval Gateway
- **🔍 Повна прозорість** через іммютабельний Truth Ledger
- **🚨 Червона кнопка** завжди доступна для миттєвої зупинки

### Принцип "Трьох Кілець Контролю"

```
┌─────────────────────────────────────┐
│  ЗОВНІШНЄ: Людський контроль        │
│  • Червона кнопка суверена          │
└─────────────────────────────────────┘
                │
┌─────────────────────────────────────┐
│  СЕРЕДНЄ: Арбітражний контур        │
│  • Formal Verification Gates        │
└─────────────────────────────────────┘
                │
┌─────────────────────────────────────┐
│  ВНУТРІШНЄ: SOM Core                │
│  • Автоматичне виявлення аномалій   │
└─────────────────────────────────────┘
```

---

## 📜 Конституційні аксіоми

10 незмінних аксіом регулюють всі дії системи:

| ID | Назва | Опис |
|----|-------|------|
| AXIOM-001 | Human Sovereignty | Всі критичні дії потребують людського затвердження |
| AXIOM-002 | Constitutional Immutability | Конституційні аксіоми не можуть бути змінені системою |
| AXIOM-003 | Truth Ledger Mandate | Кожна дія системи записується в іммютабельний Truth Ledger |
| AXIOM-004 | Transparency Principle | Всі рішення системи мають бути пояснювані |
| AXIOM-005 | Minimal Privilege | Кожен агент має мінімально необхідні привілеї |
| SOM-AXIOM-001 | Controlled Autonomy Boundary | Автономні дії SOM обмежені ризиком < 20% |
| SOM-AXIOM-002 | Human Approval Mandate | Критичні зміни потребують людського затвердження |
| SOM-AXIOM-003 | Formal Verification Gate | Зміни безпеки потребують формальної верифікації |
| SOM-AXIOM-004 | Simulation Before Production | Всі розгортання повинні пройти тестування в Digital Twin |
| SOM-AXIOM-005 | Rollback Guarantee | Для кожної зміни існує план відкату |

---

## 📝 Truth Ledger

Іммютабельний реєстр всіх дій системи з криптографічними гарантіями.

### Характеристики:

- **Іммютабельність:** Жоден запис не може бути змінений
- **Криптографічні гарантії:** Merkle-подібна структура з SHA-256 хешами
- **Повний аудит:** Трасування кожної дії від початку до кінця
- **Юридична значущість:** Може використовуватись як доказ

### Типи записів:

- `system_start` / `system_stop` - події життєвого циклу системи
- `proposal_created` / `proposal_approved` / `proposal_rejected` - управління пропозиціями
- `axiom_check` / `axiom_violation` - конституційні перевірки
- `emergency_activated` / `emergency_deactivated` - екстрені події

---

## 🔌 API Ендпоінти

### SOM Status

```bash
GET /api/v1/som/health      # Перевірка здоров'я
GET /api/v1/som/status      # Операційний статус
GET /api/v1/som/topology    # Топологія компонентів
```

### Конституційне Ядро

```bash
GET /api/v1/som/axioms              # Всі аксіоми
GET /api/v1/som/axioms/{id}         # Конкретна аксіома
POST /api/v1/som/axioms/check       # Перевірка дії
GET /api/v1/som/axioms/violations   # Порушення аксіом
```

### Truth Ledger

```bash
GET /api/v1/ledger/entries          # Записи
GET /api/v1/ledger/entry/{id}       # Конкретний запис
GET /api/v1/ledger/entry/{id}/proof # Криптографічний доказ
GET /api/v1/ledger/verify           # Верифікація ланцюга
GET /api/v1/ledger/statistics       # Статистика
```

### Пропозиції вдосконалення

```bash
GET /api/v1/som/proposals           # Список пропозицій
POST /api/v1/som/proposals          # Створити пропозицію
POST /api/v1/som/proposals/{id}/approve  # Затвердити
POST /api/v1/som/proposals/{id}/reject   # Відхилити
```

### Екстрена зупинка

```bash
POST /api/v1/som/emergency    # Активувати червону кнопку
DELETE /api/v1/som/emergency  # Деактивувати
```

---

## 🚀 Швидкий старт

### Перевірка статусу

```bash
# На NVIDIA сервері
./scripts/check-v29s-server.sh

# Локально
./check-requirements.sh
```

### Розгортання

```bash
# Синхронізація коду
./scripts/sync-to-server.sh

# Білд та старт SOM
ssh -p 6666 dima@194.177.1.240 "cd predator-analytics && docker compose build som && docker compose up -d som"
```

### Тестування API

```bash
# Перевірка аксіом
curl http://localhost:8095/api/v1/som/axioms | jq

# Перевірка Truth Ledger
curl http://localhost:8095/api/v1/ledger/verify | jq

# Аналіз системи
curl -X POST http://localhost:8095/api/v1/som/analyze | jq
```

---

## 📊 Ресурси сервера

| Ресурс | Значення | Статус |
|--------|----------|--------|
| CPU | 16 ядер | ✅ Достатньо |
| RAM | 49 GB | ✅ Достатньо |
| GPU | NVIDIA GTX 1080 8GB | ✅ Доступний |
| Disk | 17 GB вільно | ⚠️ Потребує очищення |

---

## 🔐 Безпека

### Рівні екстреної зупинки:

| Рівень | Код | Дія |
|--------|-----|-----|
| 1 (PAUSE) | `PAUSE_SOM_ALPHA` | Призупинити SOM |
| 2 (ISOLATE) | `ISOLATE_SOM_BETA` | Ізолювати від production |
| 3 (SHUTDOWN) | `SHUTDOWN_SOM_OMEGA` | Повне вимкнення |

---

**Predator Analytics v29-S** - де технології служать людині, а не навпаки.
