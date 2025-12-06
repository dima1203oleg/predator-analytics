"""Connector Registry - Central registry for all data connectors"""
from typing import Dict, Any
from ..connectors.prozorro import prozorro_connector
from ..connectors.registry import registry_connector
from ..connectors.nbu_fx import nbu_fx_connector
from ..connectors.tax import tax_connector
from ..connectors.customs import customs_connector


class ConnectorRegistry:
    """Central registry for data connectors"""
    
    def __init__(self):
        self.connectors = {
            "prozorro": prozorro_connector,
            "edr": registry_connector,
            "nbu": nbu_fx_connector,
            "tax": tax_connector,
            "customs": customs_connector,
        }
    
    def get(self, name: str):
        """Get connector by name"""
        return self.connectors.get(name)
    
    def list_all(self):
        """List all connectors"""
        return list(self.connectors.keys())
    
    async def health_check_all(self) -> Dict[str, Any]:
        """Check health of all connectors"""
        results = {}
        for name, connector in self.connectors.items():
            try:
                status = await connector.health_check()
                results[name] = status.value
            except Exception:
                results[name] = "ERROR"
        return results


connector_registry = ConnectorRegistry()
