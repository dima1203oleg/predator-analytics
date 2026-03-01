from __future__ import annotations


"""Webhook endpoint for Alertmanager integration with v45 auto-trigger system.
Receives alert firing events and automatically triggers optimization cycles.
"""

from datetime import datetime
import logging
from typing import Any

from fastapi import APIRouter, HTTPException, Request


logger = logging.getLogger(__name__)
webhook_router = APIRouter(prefix="/v45", tags=["webhooks"])


class AlertmanagerWebhookPayload:
    """Parse Alertmanager webhook payload."""

    def __init__(self, payload: dict[str, Any]):
        self.status = payload.get("status")
        self.alerts = payload.get("alerts", [])

    def get_trigger_actions(self) -> list[dict[str, str]]:
        """Extract v45_action labels from alerts."""
        actions = []
        for alert in self.alerts:
            labels = alert.get("labels", {})
            v45_action = labels.get("v45_action")
            if v45_action:
                actions.append(
                    {
                        "action": v45_action,
                        "severity": labels.get("severity", "info"),
                        "component": labels.get("component", "unknown"),
                        "summary": alert.get("annotations", {}).get("summary"),
                        "description": alert.get("annotations", {}).get("description"),
                    }
                )
        return actions


@webhook_router.post("/optimizer/webhook")
async def handle_alert_webhook(request: Request):
    """Receives Alertmanager webhook and auto-triggers optimization.

    Example payload:
    {
      "status": "firing",
      "alerts": [{
        "labels": {
          "alertname": "LowSemanticSearchQuality",
          "v45_action": "trigger_automl_retrain"
        }
      }]
    }
    """
    try:
        payload = await request.json()
        webhook = AlertmanagerWebhookPayload(payload)

        logger.info(f"Received Alertmanager webhook: status={webhook.status}")

        actions = webhook.get_trigger_actions()
        if not actions:
            logger.warning("No v45_action labels found in alerts")
            return {"status": "no_actions", "alert_count": len(webhook.alerts)}

        triggered_cycles = []

        for action in actions:
            logger.info(f"Processing v45 action: {action['action']}")
            cycle_id = f"{action['action']}_{datetime.utcnow().timestamp()}"
            triggered_cycles.append(cycle_id)

            # Log the action (actual implementation would call services)
            logger.info(f"Triggered cycle: {cycle_id} for action: {action['action']}")

        return {
            "status": "processed",
            "alert_count": len(webhook.alerts),
            "action_count": len(actions),
            "triggered_cycles": triggered_cycles,
            "timestamp": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        logger.error(f"Error processing webhook: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
