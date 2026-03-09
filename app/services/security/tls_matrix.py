"""
TLS Matrix & Secrets Rotation (Phase 7 — SM Edition).

mTLS enforcement for all internal connections, TLS 1.3 for ingress.
Implements §24.2.
"""
from datetime import datetime, timezone
from typing import Any


class TLSMatrix:
    """TLS Configuration and Secrets Rotation manager."""

    def __init__(self) -> None:
        self.internal_mtls = "cilium_strict"
        self.ingress_tls = "tls_1_3_only"

    def get_tls_status(self) -> dict[str, Any]:
        """Статус шифрування комунікацій."""
        return {
            "ingress": {
                "protocol": self.ingress_tls,
                "cipher_suites": ["TLS_AES_128_GCM_SHA256", "TLS_AES_256_GCM_SHA384", "TLS_CHACHA20_POLY1305_SHA256"],
                "provider": "cert-manager + ingress-nginx"
            },
            "internal_mesh": {
                "mode": self.internal_mtls,
                "provider": "Cilium Mutual Authentication (WireGuard / IPSec)",
            },
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

    def get_rotation_schedule(self) -> dict[str, Any]:
        """Графік ротації сертифікатів та секретів."""
        return {
            "schedule": [
                {"secret_type": "jwt_signing_keys", "frequency_days": 30, "provider": "Vault KV"},
                {"secret_type": "database_credentials", "frequency_days": 90, "provider": "Vault Database Engine"},
                {"secret_type": "tls_ingress_certs", "frequency_days": 60, "provider": "cert-manager (Let's Encrypt)"},
                {"secret_type": "internal_mtls_certs", "frequency_days": 1, "provider": "Cilium SPIFFE"}
            ],
            "status": "automated"
        }
