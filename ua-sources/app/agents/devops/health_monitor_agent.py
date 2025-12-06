from typing import Dict, Any, List
import logging
from ..core.base_agent import BaseAgent, AgentResponse, AgentConfig

class HealthMonitorAgent(BaseAgent):
    def __init__(self):
        super().__init__(AgentConfig(name="HealthMonitor"))
        self.monitored_services = ["postgres", "redis", "qdrant", "opensearch", "minio"]

    async def process(self, inputs: Dict[str, Any]) -> AgentResponse:
        target = inputs.get("target", "all")
        self._log_activity(f"Checking health for: {target}")
        
        # Simulation of health checks
        report = {}
        issues = []
        
        for service in self.monitored_services:
            if target == "all" or target == service:
                # Mock check
                status = "healthy"
                # Random failure simulation (commented out for stability)
                # if service == "redis" and random.random() < 0.1: status = "down"
                
                report[service] = status
                if status != "healthy":
                    issues.append(f"{service} is {status}")
        
        action_plan = []
        if issues:
            action_plan = [f"Restart {s.split()[0]}" for s in issues]

        return AgentResponse(
            agent_name=self.name,
            result={
                "status": "degraded" if issues else "healthy",
                "details": report,
                "action_plan": action_plan
            },
            metadata={"checked_count": len(report)}
        )
