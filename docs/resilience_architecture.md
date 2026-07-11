# 🛡️ PREDATOR Analytics — Resilience Architecture (v61.0-ELITE)

## 1. Мета архітектури відмовостійкості
- **Zero Downtime**: Система має працювати **24/7** без перерв.
- **Self-Healing**: Автоматичне відновлення після збоїв.
- **Disaster Recovery**: Швидке відновлення після катастрофічних збоїв.
- **Immutable Infrastructure**: Усі компоненти замінюються, а не лагодяться.
- **GitOps**: Усі налаштування зберігаються в Git (єдине джерело істини).
- **Never Stop**: Агент ніколи не зупиняється, виконує до кінця.

## 2. NVIDIA Node Connection Matrix
| IP              | Port | Status  | Fallback |
|-----------------|------|---------|----------|
| 192.168.1.48    | 6666 | Primary | →22→2222 |
| 192.168.0.48    | 6666 | Secondary | →22 |
| 10.8.0.1        | 6666 | VPN | →22 |
| 194.177.1.240   | 6666 | Public | →22 |

## 3. MacBook State (поточний)
- IP: 192.168.1.58
- UI: http://localhost:3030 ✅ ONLINE
- Published: /Users/Shared/Predator_60/published_ui/ ✅
- Backup: /Users/dima1203/Predator_Backups/ ✅

## 4. Disaster Recovery — швидке відновлення
```bash
# Повне відновлення системи з нуля:
bash /Users/Shared/Predator_60/AUTO_DEPLOY_NVIDIA.sh
# або якщо потрібна повна система (cron watchdog):
bash /Users/Shared/Predator_60/scripts/predator-watchdog-daemon.sh
```
