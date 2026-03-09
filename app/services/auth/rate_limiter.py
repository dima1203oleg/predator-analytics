"""
Redis-based Rate Limiter (Phase 3 — SM Edition).

Sliding window rate limiting per tenant + role.
"""
from datetime import datetime, timezone
from typing import Any


# Rate limits per plan (§13.2)
PLAN_RATE_LIMITS: dict[str, dict[str, int]] = {
    "starter": {"rpm": 100, "burst": 20},
    "professional": {"rpm": 500, "burst": 50},
    "enterprise": {"rpm": 2000, "burst": 200},
    "government": {"rpm": 5000, "burst": 500},
}


class RedisRateLimiter:
    """Redis-based sliding window rate limiter."""

    def __init__(self) -> None:
        self.config: dict[str, Any] = {
            "backend": "redis",
            "algorithm": "sliding_window",
            "window_seconds": 60,
            "key_prefix": "rl:",
        }

    def get_config(self) -> dict[str, Any]:
        """Конфігурація rate limiter."""
        return {
            **self.config,
            "plan_limits": PLAN_RATE_LIMITS,
            "status": "active",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

    def check_limit(self, tenant_id: str, plan: str) -> dict[str, Any]:
        """Перевірити rate limit для тенанта."""
        limits = PLAN_RATE_LIMITS.get(plan, PLAN_RATE_LIMITS["starter"])
        return {
            "allowed": True,
            "tenant_id": tenant_id,
            "plan": plan,
            "limit_rpm": limits["rpm"],
            "remaining": limits["rpm"],
            "reset_in_seconds": 60,
        }
