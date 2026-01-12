.PHONY: init up down logs test chaos sync deploy restart clean help

# ============================================================================
# PREDATOR ANALYTICS v25.0 — MAKEFILE
# Незламна система аналітики
# ============================================================================

# Кольори для виводу
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
CYAN := \033[0;36m
NC := \033[0m # No Color

# Конфігурація сервера
SERVER_IP := 194.177.1.240
SERVER_PORT := 6666
SERVER_USER := dima
SSH_KEY := ~/.ssh/id_ed25519_dev

# ============================================================================
# ІНІЦІАЛІЗАЦІЯ
# ============================================================================

help: ## Показати цю довідку
	@echo "$(CYAN)╔══════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(CYAN)║       PREDATOR ANALYTICS v25.0 — КОМАНДИ УПРАВЛІННЯ          ║$(NC)"
	@echo "$(CYAN)╚══════════════════════════════════════════════════════════════╝$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}'

init: ## Ініціалізація середовища розробки
	@echo "$(CYAN)🚀 Ініціалізація Predator Analytics...$(NC)"
	@cp -n .env.example .env 2>/dev/null || true
	@docker network create predator-net 2>/dev/null || true
	@echo "$(GREEN)✅ Середовище готове$(NC)"

# ============================================================================
# ЛОКАЛЬНА РОЗРОБКА
# ============================================================================

up: ## Запуск всіх сервісів локально
	@echo "$(CYAN)🐳 Запуск Docker Compose...$(NC)"
	docker-compose --profile local up -d
	@echo "$(GREEN)✅ Система запущена на http://localhost$(NC)"

down: ## Зупинка всіх сервісів
	@echo "$(YELLOW)⏹️  Зупинка сервісів...$(NC)"
	docker-compose down
	@echo "$(GREEN)✅ Сервіси зупинено$(NC)"

logs: ## Перегляд логів (всі сервіси)
	docker-compose logs -f --tail=100

logs-backend: ## Логи backend
	docker-compose logs -f backend --tail=100

logs-frontend: ## Логи frontend
	docker-compose logs -f frontend --tail=100

restart: ## Перезапуск всіх сервісів
	@echo "$(YELLOW)🔄 Перезапуск...$(NC)"
	docker-compose restart
	@echo "$(GREEN)✅ Перезапущено$(NC)"

# ============================================================================
# ТЕСТУВАННЯ
# ============================================================================

test: ## Запуск тестів
	@echo "$(CYAN)🧪 Запуск тестів...$(NC)"
	cd services/api-gateway && pytest tests/ -v --cov=app
	@echo "$(GREEN)✅ Тести завершено$(NC)"

test-quick: ## Швидкі тести (без coverage)
	cd services/api-gateway && pytest tests/ -v -x

lint: ## Перевірка коду
	@echo "$(CYAN)🔍 Перевірка коду...$(NC)"
	cd services/api-gateway && ruff check app/
	cd apps/predator-analytics-ui && pnpm lint

# ============================================================================
# ХАОС-ІНЖЕНІРИНГ
# ============================================================================

chaos: ## Запуск хаос-тестування (Service Killer)
	@echo "$(RED)🔥 ХАОС-ТЕСТУВАННЯ (Service Killer)$(NC)"
	@./scripts/chaos/service_killer.sh

chaos-test: chaos ## Alias for chaos

chaos-network: ## Симуляція мережевих проблем (TODO)
	@echo "$(RED)🌐 Симуляція мережевого збою... (Not implemented)$(NC)"
	# @./scripts/chaos/network_chaos.sh

chaos-cpu: ## Симуляція навантаження CPU (TODO)
	@echo "$(RED)💻 Симуляція CPU stress... (Not implemented)$(NC)"
	# @./scripts/chaos/cpu_stress.sh

# ============================================================================
# ДЕПЛОЙ НА СЕРВЕР
# ============================================================================

sync: ## Синхронізація коду з сервером
	@echo "$(CYAN)📦 Синхронізація з сервером...$(NC)"
	rsync -avz --exclude 'node_modules' --exclude '.venv' --exclude '__pycache__' \
		-e "ssh -p $(SERVER_PORT) -i $(SSH_KEY) -o StrictHostKeyChecking=no" \
		./ $(SERVER_USER)@$(SERVER_IP):~/predator-analytics/
	@echo "$(GREEN)✅ Синхронізацію завершено$(NC)"

deploy: sync ## Повний деплой (sync + restart)
	@echo "$(CYAN)🚀 Деплой на сервер...$(NC)"
	ssh -p $(SERVER_PORT) -i $(SSH_KEY) $(SERVER_USER)@$(SERVER_IP) \
		"cd ~/predator-analytics && docker-compose --profile server up -d --build"
	@echo "$(GREEN)✅ Деплой завершено$(NC)"

server-restart: ## Перезапуск сервісів на сервері
	@echo "$(YELLOW)🔄 Перезапуск на сервері...$(NC)"
	ssh -p $(SERVER_PORT) -i $(SSH_KEY) $(SERVER_USER)@$(SERVER_IP) \
		"docker restart predator_backend predator_frontend"
	@echo "$(GREEN)✅ Перезапущено$(NC)"

server-logs: ## Логи з сервера
	ssh -p $(SERVER_PORT) -i $(SSH_KEY) $(SERVER_USER)@$(SERVER_IP) \
		"docker logs predator_backend --tail=50"

server-status: ## Статус сервісів на сервері
	@echo "$(CYAN)📊 Статус сервера...$(NC)"
	ssh -p $(SERVER_PORT) -i $(SSH_KEY) $(SERVER_USER)@$(SERVER_IP) \
		"docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"

# ============================================================================
# БАЗА ДАНИХ
# ============================================================================

db-migrate: ## Міграції бази даних
	@echo "$(CYAN)🗄️  Міграції...$(NC)"
	cd services/api-gateway && alembic upgrade head

db-reset: ## Скидання бази (ОБЕРЕЖНО!)
	@echo "$(RED)⚠️  Скидання бази даних...$(NC)"
	docker-compose exec postgres psql -U admin -d predator_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
	$(MAKE) db-migrate

# ============================================================================
# ОЧИСТКА
# ============================================================================

clean: ## Очистка тимчасових файлів
	@echo "$(YELLOW)🧹 Очистка...$(NC)"
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	@echo "$(GREEN)✅ Очищено$(NC)"

clean-docker: ## Очистка Docker (images, volumes)
	@echo "$(RED)🐳 Очистка Docker...$(NC)"
	docker system prune -af
	docker volume prune -f

# ============================================================================
# ШВИДКІ КОМАНДИ
# ============================================================================

dev: up logs ## Запуск в режимі розробки з логами

prod: deploy server-status ## Деплой на production

health: ## Перевірка здоров'я системи
	@echo "$(CYAN)🏥 Перевірка здоров'я...$(NC)"
	@curl -s http://localhost:8090/health | jq . || echo "$(RED)Backend недоступний$(NC)"
	@curl -s http://localhost/api/v1/health | jq . || echo "$(RED)Frontend недоступний$(NC)"
