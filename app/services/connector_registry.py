from __future__ import annotations


"""Connector Registry - Central registry for all data connectors."""
from typing import Any, Dict

from ..connectors.customs import customs_connector
from ..connectors.nbu_fx import nbu_fx_connector
from ..connectors.prozorro import prozorro_connector
from ..connectors.registry import registry_connector
from ..connectors.tax import tax_connector


# Нові connectors (v25.1)
try:
    from ..connectors.telegram_channel import telegram_channel_connector
except ImportError:
    telegram_channel_connector = None

try:
    from ..connectors.web_scraper import web_scraper_connector
except ImportError:
    web_scraper_connector = None


class ConnectorRegistry:
    """Central registry for data connectors."""

    def __init__(self):
        self.connectors = {
            "prozorro": prozorro_connector,
            "edr": registry_connector,
            "nbu": nbu_fx_connector,
            "tax": tax_connector,
            "customs": customs_connector,
        }

        # Додаємо нові connectors якщо вони доступні
        if telegram_channel_connector:
            self.connectors["telegram"] = telegram_channel_connector
        if web_scraper_connector:
            self.connectors["web"] = web_scraper_connector
            self.connectors["rss"] = web_scraper_connector  # RSS також обробляється web_scraper

    def get(self, name: str):
        """Get connector by name."""
        return self.connectors.get(name)

    def list_all(self):
        """List all connectors."""
        return list(self.connectors.keys())

    async def health_check_all(self) -> dict[str, Any]:
        """Check health of all connectors."""
        results = {}
        import asyncio

        # Optimize: Run checks in parallel
        connector_names = list(self.connectors.keys())
        tasks = [connector.health_check() for connector in self.connectors.values()]

        # Execute all tasks ensuring exceptions are caught
        checks = await asyncio.gather(*tasks, return_exceptions=True)

        for name, result in zip(connector_names, checks, strict=False):
            if isinstance(result, Exception):
                results[name] = "ERROR"
            else:
                try:
                    results[name] = result.value
                except AttributeError:
                    results[name] = str(result)

        return results


connector_registry = ConnectorRegistry()
