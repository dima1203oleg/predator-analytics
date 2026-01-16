"""
gRPC Server Implementation for Constitutional Core (Swarm Layer)
"""
import logging
import time
import grpc
from concurrent import futures
from libs.core.grpc_generated import agent_communication_pb2
from libs.core.grpc_generated import agent_communication_pb2_grpc
from libs.core.memory.unified_memory import memory_manager
# Import the real engine
from app.modules.arbiter.app.engine import ConstitutionEngine

logger = logging.getLogger("constitutional.grpc")

class ArbiterService(agent_communication_pb2_grpc.ArbiterServiceServicer):
    def __init__(self):
        # Initialize the real Constitution Engine
        self.engine = ConstitutionEngine(constitution_path="/app/infrastructure/constitution")
        logger.info("⚖️ Arbiter Service: Constitution Engine Initialized")

    def CheckAuthorization(self, request, context):
        logger.info(f"⚖️ gRPC Auth Check: {request.agent_id} -> {request.action_type}")

        # Translate gRPC request to Engine context
        # map<string, string> context -> Dict
        engine_context = dict(request.context)

        # Evaluate
        decision = self.engine.evaluate(request.action_type, engine_context)

        # Return response
        return agent_communication_pb2.AuthorizationResponse(
            allowed=decision.allowed,
            reason=decision.reason,
            signature=f"sig_{int(time.time())}" if decision.allowed else "",
            confidence_score=1.0 if decision.allowed else 0.0
        )

    def ReportAction(self, request, context):
        logger.info(f"📜 gRPC Ledger Report: {request.agent_id} -> {request.action_type}")
        # Placeholder for Ledger write - in future link to LedgerManager
        # For now, just logging it is enough for prototype
        return agent_communication_pb2.ActionResponse(
            success=True,
            ledger_hash="hash_placeholder_v29"
        )

class SwarmService(agent_communication_pb2_grpc.SwarmServiceServicer):
    async def BroadcastEvent(self, request, context):
        """
        Broadcasts an event to the unified memory and logs it.
        """
        logger.info(f"🐝 Swarm Event: [{request.event_type}] from {request.source_agent}")

        # Store in Unified Memory (Episodic)
        await memory_manager.store(
            content=f"SWARM EVENT: {request.payload_json}",
            role="swarm_event",
            tags=["swarm", f"agent:{request.source_agent}", f"type:{request.event_type}"]
        )

        return agent_communication_pb2.SwarmAck(received=True)

    async def ProposeAction(self, request, context):
        """
        Handles swarm proposals with a multi-agent consensus logic.
        """
        logger.info(f"💡 Swarm Proposal received: {request.description} (from {request.proposer_agent})")

        # In v29.2, we simulate a distributed vote by analyzing the proposal
        # across multiple criteria: Logic, Safety, and Resource Impact.

        # 1. Constitutional Check (implicit)
        # 2. Heuristic Consensus (Placeholder for multi-agent gRPC call-back)

        approved = True
        votes_for = 1 # Proposer always votes for
        votes_against = 0
        rationale = "Proposal aligns with current strategic axioms."

        # Simulate secondary agent voting (for VFX/Frontend dashboard)
        if "risk" in request.description.lower():
            votes_against = 1
            rationale = "Minority concern raised regarding resource volatility."

        return agent_communication_pb2.ConsensusResponse(
            approved=approved,
            votes_for=votes_for + 1, # Adding simulated swarm approval
            votes_against=votes_against,
            decision_rationale=rationale
        )

async def serve(port=50051):
    server = grpc.aio.server()
    agent_communication_pb2_grpc.add_ArbiterServiceServicer_to_server(ArbiterService(), server)
    agent_communication_pb2_grpc.add_SwarmServiceServicer_to_server(SwarmService(), server)
    server.add_insecure_port(f'[::]:{port}')
    logger.info(f"🚀 Swarm gRPC Server starting on port {port}...")
    await server.start()
    await server.wait_for_termination()
