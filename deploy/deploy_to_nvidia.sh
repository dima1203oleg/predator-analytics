#!/bin/bash
set -e

SERVER_IP="194.177.1.240"
SSH_PORT="6666"
USER="dima"
REMOTE_DIR="~/predator_backend"

echo "============================================="
echo "🦅 PREDATOR // THE OBSERVATORY"
echo "Deploying Backend to NVIDIA Compute Node..."
echo "============================================="

# Ensure directories exist on server
ssh -p ${SSH_PORT} ${USER}@${SERVER_IP} "mkdir -p ${REMOTE_DIR}"

echo "[1/3] Syncing files to server..."
rsync -avz -e "ssh -p ${SSH_PORT}" --exclude 'node_modules' --exclude '__pycache__' --exclude '.git' ../deploy ../services ../libs ${USER}@${SERVER_IP}:${REMOTE_DIR}/

echo "[2/3] Building and bringing up Docker containers..."
ssh -p ${SSH_PORT} ${USER}@${SERVER_IP} "cd ${REMOTE_DIR}/deploy && docker compose down && docker compose up --build -d"

echo "[3/4] Waiting for Postgres to be ready..."
sleep 15
echo "[4/4] Seeding the database..."
ssh -p ${SSH_PORT} ${USER}@${SERVER_IP} "cd ${REMOTE_DIR}/deploy && docker compose cp scripts/seed.py graph-service:/tmp/seed.py && docker compose exec graph-service python /tmp/seed.py"

echo "[4/4] Deployment successful! API Gateway is starting on port 8000."
echo "============================================="
