# Predator Analytics - Infrastructure Management
# Based on FINAL_INFRA_FIXATION.md

.PHONY: dev server stop status clean help

help:
	@echo "🔍 Predator Commands:"
	@echo "  make dev    - Start LOCAL dev environment (Mac safe)"
	@echo "  make server - Start FULL server environment (Linux/GPU)"
	@echo "  make stop   - Stop all services"
	@echo "  make clean  - Full cleanup (volumes + orphans)"

dev:
	@./scripts/infra_guard.sh local
	@echo "🚀 Starting LOCAL environment..."
	docker-compose --profile local up -d
	@echo "✅ Done. Frontend: http://localhost:80 | API: http://localhost:8090/health"

server:
	@./scripts/infra_guard.sh server
	@echo "🔥 Starting SERVER environment..."
	docker-compose --profile server up -d
	@echo "✅ Server operational."

stop:
	@echo "🛑 Stopping all containers..."
	docker-compose --profile local --profile server stop

status:
	@echo "📊 Active Services:"
	@docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

clean:
	@echo "🧹 Deep cleaning..."
	docker-compose --profile local --profile server down -v --remove-orphans

cli-setup:
	@echo "🛠️ Setting up Mixed TOP CLI Stack..."
	@bash scripts/install_cli_tools.sh

cli-test:
	@echo "🧪 Testing CLI tools integration..."
	@bash scripts/test_cli_tools.sh
