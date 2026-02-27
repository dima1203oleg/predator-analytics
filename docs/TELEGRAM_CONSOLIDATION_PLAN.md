# Telegram Bot Consolidation Plan

## Current State (Chaos)
Multiple overlapping implementations found:
1. `apps/backend/app/services/telegram_bot.py` (Legacy Monolith)
2. `apps/backend/app/services/telegram_v45_bot.py` (Deprecated v45)
3. `apps/backend/app/services/telegram_advanced.py` (Advanced features)
4. `apps/telegram-bot/` (New Microservice Standard)

## Target State (Microservice)
- Single source of truth: `apps/telegram-bot/`
- Backend interacts via Redis/API only.
- Legacy files in `apps/backend/app/services/` should be removed or marked DEPRECATED.

## Steps
1. ✅ Deploy new `telegram-bot` service (Done via Docker Compose).
2. [ ] Verify `telegram-bot` functionality (waiting for deployment).
3. [ ] Deprecate legacy files (Add WARNING logs/docstrings).
4. [ ] Remove legacy files in v45.

## Legacy Files to Deprecate
```python
apps/backend/app/services/telegram_bot.py
apps/backend/app/services/telegram_v45_bot.py
apps/backend/app/services/telegram_advanced.py
apps/backend/app/services/telegram_executor.py
apps/backend/app/services/telegram_menu.py
```
