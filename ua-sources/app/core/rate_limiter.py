"""
Rate Limiter Service
Redis-based rate limiting with plan-based quotas
"""
import os
import time
import logging
from typing import Optional, Tuple
from datetime import datetime, timedelta

logger = logging.getLogger("core.rate_limiter")

# Plan-based limits (requests per day)
PLAN_LIMITS = {
    "free": 100,
    "premium": 10000,
    "enterprise": 100000,
    "admin": -1  # unlimited
}


class RateLimiter:
    """
    Redis-based rate limiter with sliding window.
    
    Usage:
        limiter = RateLimiter()
        allowed, remaining = await limiter.check("user-123", "free")
        if not allowed:
            raise HTTPException(429, "Rate limit exceeded")
    """
    
    def __init__(self, redis_url: str = None):
        """
        Initialize rate limiter.
        
        Args:
            redis_url: Redis connection URL (defaults to env var)
        """
        self.redis_url = redis_url or os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self._client = None
        self.window_seconds = 24 * 60 * 60  # 24 hours
    
    @property
    def client(self):
        """Lazy Redis client initialization."""
        if self._client is None:
            try:
                import redis.asyncio as redis
                self._client = redis.from_url(self.redis_url, decode_responses=True)
                logger.info(f"Rate limiter connected to Redis: {self.redis_url}")
            except ImportError:
                logger.warning("redis package not installed. Rate limiting disabled.")
                return None
        return self._client
    
    def _get_key(self, user_id: str, resource: str = "api") -> str:
        """Generate Redis key for user rate limit."""
        return f"ratelimit:{resource}:{user_id}"
    
    def _get_window_start(self) -> int:
        """Get current window start timestamp (midnight UTC today)."""
        now = datetime.utcnow()
        midnight = now.replace(hour=0, minute=0, second=0, microsecond=0)
        return int(midnight.timestamp())
    
    async def check(
        self, 
        user_id: str, 
        plan: str = "free",
        resource: str = "api"
    ) -> Tuple[bool, int]:
        """
        Check if request is allowed under rate limit.
        
        Args:
            user_id: User identifier
            plan: User's plan (free, premium, enterprise, admin)
            resource: Resource type (api, search, export)
        
        Returns:
            (allowed: bool, remaining: int)
        """
        # Get limit for plan
        limit = PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])
        
        # Unlimited for admin
        if limit == -1:
            return True, -1
        
        # If Redis not available, allow (fail open)
        if self.client is None:
            logger.warning("Rate limiter: Redis not available, allowing request")
            return True, limit
        
        try:
            key = self._get_key(user_id, resource)
            window_start = self._get_window_start()
            window_key = f"{key}:{window_start}"
            
            # Increment counter
            current = await self.client.incr(window_key)
            
            # Set expiry on first request (TTL = 24 hours + 1 hour buffer)
            if current == 1:
                await self.client.expire(window_key, self.window_seconds + 3600)
            
            remaining = max(0, limit - current)
            allowed = current <= limit
            
            if not allowed:
                logger.warning(
                    f"Rate limit exceeded: user={user_id}, plan={plan}, "
                    f"current={current}, limit={limit}"
                )
            
            return allowed, remaining
            
        except Exception as e:
            logger.error(f"Rate limiter error: {e}")
            # Fail open
            return True, limit
    
    async def get_usage(self, user_id: str, resource: str = "api") -> dict:
        """
        Get current usage stats for a user.
        
        Returns:
            {current: int, remaining: int, limit: int, reset_at: str}
        """
        if self.client is None:
            return {"error": "Rate limiter not available"}
        
        try:
            key = self._get_key(user_id, resource)
            window_start = self._get_window_start()
            window_key = f"{key}:{window_start}"
            
            current = await self.client.get(window_key)
            current = int(current) if current else 0
            
            # Get TTL for reset time
            ttl = await self.client.ttl(window_key)
            reset_at = datetime.utcnow() + timedelta(seconds=max(0, ttl))
            
            return {
                "current": current,
                "reset_at": reset_at.isoformat() + "Z"
            }
            
        except Exception as e:
            logger.error(f"Failed to get usage: {e}")
            return {"error": str(e)}
    
    async def reset(self, user_id: str, resource: str = "api"):
        """Reset rate limit for a user (admin only)."""
        if self.client is None:
            return
        
        key = self._get_key(user_id, resource)
        window_start = self._get_window_start()
        window_key = f"{key}:{window_start}"
        
        await self.client.delete(window_key)
        logger.info(f"Rate limit reset for user: {user_id}")


# Singleton instance
_rate_limiter: Optional[RateLimiter] = None


def get_rate_limiter() -> RateLimiter:
    """Get rate limiter singleton."""
    global _rate_limiter
    if _rate_limiter is None:
        _rate_limiter = RateLimiter()
    return _rate_limiter


# FastAPI Dependency
async def check_rate_limit(user_id: str, plan: str = "free"):
    """
    FastAPI dependency for rate limiting.
    
    Usage:
        @app.get("/api/search")
        async def search(user = Depends(get_current_user)):
            await check_rate_limit(user["id"], user["plan"])
            ...
    """
    from fastapi import HTTPException
    
    limiter = get_rate_limiter()
    allowed, remaining = await limiter.check(user_id, plan)
    
    if not allowed:
        usage = await limiter.get_usage(user_id)
        raise HTTPException(
            status_code=429,
            detail={
                "error": "Rate limit exceeded",
                "message": f"You have exceeded your {plan} plan limit. Upgrade for more requests.",
                "reset_at": usage.get("reset_at"),
                "upgrade_url": "/pricing"
            },
            headers={"Retry-After": str(usage.get("reset_at", "86400"))}
        )
    
    return remaining
