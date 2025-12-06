from typing import Dict, Any, List
from ..core.base_agent import BaseAgent, AgentResponse, AgentConfig

class ArbiterAgent(BaseAgent):
    def __init__(self):
        super().__init__(AgentConfig(name="ArbiterAgent"))

    async def process(self, inputs: Dict[str, Any]) -> AgentResponse:
        candidates = inputs.get("candidates", [])
        self._log_activity(f"Arbitrating between {len(candidates)} responses")
        
        # Simple selection logic (pick the longest response for now)
        best_response = ""
        if candidates:
            best_response = max(candidates, key=len)
            
        return AgentResponse(
            agent_name=self.name,
            result={"best_response": best_response},
            metadata={"method": "length_heuristic"}
        )
