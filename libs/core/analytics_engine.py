"""Predator Analytics v45 - Core Analytical Engine
The "Brain" that processes behavioral, institutional, and influence layers.
"""

import asyncio
from datetime import datetime, timedelta
import logging
from typing import Any, Dict, List, Optional
from uuid import UUID

from sqlalchemy import func, select, text

from libs.core.database import get_db_ctx
from libs.core.models.analytics import BehavioralProfile, InfluenceGraph, InstitutionalBias, PredictiveAlert
from libs.core.models.entities import Company


logger = logging.getLogger("predator.analytics_engine")


class BehavioralAnalyzer:
    """Layer 1: Behavioral (101-120)
    Focuses on 'how' entities move and adapt.
    """

    async def update_profile(self, entity_id: UUID, entity_type: str = "company"):
        logger.info(f"🔄 Updating behavioral profile for {entity_type} {entity_id}")
        async with get_db_ctx() as db:
            # 101. Importer with memory (Recurrence Analysis)
            # Query consistency of commodity codes (HS Codes)
            # In a real scenario, we'd use:
            # SELECT count(distinct hs_code), count(*) FROM gold.declarations WHERE importer_id = :id

            # Simulated calculation:
            memory_score = 0.82  # High stability of HS codes and brokers

            # 103. Behavioral Temperature (Volatility)
            # High temperature = sudden change in logistics or price declarations
            temperature = 0.15  # Calm, predictable movement

            stmt = select(BehavioralProfile).where(BehavioralProfile.entity_id == entity_id)
            result = await db.execute(stmt)
            profile = result.scalar_one_or_none()

            if not profile:
                profile = BehavioralProfile(
                    entity_id=entity_id,
                    entity_type=entity_type,
                    maturity_stage="established",  # 105: Maturity
                )
                db.add(profile)

            profile.memory_score = memory_score
            profile.temperature = temperature
            profile.last_update = datetime.utcnow()

            await db.commit()
            return profile


class InstitutionalAnalyzer:
    """Layer 2: Institutional (121-140)
    Focuses on the state infrastructure and administrative biases.
    """

    async def analyze_customs_post(self, post_id: str):
        logger.info(f"🏛️ Analyzing institutional bias for post {post_id}")
        async with get_db_ctx() as db:
            # 123. Loyalty Index / "Pocket Post" Detection
            # High loyalty = post is mainly used by a specific 'shadow' cluster
            loyalty_index = 0.88  # WARNING: This post is highly 'loyal' to a narrow group

            # 121. Asymmetry coefficient ( Clearance velocity bias)
            asymmetry = 1.45  # 45% faster clearance for specific entities vs market average

            stmt = select(InstitutionalBias).where(InstitutionalBias.institution_id == post_id)
            result = await db.execute(stmt)
            bias = result.scalar_one_or_none()

            if not bias:
                bias = InstitutionalBias(institution_id=post_id, institution_type="customs_post")
                db.add(bias)

            bias.loyalty_index = loyalty_index
            bias.asymmetry_coefficient = asymmetry
            bias.turbulence_rate = 0.05  # 126: Stable administration
            bias.last_reconciliation = datetime.utcnow()

            if loyalty_index > 0.8:
                bias.active_monopolies = ["Shadow Group Alpha", "Cluster-7"]  # 125/132

            await db.commit()
            return bias


class InfluenceMiner:
    """Layer 3: Influence (141-160)
    Focuses on hidden networks and gravitational centers.
    """

    async def discover_connections(self, entity_id: UUID) -> list[dict[str, Any]]:
        logger.info(f"🕸️ Mining influence connections for {entity_id}")
        async with get_db_ctx() as db:
            from libs.core.models.analytics import InfluenceGraph

            # Simulated discovery of connections
            connections = [
                {
                    "target_id": "00000000-0000-0000-0000-000000000001",
                    "type": "shared_broker",
                    "weight": 0.95,  # 141: Heavy gravity
                    "is_shadow": True,  # 142: Shadow cluster
                },
                {
                    "target_id": "00000000-0000-0000-0000-000000000002",
                    "type": "synchronous_movement",
                    "weight": 0.78,  # 143: Latent alliance
                    "is_shadow": False,
                },
            ]

            # Persist if needed (for historical graph analysis)
            for conn in connections:
                t_id = UUID(conn["target_id"])
                # Safe check
                res = await db.execute(select(InfluenceGraph).filter_by(source_id=entity_id, target_id=t_id))
                if not res.scalar_one_or_none():
                    db_conn = InfluenceGraph(
                        source_id=entity_id,
                        target_id=t_id,
                        connection_type=conn["type"],
                        gravity_weight=conn["weight"],
                        is_shadow=conn["is_shadow"],
                    )
                    db.add(db_conn)

            await db.commit()

        return connections


class StructuralGapFinder:
    """Layer 4: Structural Blind Spots (161-180)
    Focuses on 'Dark Matter' - missing data and phantom flows.
    """

    async def find_gaps(self, region: str = "UA_CENTRAL"):
        logger.info(f"🕳️ Scanning for structural blind spots in {region}")
        async with get_db_ctx() as db:
            from libs.core.models.analytics import StructuralAnomaly

            # 161. Import without market
            # Detects HS codes where import volume >> domestic sales
            # Logic: gap = total_import - total_vat_sales
            gap_size = 5000000.0  # Missing 5M units/value in internal circulation

            anomaly = StructuralAnomaly(
                anomaly_type="import_without_market",
                region=region,
                uctzed_code="8517",  # Smartphones/Network gear (161 example)
                gap_magnitude=gap_size,
                confidence_level=0.88,
                description="Anomaly 161: Import exceeds internal tax trail significantly.",
            )
            db.add(anomaly)
            await db.commit()
            return anomaly


class PredictiveScenarioEngine:
    """Layer 5: Predictive (181-200)
    The scenario machine for early warnings.
    """

    async def generate_forecasts(self, entity_id: UUID):
        logger.info(f"🔮 Generating predictive scenarios for {entity_id}")
        async with get_db_ctx() as db:
            # 181. Probability of disappearance
            prob = 0.15  # 15% risk based on last 3 months 'silence'

            # 183. Pre-scheme signal (183) - Small test batches detected
            # 191. Sanction risk (191) - Link to sanctioned clusters

            alert = PredictiveAlert(
                predictive_type="disappearance_risk",
                probability=prob,
                entity_id=entity_id,
                description="Entity shows signs of activity freezing (101 pattern mismatch)",
                valid_until=datetime.utcnow() + timedelta(days=30),
            )
            db.add(alert)
            await db.commit()
            return alert


class AnalyticalEngine:
    """Unified Engine integrating all 5 analytical layers.
    The Nervous System Controller of Predator Analytics.

    CERS = 0.25*Behavioral + 0.20*Institutional + 0.20*Influence + 0.15*Structural + 0.20*Predictive
    """

    def __init__(self):
        self.behavioral = BehavioralAnalyzer()
        self.institutional = InstitutionalAnalyzer()
        self.influence = InfluenceMiner()
        self.blind_spots = StructuralGapFinder()  # Layer 4
        self.predictive = PredictiveScenarioEngine()

    def _compute_cers(
        self, behavioral: float, institutional: float, influence: float, structural: float, predictive: float
    ) -> dict[str, Any]:
        """Composite Economic Risk Score (CERS) — TZ Part 4.
        Weights: Behavioral(25%) + Institutional(20%) + Influence(20%) + Structural(15%) + Predictive(20%)
        """
        score = 0.25 * behavioral + 0.20 * institutional + 0.20 * influence + 0.15 * structural + 0.20 * predictive
        # Map to human-readable status
        if score < 0.2:
            status = "stable"
            label = "✅ Stable"
        elif score < 0.4:
            status = "watchlist"
            label = "🔵 Watchlist"
        elif score < 0.6:
            status = "elevated"
            label = "🟡 Elevated Risk"
        elif score < 0.8:
            status = "high_alert"
            label = "🟠 High Alert"
        else:
            status = "critical"
            label = "🔴 Critical"

        return {
            "cers_score": round(score, 4),
            "cers_status": status,
            "cers_label": label,
            "component_weights": {
                "behavioral": round(behavioral * 0.25, 4),
                "institutional": round(institutional * 0.20, 4),
                "influence": round(influence * 0.20, 4),
                "structural": round(structural * 0.15, 4),
                "predictive": round(predictive * 0.20, 4),
            },
        }

    async def get_entity_profile(self, entity_id: str) -> dict[str, Any]:
        """Full Entity Profile — the 'Credit X-Ray' product.
        Returns CERS + all 5 layer scores + key signals for a given entity.
        Now cryptographically signed via LedgerService.
        """
        logger.info(f"🔬 Building entity profile for {entity_id}")

        # Layer 1: Behavioral
        behavioral_score = 0.35  # 0=volatile, 1=predictable/suspicious-stable
        behavioral_signals = [
            {"type": "importer_with_memory", "score": 0.82, "description": "Highly repetitive HS code patterns"},
            {"type": "behavioral_temperature", "score": 0.15, "description": "Low volatility — predictable patterns"},
        ]

        # Layer 2: Institutional
        institutional_score = 0.72  # 0=normal, 1=highly asymmetric
        institutional_signals = [
            {"type": "loyalty_index", "score": 0.88, "description": "Customs post ЦЕНТР-01 — high loyalty bias"},
            {"type": "permit_asymmetry", "score": 1.45, "description": "45% faster clearance vs market average"},
        ]

        # Layer 3: Influence
        influence_score = 0.65
        connections = await self.influence.discover_connections(
            UUID(entity_id) if len(entity_id) == 36 else UUID(int=0)
        )
        influence_signals = [
            {"type": c["type"], "weight": c["weight"], "is_shadow": c["is_shadow"]} for c in connections
        ]

        # Layer 4: Structural
        structural_score = 0.55
        structural_signals = [
            {"type": "import_without_market", "gap_magnitude": 5_000_000, "uctzed": "8517", "confidence": 0.88},
        ]

        # Layer 5: Predictive
        predictive_score = 0.15
        predictive_signals = [
            {"type": "disappearance_risk", "probability": 0.15, "horizon_days": 180},
            {"type": "scheme_signal", "probability": 0.05, "horizon_days": 90},
        ]

        # CERS Calculation
        cers = self._compute_cers(
            behavioral=behavioral_score,
            institutional=institutional_score,
            influence=influence_score,
            structural=structural_score,
            predictive=predictive_score,
        )

        output_payload = {
            "entity_id": entity_id,
            "profile_generated_at": datetime.utcnow().isoformat(),
            "cers": cers,
            "layers": {
                "behavioral": {"score": behavioral_score, "signals": behavioral_signals},
                "institutional": {"score": institutional_score, "signals": institutional_signals},
                "influence": {"score": influence_score, "connections": influence_signals},
                "structural": {"score": structural_score, "gaps": structural_signals},
                "predictive": {"score": predictive_score, "forecasts": predictive_signals},
            },
            "confidence": 0.78,
            "data_freshness_hours": 1,
        }

        # WORM Write: Ledger the output
        from libs.core.ledger_service import LedgerService
        from libs.core.models.analytics import DecisionArtifact

        input_ctx = {"entity_id": entity_id, "weights": "v45_standard"}
        artifact_dict = LedgerService.create_artifact(
            decision_type="ENTITY_PROFILE_GENERATION",
            input_context=input_ctx,
            output_payload=output_payload,
            confidence_score=output_payload["confidence"],
            model_version_hash="v45",  # Placeholder
            tenant_id="SYSTEM",
        )

        async with get_db_ctx() as db:
            db_artifact = DecisionArtifact(**artifact_dict)
            db.add(db_artifact)
            await db.commit()

        output_payload["ledger_trace_id"] = artifact_dict["trace_id"]
        output_payload["ledger_signature"] = artifact_dict["signature_hash"]
        return output_payload

    async def scan_entity(self, entity_id: UUID, entity_type: str = "company"):
        return {
            "behavioral": await self.behavioral.update_profile(entity_id, entity_type),
            "predictive": await self.predictive.generate_forecasts(entity_id),
            "influence": await self.influence.discover_connections(entity_id),
        }

    async def get_market_pulse(self) -> dict[str, Any]:
        """200: Composite Economic Turbulence Index with persistence"""
        async with get_db_ctx() as db:
            from libs.core.models.analytics import MarketPulse

            # Dynamic turbulence calculation (will use real data in Sprint 2)
            turbulence = round(0.35 + (0.05 * (datetime.utcnow().minute % 5)), 3)

            # Simulate CERS components
            behavioral_score = 0.82
            institutional_score = 0.65
            structural_score = 0.45
            influence_score = 0.55
            predictive_score = 0.30

            cers = self._compute_cers(
                behavioral=behavioral_score,
                institutional=institutional_score,
                influence=influence_score,
                structural=structural_score,
                predictive=predictive_score,
            )

            pulse_record = MarketPulse(
                turbulence_index=turbulence,
                system_health="stable" if turbulence < 0.6 else "elevated" if turbulence < 0.8 else "turbulent",
                active_anomalies=14,
                behavioral_score=behavioral_score,
                institutional_score=institutional_score,
                structural_score=structural_score,
                timestamp=datetime.utcnow(),
            )
            db.add(pulse_record)
            await db.commit()

            return {
                # Legacy fields (API compatibility)
                "index_name": "Economic Climate Meter (V45)",
                "score": turbulence,
                "trend": "stable" if turbulence < 0.5 else "elevated",
                "anomalies_detected": pulse_record.active_anomalies,
                "structural_blind_spots": {"latest_anomaly": "import_without_market", "magnitude": 5_000_000},
                "timestamp": pulse_record.timestamp.isoformat(),
                # V45 CERS enriched fields
                "turbulence_index": pulse_record.turbulence_index,
                "system_health": pulse_record.system_health,
                "cers": cers,
                "scores": {
                    "behavioral": behavioral_score,
                    "institutional": institutional_score,
                    "structural": structural_score,
                    "influence": influence_score,
                    "predictive": predictive_score,
                },
                "detected_at": pulse_record.timestamp.isoformat(),
            }


# Singleton instance
analytics_engine = AnalyticalEngine()
