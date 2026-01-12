# FINAL INFRASTRUCTURE FIXATION (CANON)

## Environment Separation Matrix

| Feature / Service | LOCAL (Mac/Dev) | SERVER (Linux/NVIDIA) |
| :--- | :---: | :---: |
| **Profile Name** | `local` | `server` |
| **Hardware** | CPU Only | CPU + GPU (NVIDIA) |
| **Frontend/Backend** | ✅ Yes | ✅ Yes |
| **VDP (Postgres/Redis/MinIO)** | ✅ Yes | ✅ Yes |
| **Knowledge (OS/Qdrant)** | ✅ Yes | ✅ Yes |
| **Telegram Bot (Dev/Prod)** | ✅ Yes | ✅ Yes |
| **Trinity Orchestrator** | ❌ NO | ✅ Yes |
| **Heavy ML (H2O/MLStudio)** | ❌ NO | ✅ Yes |
| **Monitoring (Grafana/Prom)** | ❌ NO | ✅ Yes |
| **Self-Improvement Loop** | ❌ NO | ✅ Yes |

## Enforcement Rules

1. **Strict Profiles**: Never use `docker-compose up -d` without a `--profile`.
2. **GPU Lockdown**: GPU capabilities are strictly forbidden in `local` profile.
3. **Hardware Guard**: Start scripts must verify hardware/OS match before pulling heavy images.
4. **Environment Variable**: `EXECUTION_ENV` must be set in `.env`.

## Commands

- **Local Development**: `make dev` (alias for `docker-compose --profile local up -d`)
- **Server Deployment**: `make server` (alias for `docker-compose --profile server up -d`)
