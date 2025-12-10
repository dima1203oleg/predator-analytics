SHELL := /bin/bash
.
all: help

help:
	@echo "Makefile for the implementation_v22 folder:"
	@echo "  make dev-up          - bring up dev stack (requires docker-compose)"
	@echo "  make index DATASET=... - run local index job"
	@echo "  make train CONFIG=...  - run training job"
	@echo "  make deploy ENV=dev     - helm deploy (dev/staging/prod)"

dev-up:
	@echo "Bring up a simple dev stack (qdrant, opensearch, postgres, minio)"
	@docker-compose -f docker-compose.dev.yaml up -d

index:
	@echo "Indexing dataset ${DATASET}" && ./scripts/index.sh ${DATASET}

train:
	@echo "Running training with ${CONFIG}" && ./scripts/train.sh ${CONFIG}

deploy:
	@echo "Deploying to ${ENV}" && ./scripts/deploy.sh ${ENV}

deploy-nvidia:
	@echo "Deploying to NVIDIA production via ArgoCD..." && ./scripts/deploy-to-nvidia.sh nvidia predator-prod

ensure-nvidia:
	@./scripts/setup-nvidia-context.sh --kubeconfig ${KUBECONFIG:-$HOME/.kube/config} || true
	@./scripts/ensure-argocd-cli.sh || true

push-images:
	@echo "Build and push docker images to GHCR (requires GHCR_PAT)"
	@./scripts/push-images.sh v22.0.$(shell date +%s) v22.0.$(shell date +%s)

