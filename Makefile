.PHONY: package deploy clean release-v27 verify-v27 lint-axioms

package:
	tar -czf predator_v27_release.tar.gz predatorctl google_agentctl services/arbiter services/truth-ledger services/api-gateway infrastructure/constitution policies agents libs README_V27.md docker-compose.yml docs scripts

release-v27: package
	scp -P 6666 predator_v27_release.tar.gz dima@194.177.1.240:~/predator-analytics/

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

test-arbiter:
	python3 test_arbiter_flow.py
