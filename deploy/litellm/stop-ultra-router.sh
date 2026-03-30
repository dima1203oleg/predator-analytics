#!/usr/bin/env bash
# ================================================================
# Ultra-Router v4.4 — Зупинка Docker Compose
# ================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

docker compose -f docker-compose-router.yml down
echo "🛑 ULTRA-ROUTER v4.4 зупинено"
