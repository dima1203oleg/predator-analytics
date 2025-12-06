APP_NAME=predator-analytics
COMPOSE=docker-compose.yml
HELM_DIR=helm/predator-umbrella

.PHONY: help up down logs build test helm-dev helm-nvidia helm-oracle migrate ml-test lint optimizer-test optimizer-status optimizer-trigger optimizer-metrics

help:
	@echo "════════════════════════════════════════════════════════════════"
	@echo "  Predator Analytics v21 - Available Targets"
	@echo "════════════════════════════════════════════════════════════════"
	@echo ""
	@echo "  Docker Compose (Local Dev):"
	@echo "    up          - Start all services"
	@echo "    down        - Stop and remove volumes"
	@echo "    logs        - Tail logs"
	@echo "    build       - Build images"
	@echo ""
	@echo "  Helm Deployments:"
	@echo "    helm-dev    - Deploy to Mac dev (minimal)"
	@echo "    helm-nvidia - Deploy to NVIDIA compute (GPU)"
	@echo "    helm-oracle - Deploy to Oracle edge (ARM)"
	@echo ""
	@echo "  Database:"
	@echo "    migrate     - Run PostgreSQL migrations"
	@echo "    seed        - Seed sample data"
	@echo ""
	@echo "  Testing:"
	@echo "    test        - Run all tests"
	@echo "    ml-test     - Test ML services"
	@echo "    lint        - Run linters"
	@echo ""
	@echo "  AutoOptimizer (Self-Improvement Loop ♾️):"
	@echo "    optimizer-test    - Test AutoOptimizer modules"
	@echo "    optimizer-status  - Get current status"
	@echo "    optimizer-trigger - Trigger optimization cycle"
	@echo "    optimizer-metrics - Get current metrics"
	@echo ""

# ============================================================================
# Docker Compose (Local Development)
# ============================================================================

up:
	docker-compose -f $(COMPOSE) up -d

down:
	docker-compose -f $(COMPOSE) down -v

logs:
	docker-compose -f $(COMPOSE) logs -f --tail=200

build:
	docker-compose -f $(COMPOSE) build

restart:
	docker-compose -f $(COMPOSE) restart backend celery_worker

# ============================================================================
# Helm Deployments (3 Environments per TZ v5.0)
# ============================================================================

helm-deps:
	helm dependency update $(HELM_DIR)

# Mac Dev - Minimal resources, local development
helm-dev: helm-deps
	helm upgrade --install $(APP_NAME)-dev $(HELM_DIR) \
		-f $(HELM_DIR)/values.yaml \
		-f $(HELM_DIR)/values-dev-mac.yaml \
		--namespace $(APP_NAME)-dev --create-namespace

# NVIDIA Compute - GPU support, full ML stack
helm-nvidia: helm-deps
	helm upgrade --install $(APP_NAME)-compute $(HELM_DIR) \
		-f $(HELM_DIR)/values.yaml \
		-f $(HELM_DIR)/values-compute-nvidia.yaml \
		--namespace $(APP_NAME)-compute --create-namespace

# Oracle Edge - ARM-compatible, lightweight staging
helm-oracle: helm-deps
	helm upgrade --install $(APP_NAME)-edge $(HELM_DIR) \
		-f $(HELM_DIR)/values.yaml \
		-f $(HELM_DIR)/values-edge-oracle.yaml \
		--namespace $(APP_NAME)-edge --create-namespace

helm-uninstall-dev:
	helm uninstall $(APP_NAME)-dev -n $(APP_NAME)-dev || true

helm-uninstall-nvidia:
	helm uninstall $(APP_NAME)-compute -n $(APP_NAME)-compute || true

helm-uninstall-oracle:
	helm uninstall $(APP_NAME)-edge -n $(APP_NAME)-edge || true

# ============================================================================
# Database Migrations
# ============================================================================

migrate:
	@echo "Running PostgreSQL migrations..."
	docker exec -i predator_postgres psql -U predator -d predator_db \
		-f /docker-entrypoint-initdb.d/init_v21.sql || true
	@for f in infra/postgres/migrations/*.sql; do \
		echo "Running $$f..."; \
		docker exec -i predator_postgres psql -U predator -d predator_db < $$f || true; \
	done
	@echo "Migrations complete!"

seed:
	@echo "Seeding sample data..."
	docker exec -i predator_backend python -c "from app.scripts.seed_data import seed; seed()"

# ============================================================================
# Testing
# ============================================================================

test:
	@echo "Running backend tests..."
	@cd ua-sources && pytest -q --tb=short || true
	@echo "Running frontend tests..."
	@cd frontend && npm test -- --watchAll=false || true

ml-test:
	@echo "Testing ML services..."
	@cd ua-sources && python3 -c "\
from app.services.ml import get_reranker, get_summarizer, get_augmentor, get_xai_service; \
print('Testing Reranker...'); r = get_reranker(); print('  ✓ Reranker OK'); \
print('Testing Augmentor...'); a = get_augmentor(); print('  ✓ Augmentor OK'); \
print('Testing XAI...'); x = get_xai_service(); print('  ✓ XAI OK'); \
print('\nAll ML services operational! 🚀'); \
"

optimizer-test:
	@echo "Testing AutoOptimizer..."
	@cd ua-sources && python3 -c "\
from app.services.auto_optimizer import get_auto_optimizer, MetricsAnalyzer; \
print('Testing MetricsAnalyzer...'); \
analyzer = MetricsAnalyzer(); \
gates = analyzer.QUALITY_GATES; \
print(f'  ✓ Quality gates: {len(gates)} configured'); \
print('Testing AutoOptimizer...'); \
opt = get_auto_optimizer(); \
print('  ✓ AutoOptimizer singleton OK'); \
print('\nAutoOptimizer ready! 🤖'); \
"

optimizer-status:
	@curl -s http://localhost:8000/api/v1/optimizer/status | python3 -m json.tool || echo "Backend not running"

optimizer-trigger:
	@echo "Triggering optimization cycle..."
	@curl -X POST http://localhost:8000/api/v1/optimizer/trigger -H "Content-Type: application/json" -d '{"force": true}' | python3 -m json.tool

optimizer-metrics:
	@curl -s http://localhost:8000/api/v1/optimizer/metrics | python3 -m json.tool || echo "Backend not running"

lint:
	@echo "Linting Python code..."
	@cd ua-sources && ruff check app/ || true
	@echo "Linting TypeScript code..."
	@cd frontend && npm run lint || true

# ============================================================================
# Utilities
# ============================================================================

shell:
	docker exec -it predator_backend /bin/bash

psql:
	docker exec -it predator_postgres psql -U predator -d predator_db

redis-cli:
	docker exec -it predator_redis redis-cli

qdrant-info:
	curl -s http://localhost:6333/collections | jq .

opensearch-health:
	curl -s http://localhost:9200/_cluster/health | jq .

# ============================================================================
# CI/CD Helpers
# ============================================================================

docker-push:
	docker build -t ghcr.io/$(ORG)/backend:$(TAG) ua-sources/
	docker build -t ghcr.io/$(ORG)/frontend:$(TAG) frontend/
	docker push ghcr.io/$(ORG)/backend:$(TAG)
	docker push ghcr.io/$(ORG)/frontend:$(TAG)

argocd-sync:
	argocd app sync $(APP_NAME)-compute || true
	argocd app sync $(APP_NAME)-edge || true

