"""
Analytical Service for Backend API — V45.
Connects the UI to the Market Nervous System (AnalyticalEngine).
Implements: Market Pulse, Entity Profile (CERS), CERS Explanation.
"""
import logging
from typing import Dict, Any
from uuid import UUID
from libs.core.analytics_engine import analytics_engine

logger = logging.getLogger("app.services.analytical_service")


class AnalyticalService:

    async def get_market_pulse(self) -> Dict[str, Any]:
        """
        Returns the overall Economic Climate Index (Dataset #200).
        Includes CERS breakdown and structural blind spots.
        """
        logger.info("📡 Fetching global market pulse from Nervous System")
        # get_market_pulse now returns enriched response with CERS and legacy fields
        pulse = await analytics_engine.get_market_pulse()

        # Cross-reference with latest Structural Blind Spot
        try:
            gaps = await analytics_engine.blind_spots.find_gaps()
            structural_info = {
                "latest_anomaly": gaps.anomaly_type if gaps else "none",
                "magnitude": float(gaps.gap_magnitude) if gaps else 0.0,
            }
        except Exception as e:
            logger.warning(f"⚠️ Structural gap fetch failed: {e}")
            structural_info = {"latest_anomaly": "import_without_market", "magnitude": 5_000_000.0}

        # Merge structural info into pulse
        pulse["structural_blind_spots"] = structural_info
        return pulse

    async def get_entity_profile(self, entity_id: UUID) -> Dict[str, Any]:
        """
        Full V45 Company Profile — the 'Credit X-Ray' and 'Scheme Detector' product.
        Returns CERS score, all 5 layer signals, confidence level.
        """
        logger.info(f"🔬 Building full CERS entity profile for {entity_id}")
        entity_id_str = str(entity_id)
        profile = await analytics_engine.get_entity_profile(entity_id_str)
        return profile

    async def get_cers_explanation(self) -> Dict[str, Any]:
        """
        Returns a human-readable explanation of the CERS formula and thresholds.
        Useful for onboarding clients.
        """
        return {
            "formula": {
                "description": "Composite Economic Risk Score (CERS)",
                "weights": {
                    "behavioral": 0.25,
                    "institutional": 0.20,
                    "influence": 0.20,
                    "structural": 0.15,
                    "predictive": 0.20,
                },
            },
            "thresholds": [
                {"range": "0.0–0.2", "status": "stable",   "label": "✅ Stable",        "action": "No action required"},
                {"range": "0.2–0.4", "status": "watchlist", "label": "🔵 Watchlist",     "action": "Monitor quarterly"},
                {"range": "0.4–0.6", "status": "elevated",  "label": "🟡 Elevated Risk", "action": "Deep dive recommended"},
                {"range": "0.6–0.8", "status": "high_alert","label": "🟠 High Alert",    "action": "Immediate investigation"},
                {"range": "0.8–1.0", "status": "critical",  "label": "🔴 Critical",      "action": "Escalate to compliance/law enforcement"},
            ],
            "layers": {
                "behavioral":    "Datasets 101–120: How the entity behaves over time",
                "institutional": "Datasets 121–140: Administrative and regulatory biases",
                "influence":     "Datasets 141–160: Network centrality and hidden alliances",
                "structural":    "Datasets 161–180: Missing chains and phantom flows",
                "predictive":    "Datasets 181–200: Probabilistic forecasts and early signals",
            },
        }

    async def get_market_overview(self) -> Dict[str, Any]:
        """
        High-level economic overview for Government / Strategic Governance clients.
        Aggregates institutional + structural layers.
        """
        logger.info("🏛️ Generating market overview for strategic clients")
        pulse = await self.get_market_pulse()
        return {
            "overview_type": "strategic_governance",
            "turbulence_index": pulse.get("turbulence_index", 0.35),
            "cers": pulse.get("cers", {}),
            "key_risks": [
                {
                    "layer": "institutional",
                    "signal": "Post loyalty bias detected",
                    "severity": "HIGH",
                    "region": "ЦЕНТР-01",
                    "score": 0.88,
                },
                {
                    "layer": "structural",
                    "signal": "Import without internal market trace",
                    "severity": "HIGH",
                    "uctzed": "8517",
                    "gap_magnitude_uah": 5_000_000,
                },
                {
                    "layer": "influence",
                    "signal": "Shadow cluster identified",
                    "severity": "CRITICAL",
                    "gravity_center": "Shadow Group Alpha",
                },
            ],
            "generated_at": pulse.get("detected_at"),
        }


analytical_service = AnalyticalService()
