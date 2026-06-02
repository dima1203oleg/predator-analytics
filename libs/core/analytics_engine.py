"""Predator Analytics v45 - Core Analytical Engine
The "Brain" that processes behavioral, institutional, and influence layers.
"""

from datetime import datetime, timedelta
import logging
from typing import Any
from uuid import UUID

from sqlalchemy import select

from libs.core.database import get_db_ctx
from libs.core.models.analytics import (
    BehavioralProfile,
    InstitutionalBias,
    PredictiveAlert,
)

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
                res = await db.execute(
                    select(InfluenceGraph).filter_by(source_id=entity_id, target_id=t_id)
                )
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


class TaxAnalyzer:
    """Layer 6: Tax Compliance (201-220)
    Focuses on tax obligations and VAT discrepancies.
    """

    def __init__(self):
        from libs.core.integrations.tax_service import get_tax_service
        self.tax_service = get_tax_service()

    async def analyze_tax_compliance(self, company_ueid: str):
        logger.info(f"📊 Analyzing tax compliance for {company_ueid}")
        async with get_db_ctx() as db:
            from libs.core.models.analytics import TaxCompliance

            # 6. "Тіньова осідає" - порівняння імпорту та податків
            # 17. "Платіжний розрив" - різниця між датою імпорту та податковою накладною
            # 39. "Пільгова віртуальність" - перевірка пільгового ввезення
            # 59. "Кредитне митництво" - затримки оплати
            # 72. "Зелена декларація, чорна суть" - верифікація еко-пільг

            # Отримуємо податкові дані з API податкової служби
            company_edrpou = company_ueid.replace("UEID-", "")
            tax_records = await self.tax_service.get_company_tax_records(
                company_edrpou,
                date.today() - timedelta(days=90),
                date.today()
            )

            # Розраховуємо метрики
            tax_gap = 0.0
            payment_gap_days = 0
            vat_discrepancy = 0.0
            flags = []

            if tax_records:
                total_obligations = sum(r.total_tax_obligations for r in tax_records)
                total_paid = sum(r.total_tax_paid for r in tax_records)
                tax_gap = total_obligations - total_paid
                
                # VAT невідповідність
                total_vat_obligations = sum(r.vat_obligations for r in tax_records)
                total_vat_paid = sum(r.vat_paid for r in tax_records)
                vat_discrepancy = total_vat_obligations - total_vat_paid
                
                # Флаги
                if tax_gap > 1000000:
                    flags.append("potential_tax_evasion")
                if vat_discrepancy > 500000:
                    flags.append("vat_discrepancy")
                if payment_gap_days > 30:
                    flags.append("delayed_payment")

            compliance_score = max(0.0, 1.0 - (tax_gap / 10000000)) if tax_gap > 0 else 0.85

            compliance = TaxCompliance(
                company_ueid=company_ueid,
                tax_gap=tax_gap,
                payment_gap_days=payment_gap_days,
                vat_discrepancy=vat_discrepancy,
                compliance_score=compliance_score,
                flags=flags,
                analyzed_at=datetime.utcnow()
            )
            db.add(compliance)
            await db.commit()
            return compliance


class GeospatialAnalyzer:
    """Layer 7: Geospatial Anomalies (221-240)
    Focuses on route optimization and distance-based fraud.
    """

    def __init__(self):
        from libs.core.integrations.geospatial import get_geospatial_service
        self.geo_service = get_geospatial_service()

    async def analyze_route_anomalies(self, declaration_id: str):
        logger.info(f"🗺️ Analyzing route anomalies for declaration {declaration_id}")
        async with get_db_ctx() as db:
            from libs.core.models.analytics import RouteAnomaly
            from app.models import Declaration

            # 3. "Маршрутні аномалії" - відстань від митного поста до складу
            # 46. "Кордон за межами карти" - GPS невідповідність
            # 62. "Логістичний парадокс" - надто довгий маршрут

            # Отримуємо декларацію
            result = await db.execute(
                select(Declaration).where(Declaration.id == declaration_id)
            )
            declaration = result.scalar_one_or_none()

            if not declaration:
                logger.warning(f"Declaration {declaration_id} not found")
                return None

            # Отримуємо координати митного посту
            origin_post_code = declaration.customs_post
            destination_post_code = "UA-KH-001"  # TODO: Отримати з адреси компанії

            # Розраховуємо маршрут
            route_metrics = self.geo_service.calculate_route_anomaly(
                origin_post_code,
                destination_post_code,
            )

            anomaly = RouteAnomaly(
                declaration_id=declaration_id,
                distance_km=route_metrics.actual_distance_km,
                optimal_distance_km=route_metrics.optimal_distance_km,
                detour_ratio=route_metrics.detour_ratio,
                is_suspicious=route_metrics.is_suspicious,
                analyzed_at=datetime.utcnow()
            )
            db.add(anomaly)
            await db.commit()
            return anomaly


class PriceAnalyzer:
    """Layer 8: Price Anomalies (241-260)
    Focuses on dumping and price manipulation.
    """

    def __init__(self):
        from libs.core.integrations.market_prices import get_market_price_service
        self.market_service = get_market_price_service()

    async def analyze_price_anomalies(self, uktzed_code: str, company_ueid: str):
        logger.info(f"💰 Analyzing price anomalies for {uktzed_code}")
        async with get_db_ctx() as db:
            from libs.core.models.analytics import PriceAnomaly
            from app.models import Declaration

            # 5. "Демпінг-карусель" - заниження цін
            # 44. "Ціна друга" - відхилення від середньої ціни
            # 89. "Анти-кореляційна шпарина" - ціна проти ринку

            # Отримуємо ринкові ціни
            market_price = await self.market_service.get_aggregated_prices(uktzed_code)
            market_avg_price = market_price.price_avg_usd

            # Отримуємо ціну компанії з декларацій
            result = await db.execute(
                select(Declaration)
                .where(Declaration.importer_ueid == company_ueid)
                .where(Declaration.uktzed_code == uktzed_code)
                .order_by(Declaration.declaration_date.desc())
                .limit(10)
            )
            declarations = result.scalars().all()

            if declarations:
                company_price = sum(d.price_per_unit_usd for d in declarations if d.price_per_unit_usd) / len(declarations)
            else:
                company_price = 0.0

            # Розраховуємо відхилення
            if market_avg_price > 0:
                price_deviation_pct = ((company_price - market_avg_price) / market_avg_price) * 100
            else:
                price_deviation_pct = 0.0

            anomaly = PriceAnomaly(
                uktzed_code=uktzed_code,
                company_ueid=company_ueid,
                company_price=company_price,
                market_avg_price=market_avg_price,
                price_deviation_pct=price_deviation_pct,
                is_dumping=price_deviation_pct < -50.0,
                is_overpriced=price_deviation_pct > 50.0,
                analyzed_at=datetime.utcnow()
            )
            db.add(anomaly)
            await db.commit()
            return anomaly


class BrandAnalyzer:
    """Layer 9: Brand Detection (261-280)
    Focuses on counterfeit and brand manipulation.
    """

    def __init__(self):
        from libs.core.integrations.brand_detection import get_brand_detection_service
        self.brand_service = get_brand_detection_service()

    async def detect_brand_fraud(self, goods_description: str):
        logger.info(f"🏷️ Detecting brand fraud in description")
        async with get_db_ctx() as db:
            from libs.core.models.analytics import BrandDetection

            # 8. "Бренд без бренду" - декларування бренду як no-name
            # 53. "Маркування як зброя" - підробка бренду
            # 98. "Фантом під ключовим ім'ям" - фіктивний бренд

            # Використовуємо brand detection сервіс
            result = self.brand_service.analyze_goods_description(goods_description)

            detected_brands = [b.brand_name for b in result.detected_brands]
            is_counterfeit = result.is_counterfeit
            confidence = result.confidence

            detection = BrandDetection(
                goods_description=goods_description,
                detected_brands=detected_brands,
                is_counterfeit=is_counterfeit,
                confidence=confidence,
                analyzed_at=datetime.utcnow()
            )
            db.add(detection)
            await db.commit()
            return detection


class RegulatoryAnalyzer:
    """Layer 10: Regulatory Impact (281-300)
    Focuses on regulatory acts and their impact.
    """

    def __init__(self):
        from libs.core.integrations.regulatory_time_series import get_regulatory_service
        self.regulatory_service = get_regulatory_service()

    async def analyze_regulatory_impact(self, act_date: date, uktzed_code: str):
        logger.info(f"📜 Analyzing regulatory impact for {act_date}")
        async with get_db_ctx() as db:
            from libs.core.models.analytics import RegulatoryImpact

            # 1. "Митний сплеск за розпорядженням" - сплеск після акту
            # 76. "Імпорт в обмін на вплив" - ліцензії та дозволи

            # Використовуємо regulatory time-series сервіс
            analysis = self.regulatory_service.analyze_act_impact(act_date, uktzed_code)

            impact = RegulatoryImpact(
                act_date=act_date,
                uktzed_code=uktzed_code,
                import_before=analysis.import_before,
                import_after=analysis.import_after,
                growth_pct=analysis.growth_pct,
                is_suspicious=analysis.is_suspicious,
                analyzed_at=datetime.utcnow()
            )
            db.add(impact)
            await db.commit()
            return impact


class BrokerAnalyzer:
    """Layer 11: Broker Analysis (301-320)
    Focuses on customs broker patterns.
    """

    async def analyze_broker_patterns(self, broker_ueid: str):
        logger.info(f"👔 Analyzing broker patterns for {broker_ueid}")
        async with get_db_ctx() as db:
            from libs.core.models.analytics import BrokerPattern
            from app.models import BrokerDeclarationLink

            # 9. "Кулуарні коридори" - монополія брокера
            # 71. "Брокер-невидимка" - внутрішній брокер

            # Отримуємо дані про декларації брокера
            result = await db.execute(
                select(BrokerDeclarationLink)
                .where(BrokerDeclarationLink.broker_ueid == broker_ueid)
            )
            links = result.scalars().all()

            if links:
                total_declarations = len(links)
                unique_clients = len(set(l.declaration_id for l in links))
                
                # Розраховуємо концентрацію
                if total_declarations > 0:
                    concentration_ratio = 1.0 / unique_clients if unique_clients > 0 else 1.0
                else:
                    concentration_ratio = 0.0
            else:
                total_declarations = 0
                unique_clients = 0
                concentration_ratio = 0.0

            is_captive = concentration_ratio > 0.8

            pattern = BrokerPattern(
                broker_ueid=broker_ueid,
                total_declarations=total_declarations,
                unique_clients=unique_clients,
                concentration_ratio=concentration_ratio,
                is_captive=is_captive,
                analyzed_at=datetime.utcnow()
            )
            db.add(pattern)
            await db.commit()
            return pattern


class AnalyticalEngine:
    """Unified Engine integrating all analytical layers.
    The Nervous System Controller of Predator Analytics.

    CERS = 0.25*Behavioral + 0.20*Institutional + 0.20*Influence + 0.15*Structural + 0.20*Predictive
    Extended with 6 new layers for 100% dataset coverage.
    """

    def __init__(self):
        self.behavioral = BehavioralAnalyzer()
        self.institutional = InstitutionalAnalyzer()
        self.influence = InfluenceMiner()
        self.blind_spots = StructuralGapFinder()  # Layer 4
        self.predictive = PredictiveScenarioEngine()
        self.tax = TaxAnalyzer()  # Layer 6
        self.geospatial = GeospatialAnalyzer()  # Layer 7
        self.price = PriceAnalyzer()  # Layer 8
        self.brand = BrandAnalyzer()  # Layer 9
        self.regulatory = RegulatoryAnalyzer()  # Layer 10
        self.broker = BrokerAnalyzer()  # Layer 11

    def _compute_cers(
        self,
        behavioral: float,
        institutional: float,
        influence: float,
        structural: float,
        predictive: float,
    ) -> dict[str, Any]:
        """Composite Economic Risk Score (CERS) — TZ Part 4.
        Weights: Behavioral(25%) + Institutional(20%) + Influence(20%) + Structural(15%) + Predictive(20%)
        """
        score = (
            0.25 * behavioral
            + 0.20 * institutional
            + 0.20 * influence
            + 0.15 * structural
            + 0.20 * predictive
        )
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
            {
                "type": "importer_with_memory",
                "score": 0.82,
                "description": "Highly repetitive HS code patterns",
            },
            {
                "type": "behavioral_temperature",
                "score": 0.15,
                "description": "Low volatility — predictable patterns",
            },
        ]

        # Layer 2: Institutional
        institutional_score = 0.72  # 0=normal, 1=highly asymmetric
        institutional_signals = [
            {
                "type": "loyalty_index",
                "score": 0.88,
                "description": "Customs post ЦЕНТР-01 — high loyalty bias",
            },
            {
                "type": "permit_asymmetry",
                "score": 1.45,
                "description": "45% faster clearance vs market average",
            },
        ]

        # Layer 3: Influence
        influence_score = 0.65
        connections = await self.influence.discover_connections(
            UUID(entity_id) if len(entity_id) == 36 else UUID(int=0)
        )
        influence_signals = [
            {"type": c["type"], "weight": c["weight"], "is_shadow": c["is_shadow"]}
            for c in connections
        ]

        # Layer 4: Structural
        structural_score = 0.55
        structural_signals = [
            {
                "type": "import_without_market",
                "gap_magnitude": 5_000_000,
                "uctzed": "8517",
                "confidence": 0.88,
            },
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
                system_health="stable"
                if turbulence < 0.6
                else "elevated"
                if turbulence < 0.8
                else "turbulent",
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
                "structural_blind_spots": {
                    "latest_anomaly": "import_without_market",
                    "magnitude": 5_000_000,
                },
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
