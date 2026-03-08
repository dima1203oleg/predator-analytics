from __future__ import annotations


"""Webhook Manager (COMP-020)

Управління вхідними та вихідними вебхуками.
Підтримує:
- Реєстрація webhook endpoints
- Retry з exponential backoff
- Signature verification (HMAC-SHA256)
- Event filtering
- Dead letter queue
"""
import hashlib
import hmac
import json
import logging
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any, Callable, Awaitable
from uuid import uuid4


logger = logging.getLogger("service.webhooks")


@dataclass
class WebhookRegistration:
    """Registered webhook endpoint."""
    webhook_id: str = field(default_factory=lambda: str(uuid4()))
    name: str = ""
    url: str = ""
    events: list[str] = field(default_factory=list)   # e.g. ["risk.alert", "fraud.detected"]
    secret: str = ""                                     # HMAC signing secret
    active: bool = True
    created_at: str = field(default_factory=lambda: datetime.now(UTC).isoformat())
    last_triggered: str | None = None
    failure_count: int = 0
    max_retries: int = 3

    def to_dict(self) -> dict[str, Any]:
        return {
            "webhook_id": self.webhook_id,
            "name": self.name,
            "url": self.url,
            "events": self.events,
            "active": self.active,
            "created_at": self.created_at,
            "last_triggered": self.last_triggered,
            "failure_count": self.failure_count,
        }


@dataclass
class WebhookDelivery:
    """Record of a webhook delivery attempt."""
    delivery_id: str = field(default_factory=lambda: str(uuid4()))
    webhook_id: str = ""
    event_type: str = ""
    payload: dict[str, Any] = field(default_factory=dict)
    status: str = "pending"        # pending, success, failed, dead_letter
    response_code: int | None = None
    response_body: str = ""
    attempts: int = 0
    created_at: str = field(default_factory=lambda: datetime.now(UTC).isoformat())
    delivered_at: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "delivery_id": self.delivery_id,
            "webhook_id": self.webhook_id,
            "event_type": self.event_type,
            "status": self.status,
            "response_code": self.response_code,
            "attempts": self.attempts,
            "created_at": self.created_at,
            "delivered_at": self.delivered_at,
        }


class WebhookManager:
    """Manages webhook registrations and deliveries.

    Features:
    - Register/unregister webhooks
    - Deliver events with HMAC-SHA256 signatures
    - Retry with exponential backoff
    - Dead letter queue for persistent failures
    """

    def __init__(self):
        self._webhooks: dict[str, WebhookRegistration] = {}
        self._deliveries: list[WebhookDelivery] = []
        self._dead_letters: list[WebhookDelivery] = []
        self._event_handlers: dict[str, list[Callable]] = {}
        logger.info("WebhookManager initialized")

    def register(
        self,
        name: str,
        url: str,
        events: list[str],
        secret: str = "",
        max_retries: int = 3,
    ) -> WebhookRegistration:
        """Register a new webhook."""
        webhook = WebhookRegistration(
            name=name,
            url=url,
            events=events,
            secret=secret or self._generate_secret(),
            max_retries=max_retries,
        )
        self._webhooks[webhook.webhook_id] = webhook
        logger.info("Webhook registered: %s → %s (events: %s)", name, url, events)
        return webhook

    def unregister(self, webhook_id: str) -> bool:
        """Unregister a webhook."""
        if webhook_id in self._webhooks:
            del self._webhooks[webhook_id]
            logger.info("Webhook unregistered: %s", webhook_id)
            return True
        return False

    def list_webhooks(self, active_only: bool = True) -> list[dict]:
        """List registered webhooks."""
        webhooks = self._webhooks.values()
        if active_only:
            webhooks = [w for w in webhooks if w.active]
        return [w.to_dict() for w in webhooks]

    async def emit(
        self,
        event_type: str,
        payload: dict[str, Any],
    ) -> list[WebhookDelivery]:
        """Emit an event to all matching webhooks.

        Args:
            event_type: Event identifier (e.g., "risk.alert")
            payload: Event payload
        """
        deliveries = []

        # Find matching webhooks
        for webhook in self._webhooks.values():
            if not webhook.active:
                continue

            if event_type in webhook.events or "*" in webhook.events:
                delivery = await self._deliver(webhook, event_type, payload)
                deliveries.append(delivery)

        # Trigger internal handlers
        if event_type in self._event_handlers:
            for handler in self._event_handlers[event_type]:
                try:
                    await handler(event_type, payload)
                except Exception as e:
                    logger.error(f"Event handler error for {event_type}: {e}")

        return deliveries

    def on_event(self, event_type: str, handler: Callable):
        """Register an internal event handler."""
        if event_type not in self._event_handlers:
            self._event_handlers[event_type] = []
        self._event_handlers[event_type].append(handler)

    def get_deliveries(
        self,
        webhook_id: str | None = None,
        limit: int = 50,
    ) -> list[dict]:
        """Get delivery history."""
        deliveries = self._deliveries
        if webhook_id:
            deliveries = [d for d in deliveries if d.webhook_id == webhook_id]
        return [d.to_dict() for d in deliveries[-limit:]]

    def get_dead_letters(self, limit: int = 50) -> list[dict]:
        """Get dead letter queue."""
        return [d.to_dict() for d in self._dead_letters[-limit:]]

    # --- Internal ---

    async def _deliver(
        self,
        webhook: WebhookRegistration,
        event_type: str,
        payload: dict[str, Any],
    ) -> WebhookDelivery:
        """Deliver webhook with retry."""
        import httpx

        delivery = WebhookDelivery(
            webhook_id=webhook.webhook_id,
            event_type=event_type,
            payload=payload,
        )

        body = json.dumps({
            "event": event_type,
            "data": payload,
            "timestamp": datetime.now(UTC).isoformat(),
            "delivery_id": delivery.delivery_id,
        }, default=str)

        # Sign payload
        signature = self._sign_payload(body, webhook.secret)

        headers = {
            "Content-Type": "application/json",
            "X-Predator-Signature": signature,
            "X-Predator-Event": event_type,
            "X-Predator-Delivery": delivery.delivery_id,
        }

        for attempt in range(webhook.max_retries):
            delivery.attempts = attempt + 1
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(
                        webhook.url,
                        content=body,
                        headers=headers,
                    )
                    delivery.response_code = resp.status_code
                    delivery.response_body = resp.text[:500]

                    if resp.status_code < 400:
                        delivery.status = "success"
                        delivery.delivered_at = datetime.now(UTC).isoformat()
                        webhook.last_triggered = delivery.delivered_at
                        webhook.failure_count = 0
                        break
                    else:
                        logger.warning(
                            "Webhook %s returned %d (attempt %d/%d)",
                            webhook.name, resp.status_code, attempt + 1, webhook.max_retries,
                        )

            except Exception as e:
                logger.warning(
                    "Webhook %s delivery failed (attempt %d/%d): %s",
                    webhook.name, attempt + 1, webhook.max_retries, e,
                )

            # Exponential backoff
            if attempt < webhook.max_retries - 1:
                import asyncio
                await asyncio.sleep(2 ** attempt)

        if delivery.status != "success":
            delivery.status = "failed"
            webhook.failure_count += 1

            # Move to dead letter queue after max failures
            if webhook.failure_count >= 5:
                webhook.active = False
                delivery.status = "dead_letter"
                self._dead_letters.append(delivery)
                logger.error(
                    "Webhook %s deactivated after %d failures",
                    webhook.name, webhook.failure_count,
                )

        self._deliveries.append(delivery)
        return delivery

    @staticmethod
    def _sign_payload(payload: str, secret: str) -> str:
        """Generate HMAC-SHA256 signature."""
        return hmac.new(
            secret.encode("utf-8"),
            payload.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

    @staticmethod
    def _generate_secret() -> str:
        """Generate random webhook secret."""
        import secrets
        return secrets.token_hex(32)


# Singleton
webhook_manager = WebhookManager()
