"""
Security API (Phase 7 — SM Edition).

Endpoints for Cilium Network Policies, Kyverno PSS, and TLS/mTLS Matrix.
"""
from fastapi import APIRouter
from typing import Any

from app.services.security import NetworkPolicyManager, KyvernoPolicyManager, TLSMatrix

router = APIRouter(prefix="/security-v2", tags=["Platform Security & Policies"])

_cilium = NetworkPolicyManager()
_kyverno = KyvernoPolicyManager()
_tls = TLSMatrix()


@router.get("/network/policies")
async def get_network_policies() -> dict[str, Any]:
    """Cilium Network Policies status (Zero Trust L3/L4/L7)."""
    return _cilium.generate_cilium_policies()


@router.get("/network/status")
async def get_network_status() -> dict[str, Any]:
    """Cilium enforcement status."""
    return _cilium.get_policy_status()


@router.get("/pods/policies")
async def get_pod_security_standards() -> dict[str, Any]:
    """Kyverno Pod Security Standards (HR-05, HR-17)."""
    return _kyverno.get_active_policies()


@router.post("/pods/validate")
async def validate_pod(pod_spec: dict[str, Any]) -> dict[str, Any]:
    """Admission controller pre-check (Mock)."""
    return _kyverno.validate_pod_spec(pod_spec)


@router.get("/tls/matrix")
async def get_tls_matrix() -> dict[str, Any]:
    """mTLS and ingress TLS encryption status."""
    return _tls.get_tls_status()


@router.get("/secrets/rotation")
async def get_secrets_rotation() -> dict[str, Any]:
    """Vault secrets rotation schedule."""
    return _tls.get_rotation_schedule()
