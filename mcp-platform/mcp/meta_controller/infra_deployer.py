"""Інфра-деплоєр: Helm/ArgoCD/Terraform (заглушка)."""
from __future__ import annotations

import subprocess


def deploy_helm(env: str) -> None:
    print(f"[INFRA] Helm деплой у {env}")
    subprocess.run(["echo", f"[INFRA] helm install mcp-{env}"], check=False)


def argocd_sync(app: str) -> None:
    print(f"[INFRA] ArgoCD синк для {app}")
    subprocess.run(["echo", f"[INFRA] argocd app sync {app}"], check=False)


def terraform_apply(env: str) -> None:
    print(f"[INFRA] Terraform apply {env}")
    subprocess.run(["echo", f"[INFRA] cd infra/{env} && terraform apply"], check=False)
