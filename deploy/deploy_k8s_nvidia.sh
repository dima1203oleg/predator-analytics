#!/bin/bash
set -e

SERVER_IP="194.177.1.240"
SSH_PORT="6666"
USER="dima"
REMOTE_DIR="~/predator_k8s"

echo "============================================="
echo "🦅 PREDATOR // THE OBSERVATORY"
echo "Deploying to NVIDIA Compute Node via Kubernetes/Helm..."
echo "============================================="

# Ensure directory exists
ssh -p ${SSH_PORT} ${USER}@${SERVER_IP} "mkdir -p ${REMOTE_DIR}"

echo "[1/3] Syncing Helm charts and config to server..."
rsync -avz -e "ssh -p ${SSH_PORT}" deploy/helm/predator/ ${USER}@${SERVER_IP}:${REMOTE_DIR}/helm-chart/

echo "[2/3] Upgrading Helm release 'predator'..."
ssh -p ${SSH_PORT} ${USER}@${SERVER_IP} "cd ${REMOTE_DIR} && helm upgrade --install predator ./helm-chart -f ./helm-chart/values-nvidia.yaml --namespace predator --create-namespace"

echo "[3/3] Deployment triggered! Current pods status:"
ssh -p ${SSH_PORT} ${USER}@${SERVER_IP} "kubectl -n predator get pods"
echo "============================================="
