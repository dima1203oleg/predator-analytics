APP_NAME=predator-analytics
COMPOSE=docker-compose.yml

.PHONY: help up down logs build test helm-dev

help:
	@echo "Targets: up down logs build test helm-dev"

up:
	docker-compose -f $(COMPOSE) up -d

down:
	docker-compose -f $(COMPOSE) down -v

logs:
	docker-compose -f $(COMPOSE) logs -f --tail=200

build:
	docker-compose -f $(COMPOSE) build

test:
	@echo "Run backend tests"
	@cd ua-sources && pytest -q || true

helm-dev:
	helm upgrade --install $(APP_NAME)-dev infra/helm/umbrella \
		-f infra/helm/umbrella/values.yaml \
		-f infra/helm/umbrella/values-dev.yaml \
		--namespace $(APP_NAME)-dev --create-namespace
