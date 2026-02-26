.PHONY: package deploy clean release-v27 verify-v27 lint-axioms

.PHONY: dev server stop status clean rebuild help

help:
	@echo "🔍 Predator Commands:"
	@echo "  make dev    - Start LOCAL dev environment (Mac safe)"
	@echo "  make server - Start FULL server environment (Linux/GPU)"
	@echo "  make stop   - Stop all services"
	@echo "  make clean  - Full cleanup (volumes + orphans)"
	@echo "  make rebuild-dev - Rebuild the Dev Container"

lint-axioms:
	PYTHONPATH=./predatorctl:./google_agentctl:. predatorctl system lint

verify-v27: package
	ssh -p 6666 dima@194.177.1.240 "mkdir -p ~/predator-analytics"
	scp -P 6666 predator_v27_release.tar.gz dima@194.177.1.240:~/predator-analytics/
	ssh -p 6666 dima@194.177.1.240 "cd ~/predator-analytics && docker run --rm -v /home/dima/predator-analytics:/mnt busybox rm -rf /mnt/libs /mnt/predatorctl /mnt/google_agentctl /mnt/scripts /mnt/infrastructure/constitution/laws && tar -xzf predator_v27_release.tar.gz && export PYTHONPATH=/home/dima/predator-analytics/predatorctl:/home/dima/predator-analytics/google_agentctl:/home/dima/predator-analytics && python3 scripts/red_team_stress_test.py && /home/dima/predator-analytics/.venv/bin/predatorctl system lint && /home/dima/predator-analytics/.venv/bin/predatorctl system audit"

deploy: package
	./deploy_v26.sh

install-local:
	pip install -e predatorctl
	pip install -e google_agentctl

audit:
	predatorctl system audit --type constitution

cli-setup:
	@echo "🛠️ Setting up Mixed TOP CLI Stack..."
	@bash scripts/install_cli_tools.sh

cli-test:
	@echo "🧪 Testing CLI tools integration..."
	@bash scripts/test_cli_tools.sh

rebuild-dev:
	@echo "🔄 Rebuilding Dev Container..."
	@./scripts/rebuild_devcontainer.sh
