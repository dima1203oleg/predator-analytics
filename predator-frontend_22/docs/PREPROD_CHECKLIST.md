
# ✅ Pre-Prod Checklist — Predator Analytics v20.0

Перед деплоєм нової версії на `nvidia` або `oracle` обов'язково пройди цей чекліст.

## 1. Code & Build

- [ ] Всі unit-тести проходять локально (`npm test`, `pytest`).
- [ ] Docker-образи зібрані для `amd64` та `arm64` (якщо деплой на Oracle Cloud).
- [ ] Версія в `Chart.yaml` та `values.yaml` піднята.
- [ ] `CHANGELOG.md` оновлено.

## 2. Security

- [ ] Секрети в Vault актуальні (перевірити термін дії токенів).
- [ ] Немає хардкоду креденшлів у коді.
- [ ] `TRUTH_ONLY_MODE=true` для продакшену.

## 3. Infrastructure (Helm / ArgoCD)

- [ ] `helm template` не видає помилок.
- [ ] ArgoCD показує статус "Synced" для поточного стану (немає дрифту конфігурації).
- [ ] Ресурси (CPU/RAM) в `values.yaml` відповідають лімітам кластера (особливо для Oracle Free Tier).

## 4. Database

- [ ] Міграції БД (`alembic upgrade head`) протестовані на стейджингу.
- [ ] Бекап БД зроблено перед деплоєм (якщо це мажорне оновлення).

## 5. Smoke Tests (після деплою)

- [ ] `/health` ендпоінти повертають 200 OK.
- [ ] Логін через Keycloak працює.
- [ ] `tests/smoke-admin.http` проходить успішно проти нового env.
- [ ] Графана показує метрики (немає "No Data").

## 6. Rollback Plan

- [ ] Знаєш, яку версію (tag) розгортати назад у разі збою.
- [ ] Команда для швидкого відкату готова: `helm rollback` або `git revert`.
