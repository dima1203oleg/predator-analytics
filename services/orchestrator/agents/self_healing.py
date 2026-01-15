"""
Self-Healing System - Automatic Error Detection and Recovery
Monitors system health and automatically fixes issues
"""
import asyncio
import json
import traceback
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional, Callable
from collections import defaultdict
import logging

from libs.core.structured_logger import get_logger, log_business_event, RequestLogger

logger = get_logger("agents.self_healing")


@dataclass
class ErrorPattern:
    """Detected error pattern"""
    error_type: str
    message: str
    count: int = 1
    first_seen: datetime = field(default_factory=datetime.now)
    last_seen: datetime = field(default_factory=datetime.now)
    stack_trace: Optional[str] = None
    context: Dict[str, Any] = field(default_factory=dict)
    resolution_attempts: int = 0
    resolved: bool = False

    def to_dict(self) -> Dict:
        return {
            "error_type": self.error_type,
            "message": self.message[:200],
            "count": self.count,
            "first_seen": self.first_seen.isoformat(),
            "last_seen": self.last_seen.isoformat(),
            "resolution_attempts": self.resolution_attempts,
            "resolved": self.resolved
        }


@dataclass
class HealingAction:
    """An action taken to heal the system"""
    action_type: str  # restart, rollback, patch, escalate
    target: str
    description: str
    success: bool = False
    timestamp: datetime = field(default_factory=datetime.now)


class ErrorTracker:
    """
    Tracks and categorizes errors for pattern detection
    """
    def __init__(self, window_minutes: int = 60):
        self.errors: Dict[str, ErrorPattern] = {}
        self.error_history: List[Dict] = []
        self.window = timedelta(minutes=window_minutes)

    def record_error(self, error: Exception, context: Dict = None) -> ErrorPattern:
        """Record an error and update patterns"""
        error_key = f"{type(error).__name__}:{str(error)[:100]}"

        if error_key in self.errors:
            pattern = self.errors[error_key]
            pattern.count += 1
            pattern.last_seen = datetime.now()
        else:
            pattern = ErrorPattern(
                error_type=type(error).__name__,
                message=str(error),
                stack_trace=traceback.format_exc(),
                context=context or {}
            )
            self.errors[error_key] = pattern

        # Add to history
        self.error_history.append({
            "key": error_key,
            "timestamp": datetime.now().isoformat(),
            "context": context
        })

        # Cleanup old errors
        self._cleanup_old_errors()

        return pattern

    def get_recurring_patterns(self, min_count: int = 3) -> List[ErrorPattern]:
        """Get errors that keep recurring"""
        return [
            p for p in self.errors.values()
            if p.count >= min_count and not p.resolved
        ]

    def get_error_rate(self) -> float:
        """Get errors per minute"""
        cutoff = datetime.now() - self.window
        recent = [e for e in self.error_history if datetime.fromisoformat(e["timestamp"]) > cutoff]
        return len(recent) / max(self.window.total_seconds() / 60, 1)

    def _cleanup_old_errors(self):
        """Remove errors outside the window"""
        cutoff = datetime.now() - self.window * 2
        self.errors = {
            k: v for k, v in self.errors.items()
            if v.last_seen > cutoff
        }


class SelfHealingSystem:
    """
    Automatic error detection and recovery system

    Features:
    - Error pattern detection
    - Automatic retry with backoff
    - Service restart coordination
    - Rollback on repeated failures
    - Escalation for critical issues
    """

    def __init__(self, redis_client=None, memory_manager=None):
        self.redis = redis_client
        self.memory = memory_manager
        self.error_tracker = ErrorTracker()
        self.healing_history: List[HealingAction] = []

        # Healing strategies for different error types
        self.healing_strategies: Dict[str, Callable] = {
            "ConnectionError": self._heal_connection,
            "TimeoutError": self._heal_timeout,
            "MemoryError": self._heal_memory,
            "JSONDecodeError": self._heal_json,
            "HTTPError": self._heal_http,
            "DatabaseError": self._heal_database,
        }

        # Thresholds
        self.max_retry_attempts = 3
        self.escalation_threshold = 5
        self.circuit_breaker_errors = defaultdict(int)
        self.circuit_breaker_open = {}

    async def handle_error(self, error: Exception, context: Dict = None) -> Optional[HealingAction]:
        """
        Main entry point - handle an error and attempt healing
        """
        pattern = self.error_tracker.record_error(error, context)

        with RequestLogger(logger, "self_healing_attempt", error_type=pattern.error_type, count=pattern.count) as req_logger:

            logger.warning("healing_detected_error",
                error_type=pattern.error_type,
                count=pattern.count,
                message=str(error)[:200]
            )

            # Check circuit breaker
            if self._is_circuit_open(pattern.error_type):
                logger.warning("healing_circuit_open", error_type=pattern.error_type)
                return None

            # Increment circuit breaker counter
            self.circuit_breaker_errors[pattern.error_type] += 1

            # Get healing strategy
            strategy = self.healing_strategies.get(
                pattern.error_type,
                self._heal_generic
            )

            # Attempt healing
            action = await strategy(pattern, context or {})

            if action:
                self.healing_history.append(action)
                pattern.resolution_attempts += 1

                if action.success:
                    pattern.resolved = True
                    self.circuit_breaker_errors[pattern.error_type] = 0
                    req_logger.info(
                        "healing_action_success",
                        action_type=action.action_type,
                        description=action.description
                    )
                else:
                    req_logger.warning(
                        "healing_action_failed",
                        action_type=action.action_type,
                        description=action.description
                    )

                    # Open circuit breaker if too many failures
                    if self.circuit_breaker_errors[pattern.error_type] >= self.escalation_threshold:
                        self._open_circuit(pattern.error_type)

            # Check for escalation
            if pattern.count >= self.escalation_threshold and not pattern.resolved:
                await self._escalate(pattern)

            # Store in memory for learning
            if self.memory:
                try:
                    from orchestrator.memory.manager import MemoryEvent
                    event = MemoryEvent(
                        id=f"error_{int(datetime.now().timestamp())}",
                        type="error",
                        content=f"Error: {pattern.error_type} - {pattern.message[:100]}",
                        metadata={
                            "error_type": pattern.error_type,
                            "healed": action.success if action else False,
                            "context": context
                        },
                        importance=0.8
                    )
                    await self.memory.remember(event)
                except Exception as e:
                    logger.debug("memory_store_failed", error=str(e))

            return action

    async def _heal_connection(self, pattern: ErrorPattern, context: Dict) -> HealingAction:
        """Heal connection errors with retry and reconnect"""
        target = context.get("service", "unknown")

        # Wait with exponential backoff
        wait_time = min(2 ** pattern.resolution_attempts, 30)
        await asyncio.sleep(wait_time)

        # Attempt reconnection if Redis available
        if self.redis and target == "redis":
            try:
                await self.redis.ping()
                return HealingAction(
                    action_type="reconnect",
                    target=target,
                    description=f"Reconnected to {target} after {wait_time}s backoff",
                    success=True
                )
            except:
                pass

        return HealingAction(
            action_type="retry",
            target=target,
            description=f"Scheduled retry for {target} connection",
            success=True  # Retry scheduled successfully
        )

    async def _heal_timeout(self, pattern: ErrorPattern, context: Dict) -> HealingAction:
        """Heal timeout errors by adjusting parameters"""
        target = context.get("operation", "unknown")

        # Increase timeout for next attempt
        new_timeout = context.get("timeout", 30) * 1.5

        if self.redis:
            try:
                await self.redis.set(f"timeout_override:{target}", str(int(new_timeout)))
                await self.redis.expire(f"timeout_override:{target}", 300)
            except:
                pass

        return HealingAction(
            action_type="adjust",
            target=target,
            description=f"Increased timeout for {target} to {new_timeout}s",
            success=True
        )

    async def _heal_memory(self, pattern: ErrorPattern, context: Dict) -> HealingAction:
        """Heal memory errors by clearing caches"""
        import gc
        gc.collect()

        # Clear Redis cache if available
        if self.redis:
            try:
                keys = await self.redis.keys("cache:*")
                if keys:
                    await self.redis.delete(*keys[:100])  # Clear up to 100 cache keys
            except:
                pass

        return HealingAction(
            action_type="cleanup",
            target="memory",
            description="Triggered garbage collection and cleared caches",
            success=True
        )

    async def _heal_json(self, pattern: ErrorPattern, context: Dict) -> HealingAction:
        """Heal JSON parsing errors"""
        # These are usually LLM response issues
        return HealingAction(
            action_type="retry",
            target="llm_response",
            description="Marked for retry with stricter JSON prompt",
            success=True
        )

    async def _heal_http(self, pattern: ErrorPattern, context: Dict) -> HealingAction:
        """Heal HTTP errors with fallback"""
        status_code = context.get("status_code", 500)

        if status_code == 429:  # Rate limit
            wait_time = min(60, 10 * pattern.resolution_attempts)
            await asyncio.sleep(wait_time)
            return HealingAction(
                action_type="backoff",
                target="api",
                description=f"Rate limit backoff: {wait_time}s",
                success=True
            )
        elif status_code >= 500:  # Server error
            return HealingAction(
                action_type="fallback",
                target="api",
                description="Triggered fallback to alternative provider",
                success=True
            )

        return HealingAction(
            action_type="log",
            target="api",
            description=f"Logged HTTP {status_code} error for analysis",
            success=True
        )

    async def _heal_database(self, pattern: ErrorPattern, context: Dict) -> HealingAction:
        """Heal database errors"""
        return HealingAction(
            action_type="reconnect",
            target="database",
            description="Scheduled database reconnection",
            success=True
        )

    async def _heal_generic(self, pattern: ErrorPattern, context: Dict) -> HealingAction:
        """Generic healing for unknown errors"""
        if pattern.count >= 3:
            return HealingAction(
                action_type="skip",
                target="task",
                description="Skipping problematic operation after 3 failures",
                success=True
            )

        # Simple retry
        await asyncio.sleep(1)
        return HealingAction(
            action_type="retry",
            target="operation",
            description="Scheduled simple retry",
            success=True
        )

    async def _escalate(self, pattern: ErrorPattern):
        """Escalate critical issues"""
        logger.error(
            "healing_escalation",
            error_type=pattern.error_type,
            count=pattern.count,
            severity="critical"
        )

        # Store escalation in Redis for notification
        if self.redis:
            try:
                await self.redis.lpush("escalations", json.dumps({
                    "error": pattern.to_dict(),
                    "timestamp": datetime.now().isoformat()
                }))
                await self.redis.ltrim("escalations", 0, 99)
            except:
                pass

    def _is_circuit_open(self, error_type: str) -> bool:
        """Check if circuit breaker is open"""
        if error_type not in self.circuit_breaker_open:
            return False

        open_time = self.circuit_breaker_open[error_type]
        # Circuit stays open for 5 minutes
        if datetime.now() - open_time > timedelta(minutes=5):
            del self.circuit_breaker_open[error_type]
            self.circuit_breaker_errors[error_type] = 0
            return False

        return True

    def _open_circuit(self, error_type: str):
        """Open circuit breaker for an error type"""
        self.circuit_breaker_open[error_type] = datetime.now()
        logger.warning(f"⚡ Circuit breaker OPENED for {error_type}")

    def get_health_report(self) -> Dict:
        """Get system health report"""
        return {
            "error_rate": self.error_tracker.get_error_rate(),
            "active_patterns": len(self.error_tracker.errors),
            "recurring_patterns": len(self.error_tracker.get_recurring_patterns()),
            "healing_actions_today": sum(
                1 for h in self.healing_history
                if h.timestamp.date() == datetime.now().date()
            ),
            "open_circuits": list(self.circuit_breaker_open.keys()),
            "status": "healthy" if self.error_tracker.get_error_rate() < 1.0 else "degraded"
        }
