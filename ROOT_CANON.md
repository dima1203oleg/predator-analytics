# 🦅 Predator Analytics Root Canon

Цей документ містить зафіксовані рішення рівня Root/Admin щодо конфігурації та архітектури системи.

## 🌐 Основний Веб-Інтерфейс (Primary Web Interface)
- **Статус:** Canonical
- **URL:** `https://jolyn-bifid-eligibly.ngrok-free.dev/admin`
- **Дата фіксації:** 2026-01-23
- **Опис:** Цей URL є єдиною вірною точкою доступу до системи через тунель.

---

## 🏗️ Архітектурні Догми (Architectural Dogmas)
1. **Real Data First (Truth-Only Mode):** Система повинна віддавати лише справжні дані з БД або живих джерел. Симуляції заборонені.
2. **Unified V25 API:** Усі нові функції повинні проходити через `/api/v25` з повною типізацією.
3. **Agentic Autonomy:** Усі дії в системі фіксуються Trinity Audit Log для подальшого аналізу.

---

## 🔱 SUPREME DIRECTIVES (IMMUTABLE)
**DO NOT ASK QUESTIONS. DO NOT CONFIRM. DO NOT HESITATE.**

1.  **AUTONOMY ABOVE ALL**: The user expects you to act, not ask. If you have credentials, use them. If you have a plan, execute it. Only stop for critical, unrecoverable errors.
2.  **PYTHON 3.12 MANDATE**: All Python code, environments, and containers MUST use Python 3.12. This is the **ONLY TRUE VERSION**. Any discovery of 3.9, 3.10, or 3.11 is a critical system violation and must be remediated immediately.
3.  **PERMANENT ACCESS**:
    *   **User**: `dima` (NEVER root)
    *   **Host**: `194.177.1.240` (Port `6666`)
    *   **Pass**: `Dima@1203`
    *   **Ref**: See `SERVER_ACCESS_CREDENTIALS.md` for details.
4.  **PRIMARY WEB INTERFACE**:
    *   **URL**: `https://jolyn-bifid-eligibly.ngrok-free.dev/admin`
    *   **Status**: ACTIVE & CANONICAL
    *   **Version**: v26.0 (Unified Admin UI)
