import json
import hashlib
import uuid
from typing import Any, Dict, Optional
from datetime import datetime

class LedgerService:
    """
    Decision Ledger Service
    Responsible for generating immutable, cryptographically signed decision artifacts.
    This guarantees that the logic and exact inputs that led to a specific output
    (e.g., 'CERS > High Alert') cannot be repudiated or altered silently.
    """

    @staticmethod
    def _hash_payload(payload: Any) -> str:
        """
        Creates a deterministic SHA-256 hash of a JSON-serializable payload.
        Ensures keys are sorted to guarantee the same hash for the same data.
        """
        if payload is None:
            return hashlib.sha256(b"").hexdigest()
        
        if not isinstance(payload, str):
            payload_str = json.dumps(payload, sort_keys=True, separators=(',', ':'))
        else:
            payload_str = payload

        return hashlib.sha256(payload_str.encode('utf-8')).hexdigest()

    @classmethod
    def create_artifact(
        cls,
        decision_type: str,
        input_context: Dict[str, Any],
        output_payload: Dict[str, Any],
        confidence_score: float = 1.0,
        model_version_hash: Optional[str] = None,
        tenant_id: Optional[str] = None,
        trace_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Constructs a decision artifact with cryptographically guaranteed integrity.
        This dict is intended to be inserted directly into the decision_artifacts table.
        """
        artifact_id = str(uuid.uuid4())
        created_at = datetime.utcnow()
        trace_id = trace_id or str(uuid.uuid4())

        # 1. Deterministic hash of the exact input context that led to this decision
        input_hash = cls._hash_payload(input_context)

        # 2. Serialize output payload
        output_data = json.loads(json.dumps(output_payload, sort_keys=True))

        # 3. Create the final signature hash. 
        # This binds the trace, type, input, output, and time together.
        signature_material = {
            "trace_id": trace_id,
            "decision_type": decision_type,
            "input_context_hash": input_hash,
            "output_payload": output_data,
            "created_at_iso": created_at.isoformat()
        }
        signature_hash = cls._hash_payload(signature_material)

        return {
            "id": artifact_id,
            "tenant_id": tenant_id,
            "trace_id": trace_id,
            "decision_type": decision_type,
            "input_context_hash": input_hash,
            "model_version_hash": model_version_hash,
            "output_payload": output_data,
            "confidence_score": float(confidence_score),
            "signature_hash": signature_hash,
            "created_at": created_at
        }

    @classmethod
    def verify_artifact(cls, artifact_record: Dict[str, Any]) -> bool:
        """
        Verifies that a loaded decision artifact has not been tampered with.
        Recalculates the signature_hash and compares it to the stored one.
        """
        try:
            # Reconstruct the signature material
            signature_material = {
                "trace_id": artifact_record["trace_id"],
                "decision_type": artifact_record["decision_type"],
                "input_context_hash": artifact_record["input_context_hash"],
                "output_payload": artifact_record["output_payload"],
                "created_at_iso": artifact_record["created_at"].isoformat() if isinstance(artifact_record["created_at"], datetime) else artifact_record["created_at"]
            }
            
            expected_hash = cls._hash_payload(signature_material)
            
            return expected_hash == artifact_record["signature_hash"]
            
        except KeyError:
            # Missing critical fields means the artifact is invalid/corrupted
            return False
