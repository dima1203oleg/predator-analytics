"""Integration Service - Manages external integrations"""
from typing import Dict, Any, List
from datetime import datetime, timezone


class IntegrationService:
    """External integrations manager"""
    
    def __init__(self):
        self.integrations = {}
    
    def register(self, name: str, config: Dict):
        """Register integration"""
        self.integrations[name] = {
            "config": config,
            "status": "ACTIVE",
            "registered_at": datetime.now(timezone.utc)
        }
    
    def get_status(self, name: str) -> Dict[str, Any]:
        """Get integration status"""
        return self.integrations.get(name, {"status": "NOT_FOUND"})
    
    def list_all(self) -> List[Dict]:
        """List all integrations"""
        return [{"name": k, **v} for k, v in self.integrations.items()]


integration_service = IntegrationService()
