#!/usr/bin/env bash
set -euo pipefail

readonly PROGNAME=$(basename "$0")

usage() {
  cat <<EOF
Usage: $PROGNAME [--dry-run] [--yes] [--wipe]

Options:
  --dry-run     Show what would be removed, do not perform destructive actions.
  --yes         Skip interactive confirmation and proceed.
  --wipe        Also remove Docker Desktop user data directories (radical).

WARNING: This script will permanently delete containers, images, volumes,
networks, buildx cache and minikube profiles. Use with extreme care.
EOF
}

DRY_RUN=false
ASSUME_YES=false
WIPE=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=true; shift ;;
    --yes) ASSUME_YES=true; shift ;;
    --wipe) WIPE=true; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1"; usage; exit 2 ;;
  esac
done

info() { echo "[INFO] $*"; }
warn() { echo "[WARN] $*" >&2; }
fatal() { echo "[ERROR] $*" >&2; exit 1; }

confirm() {
  if [ "$ASSUME_YES" = true ]; then
    return 0
  fi
  read -r -p "$1 [y/N]: " answer
  case "$answer" in
    [Yy]|[Yy][Ee][Ss]) return 0 ;;
    *) return 1 ;;
  esac
}

do_or_echo() {
  if [ "$DRY_RUN" = true ]; then
    echo "+ $*"
  else
    echo "# Running: $*"
    eval "$@"
  fi
}

echo ""
echo "!!! ДУЖЕ ВАЖЛИВО: ЗАХОДИ УСЕ, ЩО СЛІДКОМ НИЖЧЕ, ВИДАЛЯТЬ ВСЕ !!!"
echo "If you want a dry run, re-run with --dry-run. To skip prompts pass --yes."
echo ""

if [ "$DRY_RUN" = true ]; then
  info "DRY RUN mode enabled — nothing will be deleted."
fi

if ! command -v docker >/dev/null 2>&1; then
  warn "docker not found in PATH — some steps will be skipped or fail."
fi

if ! command -v minikube >/dev/null 2>&1; then
  warn "minikube not found in PATH — minikube cleanup step will be skipped."
fi

if [ "$DRY_RUN" = false ]; then
  if ! confirm "Продовжити і видалити ВСІ Docker resources та minikube?"; then
    info "Aborted by user."
    exit 0
  fi
fi

# 1) Stop Docker Desktop processes (best-effort)
info "Stopping Docker Desktop processes (if running)..."
do_or_echo "killall Docker || true"
do_or_echo "killall com.docker.hyperkit || true"

# 2) Remove all containers
if command -v docker >/dev/null 2>&1; then
  CONTAINERS=$(docker ps -aq 2>/dev/null || true)
  if [ -n "$CONTAINERS" ]; then
    info "Removing all containers..."
    do_or_echo "docker rm -f $CONTAINERS || true"
  else
    info "No containers to remove."
  fi

  # 3) Remove all images
  IMAGES=$(docker images -aq 2>/dev/null || true)
  if [ -n "$IMAGES" ]; then
    info "Removing all images..."
    do_or_echo "docker rmi -f $IMAGES || true"
  else
    info "No images to remove."
  fi

  # 4) Remove all volumes
  VOLUMES=$(docker volume ls -q 2>/dev/null || true)
  if [ -n "$VOLUMES" ]; then
    info "Removing all volumes..."
    do_or_echo "docker volume rm $VOLUMES || true"
  else
    info "No volumes to remove."
  fi

  # 5) Prune networks and system
  info "Pruning networks and Docker system..."
  do_or_echo "docker network prune -f || true"
  do_or_echo "docker system prune -a --volumes -f || true"

  # 6) Reset buildx cache
  info "Resetting buildx builder 'default' (if present) and recreating..."
  do_or_echo "docker buildx rm default 2>/dev/null || true"
  do_or_echo "docker buildx create --name default --use || true"
fi

# 7) Minikube cleanup
if command -v minikube >/dev/null 2>&1; then
  info "Deleting all minikube profiles and purging state..."
  do_or_echo "minikube delete --all --purge || true"

  info "Cleaning kubectl contexts related to minikube..."
  do_or_echo "kubectl config delete-context minikube 2>/dev/null || true"
  do_or_echo "kubectl config delete-cluster minikube 2>/dev/null || true"
  do_or_echo "kubectl config unset users.minikube 2>/dev/null || true"
fi

if [ "$WIPE" = true ]; then
  info "WIPE enabled: removing Docker Desktop user data directories (radical)."
  echo "This will remove ~/Library/Containers/com.docker.docker, ~/.docker and Docker group containers."
  if [ "$DRY_RUN" = true ]; then
    echo "+ rm -rf ~/Library/Containers/com.docker.docker"
    echo "+ rm -rf ~/.docker"
    echo "+ rm -rf ~/Library/Group\ Containers/group.com.docker"
  else
    if confirm "Ти впевнений(а), що хочеш видалити Docker Desktop user data (WIPE)?"; then
      do_or_echo "rm -rf ~/Library/Containers/com.docker.docker || true"
      do_or_echo "rm -rf ~/.docker || true"
      do_or_echo "rm -rf ~/Library/Group\\ Containers/group.com.docker || true"
    else
      info "Skipped WIPE step."
    fi
  fi
fi

info "Finished. If not in dry-run mode, Docker and minikube state should be reset."
info "Start Docker Desktop, then run:"
echo "  docker info"
echo "  minikube start --driver=docker --cpus=4 --memory=3072mb"

exit 0
