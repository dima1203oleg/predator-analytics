import grpc
import logging
import json
import time
from libs.core.grpc_generated import agent_communication_pb2
from libs.core.grpc_generated import agent_communication_pb2_grpc

logger = logging.getLogger("swarm.client")

class SwarmClient:
    """
    gRPC Client for Inter-Agent Communication and Constitutional Governance
    """
    def __init__(self, host="predator_governance", port=50051):
        # We use the container name "predator_governance" by default (from docker-compose)
        self.target = f"{host}:{port}"
        self.channel = None
        self.arbiter_stub = None
        self.swarm_stub = None

    def connect(self):
        if not self.channel:
            self.channel = grpc.insecure_channel(self.target)
            self.arbiter_stub = agent_communication_pb2_grpc.ArbiterServiceStub(self.channel)
            self.swarm_stub = agent_communication_pb2_grpc.SwarmServiceStub(self.channel)
            logger.info(f"Connected to Swarm at {self.target}")

    def check_authorization(self, agent_id, action_type, context=None):
        self.connect()
        try:
            req = agent_communication_pb2.AuthorizationRequest(
                agent_id=agent_id,
                action_type=action_type,
                target_resource=context.get("target", "") if context else "",
                context=context or {}
            )
            return self.arbiter_stub.CheckAuthorization(req)
        except grpc.RpcError as e:
            logger.error(f"RPC Error (Auth): {e}")
            return None

    async def broadcast_event(self, agent_id, event_type, payload, importance=50):
        self.connect()
        try:
            req = agent_communication_pb2.SwarmEvent(
                source_agent=agent_id,
                event_type=event_type,
                payload_json=json.dumps(payload),
                importance=importance,
                timestamp=str(time.time()),
                event_id=f"{agent_id}-{time.time()}"
            )
            return await self.swarm_stub.BroadcastEvent(req)
        except grpc.RpcError as e:
            logger.error(f"RPC Error (Broadcast): {e}")
            return None
    async def propose_action(self, agent_id: str, description: str, changes: dict):
        """
        Propose a change for swarm consensus via gRPC.
        """
        self.connect()
        try:
            req = agent_communication_pb2.Proposal(
                proposal_id=f"prop-{int(time.time())}-{agent_id[:4]}",
                proposer_agent=agent_id,
                description=description,
                changes_json=json.dumps(changes)
            )
            # Use unary call for proposal
            return await self.swarm_stub.ProposeAction(req)
        except grpc.RpcError as e:
            logger.error(f"RPC Error (Proposal): {e}")
            return None
