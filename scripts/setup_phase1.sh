#!/bin/bash
set -e

# PREDATOR ANALYTICS v45.1 - PHASE 1 SETUP
# Creates the directory structure as defined in TECHNICAL_SPECIFICATION_FINAL.md

echo "🚀 Initializing Predator Analytics v45.1 - Phase 1: Foundation..."

# 1. Create Directories (Part 5: File Structure)
DIRS=(
    ".github/workflows"
    ".devcontainer"
    "argocd"
    "helm/predator-analytics/templates"
    "schemas"
    "services/mcp_router/providers"
    "services/mcp_router/tests"
    "services/rtb_engine/rules"
    "services/rtb_engine/audit"
    "services/rtb_engine/tests"
    "services/sio_controller/tests"
    "services/automl_controller/tests"
    "services/training_controller/tests"
    "services/validation_controller/tests"
    "services/canary-controller/tests"
    "services/aes/tests"
    "services/api/routes"
    "services/api/tests"
    "services/shared/schema_registry"
    "migrations"
    "manifests/policies/kyverno"
    "manifests/network-policies"
    "prompts"
    "ci"
    "tests/unit"
    "tests/integration"
    "tests/e2e/cypress"
    "docs/ADR"
    "docs/runbooks"
)

for dir in "${DIRS[@]}"; do
    mkdir -p "$dir"
    echo "✅ Created: $dir"
done

# 2. Create Base Files (Empty or minimal content)
touch .github/workflows/.gitkeep
touch .github/dependabot.yml
touch .github/CODEOWNERS

# Helm Chart
cat > helm/predator-analytics/Chart.yaml <<EOF
apiVersion: v2
name: predator-analytics
description: "Predator Analytics Platform v45.1 (Phase 1)"
type: application
version: 0.1.0
appVersion: "25.1"
EOF

# Base Values (Minimal for Phase 1)
cat > helm/predator-analytics/values.yaml <<EOF
global:
  environment: development
  domain: predator.analytics.local
  pythonVersion: "3.12"
  
postgresql:
  enabled: true
  image: 
    tag: "15"
  persistence:
    size: 10Gi
    
redis:
  enabled: true
  image:
    tag: "7"
    
minio:
  enabled: true
  persistence:
    size: 20Gi
    
mlflow:
  enabled: true
  
ollama:
  enabled: true
  resources:
    requests:
      memory: "4Gi"
      cpu: "2"
EOF

# ArgoCD App
cat > argocd/application.yaml <<EOF
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: predator-analytics
  namespace: argocd
spec:
  project: default
  source:
    path: helm/predator-analytics
    repoURL: https://github.com/predator-analytics/predator
    targetRevision: main
  destination:
    server: https://kubernetes.default.svc
    namespace: predator-analytics
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
EOF

echo "✅ Generated Base Configs: Chart.yaml, values.yaml, application.yaml"

# 3. Create Shared Python Modules
touch services/shared/__init__.py
touch services/shared/events.py
touch services/shared/decision.py
touch services/shared/metrics.py
touch services/shared/logging_config.py
touch services/shared/telemetry.py
touch services/shared/constants.py

echo "✅ Initialized Python Shared Modules"

# 4. Make script executable
chmod +x "$0"

echo "🏁 Phase 1 Structure Setup Complete!"
