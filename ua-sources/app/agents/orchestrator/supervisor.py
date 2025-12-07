from typing import Dict, Any, Optional
import logging
from ..data.retriever_agent import RetrieverAgent
from ..analysis.miner_agent import MinerAgent
from ..core.arbiter_agent import ArbiterAgent
from ...services.llm_service import get_llm_service
from ...services.federation_service import get_federation_service

logger = logging.getLogger("nexus.supervisor")

class NexusSupervisor:
    """
    Main orchestration engine for Predator Analytics MAS.
    Coordinates agents to fulfill user requests.
    """
    def __init__(self):
        self.retriever = RetrieverAgent()
        self.miner = MinerAgent()
        self.arbiter = ArbiterAgent()
        logger.info("NexusSupervisor initialized with core agents")

    async def handle_request(self, user_query: str, mode: str = "auto", request_context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Processes a high-level user request through the agent pipeline.
        Supported modes: 'auto', 'fast', 'precise', 'council', 'chat'
        """
        logger.info(f"Processing request: {user_query} [Mode: {mode}]")
        
        # 1. Fast Mode: Optimization for speed
        if mode == "fast":
            retrieval = await self.retriever.process({"query": user_query})
            return {
                "query": user_query, 
                "answer": f"[FAST] Found {len(retrieval.result.get('data',[]))} records. Summary not generated.",
                "trace": [{"agent": "retriever", "status": "success"}]
            }

        # 1.5 Chat Mode (LLM Direct)
        if mode == "chat":
            # Federation Commands Hook
            user_query_lower = user_query.lower()
            
            # Status Check
            if "status" in user_query_lower and ("node" in user_query_lower or "system" in user_query_lower):
                fed_service = get_federation_service()
                nodes = fed_service.get_active_nodes()
                if not nodes:
                     answer = "⚠️ **System Alert**: No Edge Nodes are currently connected to the Federation."
                else:
                    answer = "### 🌍 Federation Status\n\n"
                    for n in nodes:
                        answer += f"**🖥️ {n['info']['hostname']}**\n- ID: `{n['info']['node_id']}`\n- Status: 🟢 {n['status'].upper()}\n- Load: {n.get('load',0)}%\n- Tasks Completed: {n.get('tasks_completed', 0)}\n\n"
                return {"query": user_query, "answer": answer, "mode": "chat", "trace": [{"agent": "nexus", "action": "federation_status"}]}

            # Task Dispatch (Scan CSV)
            if ("scan" in user_query_lower or "import" in user_query_lower) and ".csv" in user_query_lower:
                fed_service = get_federation_service()
                path = "/Users/dima-mac/Documents/Predator_21/sample_data/companies_ukraine.csv" # Demo logic
                try:
                    task_id = fed_service.dispatch_task("scan_csv", {"path": path})
                    answer = f"🚀 **Federation Protocol Initiated**\n\nI have dispatched task `{task_id}` to the Edge Cluster.\n**Target**: `{path}`\n\nThe node will begin processing immediately."
                except Exception as e:
                    answer = f"⚠️ **Dispatch Failed**: {str(e)}\n\nPlease ensure at least one Edge Node is online."
                
                return {"query": user_query, "answer": answer, "mode": "chat", "trace": [{"agent": "nexus", "action": "dispatch_task"}]}

            try:
                llm = get_llm_service()
                answer = await llm.generate(
                    user_query, 
                    system_prompt="You are Predator, an advanced AI analytics system. Be concise, professional, and authoritarian."
                )
                return {
                    "query": user_query,
                    "answer": answer,
                    "mode": "chat",
                    "trace": [{"agent": "llm", "status": "success"}]
                }
            except Exception as e:
                logger.error(f"Chat failed: {e}")
                # Fallback to standard flow


        # 2. Standard Flow (Auto/Precise)
        retrieval = await self.retriever.process({"query": user_query})
        data = retrieval.result.get("data", [])
        source = retrieval.result.get("source", "unknown")
        
        insights = []
        if source != "unknown":
            miner_response = await self.miner.process({"data": data})
            insights = miner_response.result.get("insights", [])

        # 3. Council Mode: Multi-Agent Consensus
        if mode == "council":
            logger.info("Activating Council of Agents...")
            # Simulate multiple perspectives
            candidates = [
                f"[Security Agent]: No immediate threats found in {source}.",
                f"[Financial Agent]: Detected budget anomalies in {len(insights)} records.",
                f"[Legal Agent]: Compliance check required for provider X."
            ]
            arbiter_resp = await self.arbiter.process({"candidates": candidates})
            final_answer = arbiter_resp.result.get("best_response")
            return {
                "query": user_query,
                "answer": f"[COUNCIL DECISION]: {final_answer}",
                "trace": [
                    {"agent": "retriever", "status": "success"},
                    {"agent": "miner", "status": "success"},
                    {"agent": "council_security", "status": "simulated"},
                    {"agent": "council_financial", "status": "simulated"},
                    {"agent": "arbiter", "status": "success"}
                ]
            }

        # Default/Precise Mode logic
        final_answer = f"Analysis of {source} complete. Found {len(insights)} insights: {', '.join(insights)}"
        
        return {
            "query": user_query,
            "answer": final_answer,
            "mode": mode,
            "trace": [
                {"agent": "retriever", "status": "success"},
                {"agent": "miner", "status": "success"}
            ]
        }

# Singleton Instance
_supervisor_instance: Optional[NexusSupervisor] = None

def get_nexus_supervisor() -> NexusSupervisor:
    global _supervisor_instance
    if _supervisor_instance is None:
        _supervisor_instance = NexusSupervisor()
    return _supervisor_instance
