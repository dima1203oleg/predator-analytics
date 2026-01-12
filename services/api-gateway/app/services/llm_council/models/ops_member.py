from typing import Optional
import logging
from datetime import datetime
import asyncio

from .. import CouncilMember, CouncilResponse, PeerReview
from app.services.ops_service import ops_service
from app.services.llm import llm_service
from app.services.graph_service import graph_builder

logger = logging.getLogger(__name__)

class OpsCouncilMember(CouncilMember):
    """
    Infrastructure Sentinel - A council member that provides real-time system context.
    It uses specialized CLI tools to gather evidence before answering.
    """

    def __init__(self, model_id: str = "ops-sentinel-v25", provider: str = "predator-ops"):
        super().__init__(model_id=model_id, provider=provider)
        self.diagnostics_report = ""

    async def generate_response(
        self,
        query: str,
        context: Optional[str] = None
    ) -> CouncilResponse:
        """
        Gather system diagnostics and synthesize a fact-based opinion.
        """
        logger.info(f"Ops Sentinel gathering evidence for query: {query}")

        # 1. Gather Real Data
        try:
            from app.services.system_control_service import system_control_service
            lockdown_status = "ACTIVE" if await system_control_service.is_lockdown() else "DISABLED"

            # We run both doctor and container status if query is infra-related
            tasks = [
                ops_service.diagnose_system(query),
                ops_service.execute_tool("get_container_status", {}),
                graph_builder.get_graph_summary(tenant_id="00000000-0000-0000-0000-000000000000") # Default tenant
            ]
            diag_results = await asyncio.gather(*tasks)

            graph_sum = diag_results[2]
            graph_info = f"Nodes: {graph_sum.get('total_nodes', 0)}, Edges: {graph_sum.get('total_edges', 0)}" if 'error' not in graph_sum else "N/A"

            self.diagnostics_report = f"--- SECURITY PROTOCOL ---\nSYSTEM LOCKDOWN: {lockdown_status}\n\n--- KNOWLEDGE GRAPH ---\n{graph_info}\n\n--- COMPREHENSIVE DIAGNOSTICS ---\n{diag_results[0]}\n\n--- DOCKER STATUS ---\n{diag_results[1]}"
        except Exception as e:
            logger.error(f"Ops Sentinel failed to gather data: {e}")
            self.diagnostics_report = f"Error gathering infrastructure context: {str(e)}"

        # 2. Synthesize with LLM (to make it a peer-readable response)
        prompt = f"""
        You are the 'Ops Sentinel' in the Predator Analytics Council.
        Your job is to provide factual, infrastructure-based evidence for the deliberation.

        USER QUERY: {query}
        REAL-TIME SYSTEM DATA:
        {self.diagnostics_report}

        TASK:
        Provide a concise report (max 200 words) focusing on HOW the system's current state affects the query.
        Be objective. If the data shows failure, point it out.
        """

        synth_response = await llm_service.generate_with_routing(
            prompt=prompt,
            system="Predator Ops Sentinel Mode. Focus on facts and infra stability.",
            mode="fast"
        )

        response = CouncilResponse(
            model_id=self.model_id,
            text=synth_response.content,
            confidence=0.95 if synth_response.success else 0.5,
            reasoning="Evidence gathered via System Doctor and Docker CLI.",
            metadata={"raw_diagnostics": self.diagnostics_report},
            timestamp=datetime.now()
        )

        self.response_history.append(response)
        return response

    async def review_response(
        self,
        response: CouncilResponse,
        original_query: str
    ) -> PeerReview:
        """
        Review another model's response based on whether it contradicts real-world infra data.
        """
        prompt = f"""
        As the Ops Sentinel, verify if this peer response is consistent with the current system state.

        ORIGINAL QUERY: {original_query}
        PEER RESPONSE: {response.text}
        REAL-TIME SYSTEM DATA: {self.diagnostics_report}

        Does this peer acknowledge the actual system status?
        If they suggest an action, is it feasible given the current container statuses?
        """

        review_res = await llm_service.generate_with_routing(
            prompt=prompt,
            system="Predator Ops Audit Mode. Check for contradictions with manual diagnostics.",
            mode="fast"
        )

        # Simple extraction logic (usually would be more structured)
        content = review_res.content
        score = 0.8 # Default
        if "contradict" in content.lower() or "incorrect" in content.lower():
            score = 0.4

        return PeerReview(
            reviewer_id=self.model_id,
            reviewed_response_id=response.model_id,
            score=score,
            critique=content,
            strengths=["Uses infra-awareness"] if score > 0.7 else [],
            weaknesses=["Ignores system health"] if score < 0.6 else []
        )
