import logging
from typing import Dict, Any, List
import random

logger = logging.getLogger(__name__)

class IncidentManager:
    """
    Incident Manager (COMP-211)
    Automatically detects and classifies system or data incidents, 
    triggering alerts and automated response playbooks.
    """
    def __init__(self):
        self.incidents = []

    def detect_incidents(self) -> List[Dict[str, Any]]:
        """
        Simulates incident detection logic.
        """
        if random.random() > 0.8:
            new_incident = {
                "id": f"INC-{random.randint(1000, 9999)}",
                "severity": random.choice(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
                "type": random.choice(["API_LATENCY", "DATA_QUALITY", "POD_RESTART", "OOM"]),
                "timestamp": "2026-03-08T19:42:00Z"
            }
            self.incidents.append(new_incident)
            
        return self.incidents[-5:] # Return last 5

    def resolve_incident(self, incident_id: str) -> Dict[str, Any]:
        return {"incident_id": incident_id, "status": "resolved", "action": "Restarted microservice"}
