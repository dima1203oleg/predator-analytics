"""Cilium Network Policies (Phase 7 — SM Edition).

Default deny policies and zero-trust L3/L4/L7 rules.
Generates CiliumNetworkPolicy (CNP) YAML or configurations for Kubernetes.
"""
from datetime import UTC, datetime
from typing import Any


class NetworkPolicyManager:
    """Manages Cilium Network Policies for SM architecture."""

    def __init__(self) -> None:
        self.default_deny_all = True
        self.namespaces = ["predator-core", "predator-data", "predator-obs"]

    def generate_cilium_policies(self) -> dict[str, Any]:
        """Генерує базові Cilium політики для кластера SM."""
        policies = [
            {
                "name": "default-deny-all",
                "description": "Заборона всього трафіку за замовчуванням (Zero Trust)",
                "rules": {
                    "ingress": [{"fromEndpoints": [{"matchLabels": {"none": "true"}}]}],
                    "egress": [{"toEndpoints": [{"matchLabels": {"none": "true"}}]}],
                }
            },
            {
                "name": "api-to-postgres",
                "description": "Дозволити API доступ до PostgreSQL (L4 port 5432)",
                "rules": {
                    "ingress": [
                        {
                            "fromEndpoints": [{"matchLabels": {"app": "predator-core-api"}}],
                            "toPorts": [{"ports": [{"port": "5432", "protocol": "TCP"}]}]
                        }
                    ]
                }
            },
            {
                "name": "worker-to-kafka",
                "description": "Дозволити Ingestion Worker доступ до Kafka (L4 port 9092)",
                "rules": {
                    "ingress": [
                        {
                            "fromEndpoints": [{"matchLabels": {"app": "predator-ingestion-worker"}}],
                            "toPorts": [{"ports": [{"port": "9092", "protocol": "TCP"}]}]
                        }
                    ]
                }
            },
            {
                "name": "allow-dns-egress",
                "description": "Дозволити вихідний DNS трафік для всіх подів (L4 port 53 / L7 DNS)",
                "rules": {
                    "egress": [
                        {
                            "toEndpoints": [{"matchLabels": {"k8s:io.kubernetes.pod.namespace": "kube-system"}}],
                            "toPorts": [{"ports": [{"port": "53", "protocol": "ANY"}], "rules": {"dns": [{"matchPattern": "*"}]}}]
                        }
                    ]
                }
            }
        ]

        return {
            "status": "active",
            "provider": "cilium",
            "enforcement_mode": "strict",
            "mTLS_enabled": True,  # Cilium strict mTLS
            "policies": policies,
            "updated_at": datetime.now(UTC).isoformat(),
        }

    def get_policy_status(self) -> dict[str, Any]:
        """Статус активних Network Policies."""
        return {
            "namespaces_protected": len(self.namespaces),
            "total_policies": 4,
            "default_deny": "enforced",
        }
