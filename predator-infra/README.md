# Predator v54 Remote Dev Infrastructure

Fully automated GitOps-based remote development infrastructure for Predator v54.

## Core Stack

- **OS**: Ubuntu 22.04 LTS
- **Runtime**: Python 3.12, Node 20.15.0 LTS
- **Orchestration**: Kubernetes (K3s/RKE2)
- **Deployment**: Helm + ArgoCD
- **Dev Environment**: VS Code Remote SSH + Dev Containers

## Repository Structure

- `bootstrap/`: Server initialization scripts.
- `devcontainer/`: Dockerfile and config for the dev environment.
- `helm/`: Kubernetes manifests for developer pods.
- `gitops/`: ArgoCD configurations.
- `scripts/`: Automation for user management and deployment.
- `docs/`: Guides and security notes.

## Quick Start

1. **Bootstrap Server**:

   ```bash
   sudo ./bootstrap/bootstrap-server.sh
   ```

2. **Create Developer Environment**:

   ```bash
   ./scripts/create-dev-user.sh dima
   ```

3. **Verify Deployment**:

   ```bash
   ./scripts/verify-dev.sh dima
   ```

## Перевірка Dev Containers

Після налаштування інфраструктури виконайте:

```bash
# Запустити повну діагностику
./scripts/diagnose-devcontainer.sh

# Якщо є проблеми, виправити автоматично
./scripts/fix-devcontainer-provider.sh

# Перевірити роботу Dev Container
./scripts/verify-dev.sh dima
```

Очікуваний результат в VS Code:

1. Remote SSH підключення → відкрити /workspaces
2. З'являється сповіщення: "Folder contains a dev container configuration file. Reopen to continue working in a container."
3. Після Reopen → Remote Explorer (у розділі Dev Containers) показує "Predator v54 Dev Environment"

## Principles

- **No Local Compute**: All builds and tests run on the server.
- **GitOps**: Infrastructure is code.
- **GPU Mandatory**: High-performance AI development ready.
