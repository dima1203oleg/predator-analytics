#!/usr/bin/env bash
# ================================================================
# Ultra-Router v5.0 — Зупинка (тунель + локальний Docker)
# ================================================================
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

TUNNEL_PID_FILE="/tmp/ultra-router-tunnel.pid"

# Зупиняємо SSH-тунель (якщо активний)
if [ -f "${TUNNEL_PID_FILE}" ]; then
    TUNNEL_PID=$(cat "${TUNNEL_PID_FILE}" 2>/dev/null || echo "")
    if [ -n "${TUNNEL_PID}" ] && kill -0 "${TUNNEL_PID}" 2>/dev/null; then
        kill "${TUNNEL_PID}"
        echo "SSH-тунель зупинено (PID: ${TUNNEL_PID})"
    fi
    rm -f "${TUNNEL_PID_FILE}"
fi

# Зупиняємо локальний Docker (Mac-режим)
docker compose -f docker-compose-mac.yml down 2>/dev/null || true

# Зупиняємо повний стек (якщо запускався локально)
docker compose -f docker-compose-router.yml down 2>/dev/null || true

echo "Ultra-Router v5.0 зупинено"
