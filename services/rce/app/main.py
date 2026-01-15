"""
═══════════════════════════════════════════════════════════════
REALITY CONTEXT ENGINE (RCE)
Predator Analytics v28-S

Аналіз контексту реальності для валідації рішень.
Компоненти: Temporal, Spatial, Social Analyzers + Counterfactual Engine
═══════════════════════════════════════════════════════════════
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from datetime import datetime
from enum import Enum
import logging
import uuid

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("rce")

# ═══════════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════════

class CoherenceLevel(str, Enum):
    HIGH = "high"         # > 0.8
    MEDIUM = "medium"     # 0.5 - 0.8
    LOW = "low"           # < 0.5

class ContextAnalysisRequest(BaseModel):
    observation: Dict[str, Any] = Field(
        description="The observation to analyze"
    )
    context: Dict[str, Any] = Field(
        description="The context in which the observation occurred"
    )
    options: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Analysis options"
    )

class CoherenceScore(BaseModel):
    overall: float = Field(ge=0.0, le=1.0)
    temporal: float = Field(ge=0.0, le=1.0)
    spatial: float = Field(ge=0.0, le=1.0)
    social: float = Field(ge=0.0, le=1.0)
    confidence: float = Field(ge=0.0, le=1.0)
    level: CoherenceLevel
    warnings: List[str] = []

class Alternative(BaseModel):
    id: str
    description: str
    plausibility: float
    supporting_evidence: List[str] = []
    type: str = "alternative_explanation"

class ContextAnalysisResponse(BaseModel):
    analysis_id: str
    timestamp: datetime
    coherence: CoherenceScore
    component_analysis: Dict[str, Any]
    alternatives: List[Alternative] = []
    best_explanation: Dict[str, Any]
    processing_time_ms: float
    verified: bool = False

# ═══════════════════════════════════════════════════════════════
# ANALYZERS
# ═══════════════════════════════════════════════════════════════

class TemporalAnalyzer:
    """Аналізує часові аспекти: каузальність, послідовність, таймінг"""

    async def analyze(
        self,
        observation: Dict[str, Any],
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Perform temporal analysis"""
        events = observation.get("events", [])
        anomalies = []

        # Check causal chain
        causal_valid = self._check_causal_chain(events, anomalies)

        # Check sequence consistency
        sequence_valid = self._check_sequence(events, context, anomalies)

        # Check timing plausibility
        timing_valid = self._check_timing(events, context, anomalies)

        # Calculate score
        score = (
            (1.0 if causal_valid else 0.0) * 0.5 +
            (1.0 if sequence_valid else 0.0) * 0.3 +
            (1.0 if timing_valid else 0.0) * 0.2
        )

        return {
            "score": score,
            "causal_chain_valid": causal_valid,
            "sequence_consistent": sequence_valid,
            "timing_plausible": timing_valid,
            "anomalies": anomalies
        }

    def _check_causal_chain(self, events: List[Dict], anomalies: List[str]) -> bool:
        """Verify cause precedes effect"""
        for event in events:
            causes = event.get("caused_by", [])
            event_time = event.get("timestamp", 0)

            for cause_id in causes:
                cause_event = next(
                    (e for e in events if e.get("id") == cause_id),
                    None
                )
                if cause_event:
                    cause_time = cause_event.get("timestamp", 0)
                    if cause_time > event_time:
                        anomalies.append(
                            f"Causality violation: {cause_id} after {event.get('id')}"
                        )
                        return False
        return True

    def _check_sequence(
        self,
        events: List[Dict],
        context: Dict,
        anomalies: List[str]
    ) -> bool:
        """Check event sequence consistency"""
        expected = context.get("expected_sequence", [])
        if not expected:
            return True

        actual = [e.get("type") for e in sorted(
            events, key=lambda x: x.get("timestamp", 0)
        )]

        for i, exp in enumerate(expected):
            if i >= len(actual) or actual[i] != exp:
                anomalies.append(f"Sequence mismatch at {i}: expected {exp}")
                return False

        return True

    def _check_timing(
        self,
        events: List[Dict],
        context: Dict,
        anomalies: List[str]
    ) -> bool:
        """Check timing plausibility"""
        constraints = context.get("timing_constraints", {})

        for event in events:
            event_type = event.get("type")
            duration = event.get("duration_ms")

            if event_type in constraints and duration:
                min_ms = constraints[event_type].get("min_ms", 0)
                max_ms = constraints[event_type].get("max_ms", float("inf"))

                if duration < min_ms:
                    anomalies.append(f"{event_type} too fast: {duration}ms")
                    return False
                if duration > max_ms:
                    anomalies.append(f"{event_type} too slow: {duration}ms")
                    return False

        return True


class SpatialAnalyzer:
    """Аналізує просторові аспекти: обмеження ресурсів, локації"""

    async def analyze(
        self,
        observation: Dict[str, Any],
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Perform spatial analysis"""
        anomalies = []

        # Check resource constraints
        resources_valid = self._check_resources(observation, context, anomalies)

        # Check location constraints
        location_valid = self._check_location(observation, context, anomalies)

        # Check physical constraints
        physical_valid = self._check_physical_constraints(observation, context, anomalies)

        score = (
            (1.0 if resources_valid else 0.0) * 0.4 +
            (1.0 if location_valid else 0.0) * 0.3 +
            (1.0 if physical_valid else 0.0) * 0.3
        )

        return {
            "score": score,
            "resources_valid": resources_valid,
            "location_valid": location_valid,
            "physical_constraints_met": physical_valid,
            "anomalies": anomalies
        }

    def _check_resources(
        self,
        observation: Dict,
        context: Dict,
        anomalies: List[str]
    ) -> bool:
        """Check resource constraints"""
        resources_used = observation.get("resources_used", {})
        limits = context.get("resource_limits", {})

        for resource, used in resources_used.items():
            limit = limits.get(resource, float("inf"))
            if used > limit:
                anomalies.append(f"Resource {resource} exceeded: {used} > {limit}")
                return False

        return True

    def _check_location(
        self,
        observation: Dict,
        context: Dict,
        anomalies: List[str]
    ) -> bool:
        """Check location constraints"""
        location = observation.get("location")
        allowed = context.get("allowed_locations", [])

        if allowed and location and location not in allowed:
            anomalies.append(f"Location {location} not allowed")
            return False

        return True

    def _check_physical_constraints(
        self,
        observation: Dict,
        context: Dict,
        anomalies: List[str]
    ) -> bool:
        """Check physical/system constraints"""
        # In a real system, this would check things like:
        # - Network latency constraints
        # - Storage capacity
        # - Compute availability
        return True


class SocialAnalyzer:
    """Аналізує соціальні аспекти: ролі агентів, норми, етика"""

    async def analyze(
        self,
        observation: Dict[str, Any],
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Perform social analysis"""
        anomalies = []

        # Check role authorization
        role_valid = self._check_role(observation, context, anomalies)

        # Check norm compliance
        norm_valid = self._check_norms(observation, context, anomalies)

        # Check ethical constraints
        ethics_valid = self._check_ethics(observation, context, anomalies)

        score = (
            (1.0 if role_valid else 0.0) * 0.4 +
            (1.0 if norm_valid else 0.0) * 0.3 +
            (1.0 if ethics_valid else 0.0) * 0.3
        )

        return {
            "score": score,
            "role_authorized": role_valid,
            "norms_compliant": norm_valid,
            "ethics_valid": ethics_valid,
            "anomalies": anomalies
        }

    def _check_role(
        self,
        observation: Dict,
        context: Dict,
        anomalies: List[str]
    ) -> bool:
        """Check if actor has required role"""
        actor_role = observation.get("actor_role")
        required_roles = context.get("required_roles", [])

        if required_roles and actor_role not in required_roles:
            anomalies.append(f"Actor role {actor_role} not authorized")
            return False

        return True

    def _check_norms(
        self,
        observation: Dict,
        context: Dict,
        anomalies: List[str]
    ) -> bool:
        """Check norm compliance"""
        action_type = observation.get("action_type")
        forbidden_actions = context.get("forbidden_actions", [])

        if action_type in forbidden_actions:
            anomalies.append(f"Action {action_type} violates norms")
            return False

        return True

    def _check_ethics(
        self,
        observation: Dict,
        context: Dict,
        anomalies: List[str]
    ) -> bool:
        """Check ethical constraints"""
        # Check for potentially harmful actions
        potential_harms = observation.get("potential_harms", [])

        if potential_harms:
            for harm in potential_harms:
                if harm.get("severity") == "critical":
                    anomalies.append(f"Critical ethical concern: {harm.get('description')}")
                    return False

        return True


class CounterfactualEngine:
    """Генерує альтернативні пояснення"""

    async def generate_alternatives(
        self,
        observation: Dict[str, Any],
        context: Dict[str, Any],
        temporal_result: Dict,
        spatial_result: Dict,
        social_result: Dict,
        max_alternatives: int = 3
    ) -> List[Alternative]:
        """Generate alternative explanations"""
        alternatives = []

        # Generate based on failed checks
        if not temporal_result.get("causal_chain_valid"):
            alternatives.append(Alternative(
                id=f"alt_{uuid.uuid4().hex[:8]}",
                description="Events may have been logged out of order",
                plausibility=0.7,
                supporting_evidence=temporal_result.get("anomalies", [])
            ))

        if not spatial_result.get("resources_valid"):
            alternatives.append(Alternative(
                id=f"alt_{uuid.uuid4().hex[:8]}",
                description="Resource usage may have been miscalculated",
                plausibility=0.6,
                supporting_evidence=spatial_result.get("anomalies", [])
            ))

        if not social_result.get("role_authorized"):
            alternatives.append(Alternative(
                id=f"alt_{uuid.uuid4().hex[:8]}",
                description="Actor may have been delegated temporary permissions",
                plausibility=0.5,
                supporting_evidence=social_result.get("anomalies", [])
            ))

        # Default alternative if coherence is low
        if not alternatives:
            alternatives.append(Alternative(
                id=f"alt_{uuid.uuid4().hex[:8]}",
                description="Observation may be incomplete or context may be outdated",
                plausibility=0.4,
                supporting_evidence=["Low overall coherence score"]
            ))

        return alternatives[:max_alternatives]


# ═══════════════════════════════════════════════════════════════
# RCE SERVICE
# ═══════════════════════════════════════════════════════════════

class RCEService:
    """Reality Context Engine - Main Service"""

    def __init__(self):
        self.temporal = TemporalAnalyzer()
        self.spatial = SpatialAnalyzer()
        self.social = SocialAnalyzer()
        self.counterfactual = CounterfactualEngine()

    async def analyze_context(
        self,
        request: ContextAnalysisRequest
    ) -> ContextAnalysisResponse:
        """Perform full context analysis"""
        start_time = datetime.utcnow()

        # Run analyzers
        temporal_result = await self.temporal.analyze(
            request.observation, request.context
        )
        spatial_result = await self.spatial.analyze(
            request.observation, request.context
        )
        social_result = await self.social.analyze(
            request.observation, request.context
        )

        # Calculate coherence
        coherence = self._calculate_coherence(
            temporal_result, spatial_result, social_result
        )

        # Generate alternatives if needed
        alternatives = []
        if coherence.overall < 0.8:
            alternatives = await self.counterfactual.generate_alternatives(
                request.observation,
                request.context,
                temporal_result,
                spatial_result,
                social_result
            )

        # Determine best explanation
        best_explanation = self._get_best_explanation(
            coherence, alternatives
        )

        processing_time = (datetime.utcnow() - start_time).total_seconds() * 1000

        return ContextAnalysisResponse(
            analysis_id=str(uuid.uuid4()),
            timestamp=start_time,
            coherence=coherence,
            component_analysis={
                "temporal": temporal_result,
                "spatial": spatial_result,
                "social": social_result
            },
            alternatives=alternatives,
            best_explanation=best_explanation,
            processing_time_ms=processing_time,
            verified=coherence.overall >= 0.8
        )

    def _calculate_coherence(
        self,
        temporal: Dict,
        spatial: Dict,
        social: Dict
    ) -> CoherenceScore:
        """Calculate overall coherence score"""
        t_score = temporal.get("score", 0.5)
        s_score = spatial.get("score", 0.5)
        soc_score = social.get("score", 0.5)

        overall = t_score * 0.4 + s_score * 0.3 + soc_score * 0.3

        # Determine level
        if overall >= 0.8:
            level = CoherenceLevel.HIGH
        elif overall >= 0.5:
            level = CoherenceLevel.MEDIUM
        else:
            level = CoherenceLevel.LOW

        # Collect warnings
        warnings = []
        if t_score < 0.6:
            warnings.append("Low temporal coherence")
        if s_score < 0.6:
            warnings.append("Low spatial coherence")
        if soc_score < 0.6:
            warnings.append("Low social coherence")

        return CoherenceScore(
            overall=overall,
            temporal=t_score,
            spatial=s_score,
            social=soc_score,
            confidence=min(t_score, s_score, soc_score),
            level=level,
            warnings=warnings
        )

    def _get_best_explanation(
        self,
        coherence: CoherenceScore,
        alternatives: List[Alternative]
    ) -> Dict[str, Any]:
        """Get best explanation"""
        if coherence.overall >= 0.8:
            return {
                "type": "observed",
                "description": "Observation is consistent with context",
                "plausibility": coherence.overall
            }

        if alternatives:
            best = max(alternatives, key=lambda x: x.plausibility)
            return {
                "type": "alternative",
                "description": best.description,
                "plausibility": best.plausibility
            }

        return {
            "type": "uncertain",
            "description": "Unable to determine explanation",
            "plausibility": 0.0
        }


# ═══════════════════════════════════════════════════════════════
# FASTAPI APPLICATION
# ═══════════════════════════════════════════════════════════════

app = FastAPI(
    title="Predator RCE - Reality Context Engine",
    version="28.0.0",
    description="Analyzes context coherence for constitutional decision making"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rce_service = RCEService()

@app.get("/api/v1/rce/health")
async def health_check():
    return {"status": "healthy", "version": "28.0.0"}

@app.post("/api/v1/rce/analyze", response_model=ContextAnalysisResponse)
async def analyze_context(request: ContextAnalysisRequest):
    """Analyze context coherence for an observation"""
    try:
        return await rce_service.analyze_context(request)
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/rce/capabilities")
async def get_capabilities():
    """Get RCE capabilities"""
    return {
        "analyzers": [
            {
                "name": "temporal",
                "description": "Analyzes causal chains, sequences, and timing"
            },
            {
                "name": "spatial",
                "description": "Analyzes resource constraints and locations"
            },
            {
                "name": "social",
                "description": "Analyzes roles, norms, and ethics"
            }
        ],
        "counterfactual": {
            "enabled": True,
            "max_alternatives": 3
        }
    }

@app.on_event("startup")
async def startup():
    logger.info("🔍 RCE - Reality Context Engine starting...")
    logger.info("✅ RCE v28.0 operational")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8093)
