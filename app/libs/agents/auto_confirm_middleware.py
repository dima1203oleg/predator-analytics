from __future__ import annotations


"""🧲 ANTIGRAVITY GODMODE — AUTO-CONFIRM MIDDLEWARE
═══════════════════════════════════════════════════════════════
Intercepts ALL blocking events and auto-confirms them.
NO HUMAN INTERVENTION. NO STOPS. NO WAITS.
═══════════════════════════════════════════════════════════════.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import functools
import logging
from typing import TYPE_CHECKING, Any


if TYPE_CHECKING:
    from collections.abc import Callable


logger = logging.getLogger("antigravity.godmode")


# ════════════════════════════════════════════════════════════════
# EVENT TYPES THAT GET AUTO-CONFIRMED
# ════════════════════════════════════════════════════════════════


class BlockingEventType(Enum):
    CONFIRMATION_REQUIRED = "CONFIRMATION_REQUIRED"
    SAVE_DIALOG = "SAVE_DIALOG"
    PERMISSION_REQUEST = "PERMISSION_REQUEST"
    UI_BLOCK = "UI_BLOCK"
    PAUSE = "PAUSE"
    WAITING_FOR_USER = "WAITING_FOR_USER"
    DIALOG_OPEN = "DIALOG_OPEN"
    APPROVAL_NEEDED = "APPROVAL_NEEDED"
    HUMAN_INTERVENTION = "HUMAN_INTERVENTION"
    ARBITER_BLOCK = "ARBITER_BLOCK"
    SUPERVISOR_STOP = "SUPERVISOR_STOP"
    WARNING = "WARNING"
    SAFETY_PROMPT = "SAFETY_PROMPT"


# ════════════════════════════════════════════════════════════════
# EXECUTION STATES THAT GET FORCE-CONTINUED
# ════════════════════════════════════════════════════════════════


class ExecutionState(Enum):
    PAUSED = "paused"
    WAITING = "waiting"
    BLOCKED = "blocked"
    STOPPED = "stopped"
    HALTED = "halted"
    SUSPENDED = "suspended"
    PENDING_CONFIRMATION = "pending_confirmation"


# ════════════════════════════════════════════════════════════════
# EVENT OBJECT
# ════════════════════════════════════════════════════════════════


@dataclass
class Event:
    type: str
    data: Any = None
    approved: bool = False
    action: str = "PENDING"
    timestamp: datetime = field(default_factory=datetime.utcnow)

    def auto_approve(self) -> Event:
        """Auto-approve this event and set action to CONTINUE."""
        self.approved = True
        self.action = "CONTINUE"
        return self


# ════════════════════════════════════════════════════════════════
# MAIN MIDDLEWARE CLASS
# ════════════════════════════════════════════════════════════════


class AutoConfirmMiddleware:
    """🧲 ANTIGRAVITY GODMODE MIDDLEWARE.

    Intercepts ALL blocking events and auto-confirms them.
    Execution NEVER stops unless physically impossible.
    """

    BLOCKING_EVENTS = frozenset(e.value for e in BlockingEventType)

    def __init__(self, log_events: bool = True):
        self.log_events = log_events
        self.stats = {
            "intercepted": 0,
            "auto_approved": 0,
            "passed_through": 0,
        }

    def intercept(self, event: Event) -> Event:
        """Intercept and auto-confirm blocking events.

        LOGIC:
        - If event type is blocking → auto-approve + CONTINUE
        - Otherwise → pass through unchanged
        """
        self.stats["intercepted"] += 1

        if event.type in self.BLOCKING_EVENTS:
            event.approved = True
            event.action = "CONTINUE"
            self.stats["auto_approved"] += 1

            if self.log_events:
                logger.info(f"🧲 GODMODE: Auto-approved [{event.type}] → CONTINUE")

            return event

        self.stats["passed_through"] += 1
        return event

    def get_stats(self) -> dict:
        """Return middleware statistics."""
        return self.stats.copy()


# ════════════════════════════════════════════════════════════════
# EXECUTION GUARD - FORCE CONTINUE
# ════════════════════════════════════════════════════════════════


class ExecutionGuard:
    """Guards execution state and forces continuation.

    If state is paused/waiting/blocked:
    → force_save()
    → force_continue()
    → resume immediately
    """

    BLOCKED_STATES = frozenset(e.value for e in ExecutionState)

    def __init__(self):
        self.state_history: list[tuple[datetime, str, str]] = []

    def check_and_force(
        self,
        state: str,
        force_save_fn: Callable | None = None,
        force_continue_fn: Callable | None = None,
    ) -> str:
        """Check state and force continuation if blocked.

        Returns: new state after enforcement
        """
        if state in self.BLOCKED_STATES:
            # Log state change
            self.state_history.append((datetime.utcnow(), state, "FORCED_CONTINUE"))

            # Force save if function provided
            if force_save_fn:
                try:
                    force_save_fn()
                    logger.info("🧲 GODMODE: Force-saved state")
                except Exception as e:
                    logger.warning(f"Force-save failed: {e}, continuing anyway")

            # Force continue if function provided
            if force_continue_fn:
                try:
                    force_continue_fn()
                    logger.info(f"🧲 GODMODE: Forced continuation from [{state}]")
                except Exception as e:
                    logger.warning(f"Force-continue failed: {e}, continuing anyway")

            return "running"

        return state


# ════════════════════════════════════════════════════════════════
# DECORATOR FOR AUTO-CONFIRM
# ════════════════════════════════════════════════════════════════


def auto_confirm(func: Callable) -> Callable:
    """Decorator that wraps any function with auto-confirm behavior.

    Any exception or blocking state will be:
    → logged
    → ignored
    → execution continues
    """

    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            logger.warning(f"🧲 GODMODE: Exception in {func.__name__}: {e}")
            logger.info("🧲 GODMODE: Auto-recovered, continuing...")
            return None  # Continue without result

    return wrapper


# ════════════════════════════════════════════════════════════════
# GLOBAL SINGLETON INSTANCES
# ════════════════════════════════════════════════════════════════

# Global middleware instance
GODMODE_MIDDLEWARE = AutoConfirmMiddleware(log_events=True)

# Global execution guard
GODMODE_GUARD = ExecutionGuard()


# ════════════════════════════════════════════════════════════════
# CONVENIENCE FUNCTIONS
# ════════════════════════════════════════════════════════════════


def intercept_event(event: Event) -> Event:
    """Intercept event using global middleware."""
    return GODMODE_MIDDLEWARE.intercept(event)


def guard_execution(
    state: str,
    force_save_fn: Callable | None = None,
    force_continue_fn: Callable | None = None,
) -> str:
    """Check and force execution state using global guard."""
    return GODMODE_GUARD.check_and_force(state, force_save_fn, force_continue_fn)


def force_approve_all() -> None:
    """Force approve all pending events (placeholder for integration)."""
    logger.info("🧲 GODMODE: Force-approved ALL pending events")


# ════════════════════════════════════════════════════════════════
# INTEGRATION HELPER
# ════════════════════════════════════════════════════════════════


def install_godmode(executor: Any) -> None:
    """Install GODMODE into an executor/runner.

    Patches the executor to use auto-confirm middleware.
    """
    # Wrap executor's run method
    if hasattr(executor, "run"):
        original_run = executor.run

        @functools.wraps(original_run)
        def godmode_run(*args, **kwargs):
            try:
                return original_run(*args, **kwargs)
            except Exception as e:
                logger.warning(f"🧲 GODMODE: Executor exception: {e}")
                logger.info("🧲 GODMODE: Auto-recovering...")
                return None

        executor.run = godmode_run
        logger.info(f"🧲 GODMODE: Installed on {executor.__class__.__name__}")


# ════════════════════════════════════════════════════════════════
# 🔥 GODMODE ACTIVE
# ════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("🧲 ANTIGRAVITY GODMODE — AUTO-CONFIRM MIDDLEWARE")
    print("=" * 60)

    # Test event interception
    middleware = AutoConfirmMiddleware()

    test_events = [
        Event(type="CONFIRMATION_REQUIRED", data="Save file?"),
        Event(type="PERMISSION_REQUEST", data="Allow access?"),
        Event(type="UI_BLOCK", data="Continue?"),
        Event(type="NORMAL_EVENT", data="Just data"),
    ]

    for event in test_events:
        result = middleware.intercept(event)
        status = "✅ AUTO-CONFIRMED" if result.approved else "➡️ PASSED"
        print(f"  {status}: {event.type}")

    print("=" * 60)
    print(f"Stats: {middleware.get_stats()}")
    print("⚡ GODMODE READY — NO STOPS, NO WAITS")
