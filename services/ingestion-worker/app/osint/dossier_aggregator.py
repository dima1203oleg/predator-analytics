"""Dossier Aggregator — Центральний оркестратор збору досьє.

Запускає всі збирачі паралельно, об'єднує результати,
будує граф зв'язків та логує аудит.
"""
from __future__ import annotations

import asyncio
from datetime import UTC, datetime
import os
import time
from typing import Any
import uuid

import httpx

from predator_common.logging import get_logger

from ..ml.osint_automl import OsintAutoML
from .collectors.base import (
    BaseCollector,
    Classification,
    CollectorResult,
    CollectorStatus,
    CompleteDossier,
    DossierQuery,
)

logger = get_logger("die.aggregator")


class DossierAggregator:
    """Центральний оркестратор Deep Intelligence Engine."""

    def __init__(self) -> None:
        self._collectors: list[BaseCollector] = []
        self._register_collectors()

        self.automl = OsintAutoML()
        model_path = os.path.join(os.path.dirname(__file__), '..', '..', 'models', 'risk_model.txt')
        self.automl.load_model(model_path)

    def _register_collectors(self) -> None:
        """Реєстрація всіх доступних збирачів."""
        # WHITE — Публічні реєстри
        from .collectors.dummy_person_collector import DummyPersonCollector
        from .collectors.blockchain_collector import BlockchainCollector
        from .collectors.corporate_web_collector import CorporateWebCollector
        from .collectors.court_collector import CourtCollector
        from .collectors.cyber_collector import CyberCollector
        from .collectors.darknet_collector import DarknetCollector
        from .collectors.document_collector import DocumentCollector
        from .collectors.edr_collector import EdrCollector
        from .collectors.interpol_collector import InterpolCollector

        # BLACK — Deep OSINT
        from .collectors.leak_collector import LeakCollector
        from .collectors.media_collector import MediaCollector
        from .collectors.metadata_collector import MetadataCollector
        from .collectors.pep_collector import PepCollector
        from .collectors.property_collector import PropertyCollector
        from .collectors.sanctions_collector import SanctionsCollector

        # GREY — OSINT
        from .collectors.social_media_collector import SocialMediaCollector
        from .collectors.tax_collector import TaxCollector
        from .collectors.telegram_collector import TelegramCollector
        from .collectors.vehicle_collector import VehicleCollector

        self._collectors = [
            # WHITE
            DummyPersonCollector(),
            EdrCollector(),
            CourtCollector(),
            PropertyCollector(),
            VehicleCollector(),
            TaxCollector(),
            SanctionsCollector(),
            PepCollector(),
            # GREY
            SocialMediaCollector(),
            TelegramCollector(),
            BlockchainCollector(),
            MediaCollector(),
            CorporateWebCollector(),
            CyberCollector(),
            MetadataCollector(),
            # BLACK
            LeakCollector(),
            DarknetCollector(),
            InterpolCollector(),
            DocumentCollector(),
        ]

        logger.info(f"🔧 Зареєстровано {len(self._collectors)} збирачів даних")

    def get_collectors_status(self) -> list[dict[str, Any]]:
        """Повертає статус усіх зареєстрованих збирачів."""
        return [
            {
                "name": c.name,
                "display_name": c.display_name,
                "classification": c.classification.value,
                "description": c.description,
                "supported_entities": [e.value for e in c.supported_entities],
            }
            for c in self._collectors
        ]

    async def compile_dossier(
        self,
        query: DossierQuery,
    ) -> CompleteDossier:
        """Запускає повний збір досьє з усіх відповідних джерел."""
        dossier_id = str(uuid.uuid4())
        started_at = datetime.now(UTC)
        start_ts = time.monotonic()

        logger.info(
            f"🦅 DIE: Компіляція досьє {dossier_id} для "
            f"'{query.identifier}' ({query.entity_type.value}), "
            f"рівні: {[l.value for l in query.classification_levels]}"
        )

        # Фільтрація збирачів за рівнем класифікації, підтримкою сутності та override
        active_collectors = self._filter_collectors(query)
        logger.info(f"📋 Активних збирачів: {len(active_collectors)}")

        # Паралельний запуск усіх збирачів
        tasks = [collector.execute(query) for collector in active_collectors]
        results: list[CollectorResult] = await asyncio.gather(*tasks)

        # LLM AI Extraction for unstructured BLACK fragments
        for result in results:
            if result.status == CollectorStatus.SUCCESS:
                for fragment in result.fragments:
                    if fragment.classification == Classification.BLACK:
                        # Extract unstructured text for LLM
                        text_to_analyze = ""
                        if fragment.category == "darknet":
                            text_to_analyze = str(fragment.raw_records)[:2000] # Limit size
                        elif fragment.category == "data_breaches":
                            excerpts = [str(r.get("breach_excerpt", r.get("title", ""))) for r in fragment.raw_records]
                            text_to_analyze = " ".join(excerpts)[:2000]
                        
                        if text_to_analyze and len(text_to_analyze) > 20:
                            llm_links = await self._extract_relations_via_llm(text_to_analyze)
                            if llm_links:
                                fragment.discovered_links.extend(llm_links)

        # Агрегація результатів
        sections = self._aggregate_sections(results)
        graph = self._build_graph(query, results)
        risk_assessment = self._assess_risk(results)

        # AutoML Scoring
        profile_for_ml = {
            "id": dossier_id,
            "type": query.entity_type.value,
            "taxes": {"debt": str(sections.get("tax_debt", {}).get("data", {}).get("total_debts", 0)) + " UAH"},
            "courts": {
                "totalCases": sections.get("court_cases", {}).get("data", {}).get("total_cases", 0),
                "criminalCases": sections.get("court_cases", {}).get("data", {}).get("criminal_cases", 0)
            },
            "cyber": {
                "openPorts": sections.get("cyber", {}).get("data", {}).get("open_ports", []),
                "vulnerabilities": sections.get("cyber", {}).get("data", {}).get("vulnerabilities", []),
                "darknetMentions": len(sections.get("darknet", {}).get("data", {}).get("dark_web_mentions", [])),
                "hasOnionLinks": bool(sections.get("darknet", {}).get("data", {}).get("dark_web_mentions", []))
            },
            "leaks": {
                "totalBreaches": sections.get("data_breaches", {}).get("data", {}).get("total_breaches", 0),
                "compromisedPasswords": bool(sections.get("data_breaches", {}).get("data", {}).get("compromised_passwords", []))
            },
            "interpol": {"isWanted": sections.get("interpol", {}).get("data", {}).get("total_matches", 0) > 0}
        }

        ml_risk_score = self.automl.predict_risk(profile_for_ml)
        risk_assessment['ml_risk_score'] = ml_risk_score

        elapsed_ms = int((time.monotonic() - start_ts) * 1000)
        completed_at = datetime.now(UTC)

        total_records = sum(
            len(f.raw_records) for r in results for f in r.fragments
        )
        succeeded = sum(1 for r in results if r.status == CollectorStatus.SUCCESS)

        max_classification = "WHITE"
        for lvl in query.classification_levels:
            if lvl == Classification.BLACK:
                max_classification = "BLACK"
                break
            if lvl == Classification.GREY:
                max_classification = "GREY"

        dossier = CompleteDossier(
            dossier_id=dossier_id,
            entity_type=query.entity_type,
            identifier=query.identifier,
            name=query.name,
            status="complete",
            sections=sections,
            graph=graph,
            collector_results=results,
            risk_assessment=risk_assessment,
            classification_level=max_classification,
            collectors_used=len(active_collectors),
            collectors_succeeded=succeeded,
            total_records_found=total_records,
            created_at=started_at.isoformat(),
            completed_at=completed_at.isoformat(),
            duration_ms=elapsed_ms,
        )

        logger.info(
            f"✅ DIE: Досьє {dossier_id} зібрано за {elapsed_ms}ms. "
            f"Збирачів: {succeeded}/{len(active_collectors)}, записів: {total_records}"
        )

        return dossier

    async def _extract_relations_via_llm(self, text: str) -> list[dict]:
        """Використовує локальну LLM для витягування зв'язків з неструктурованого тексту.
        (Наприклад, з повідомлень у Darknet форумах).
        """
        import json
        
        system_prompt = """You are an OSINT extraction tool. 
Analyze the following text and extract ANY mentioned relationships between entities (people, companies, domains, emails, etc.).
Return ONLY a valid JSON array of objects with the following schema:
[{"target_id": "identifier", "target_name": "Name", "relation_type": "KNOWS|OWNS|MENTIONED_WITH", "risk": "LOW|MEDIUM|HIGH"}]
Do not include markdown blocks, just the JSON array."""

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(
                    "http://localhost:11434/api/generate",
                    json={
                        "model": "qwen:latest",  # Local Ollama model
                        "prompt": f"{system_prompt}\\n\\nText:\\n{text}",
                        "stream": False,
                        "format": "json" # Forces Ollama to return JSON
                    }
                )
                if resp.status_code == 200:
                    data = resp.json()
                    response_text = data.get("response", "[]").strip()
                    try:
                        extracted = json.loads(response_text)
                        if isinstance(extracted, list):
                            return extracted
                    except json.JSONDecodeError:
                        logger.warning(f"Failed to decode LLM JSON: {response_text}")
        except Exception as e:
            logger.error(f"LLM extraction failed: {e}")
        return []

    def _filter_collectors(self, query: DossierQuery) -> list[BaseCollector]:
        """Фільтрація збирачів на основі параметрів запиту."""
        active = []
        for c in self._collectors:
            # Перевірка рівня класифікації
            if c.classification not in query.classification_levels:
                continue
            # Перевірка підтримки типу сутності
            if not c.supports(query.entity_type):
                continue
            # Перевірка override
            if query.collectors_override and c.name not in query.collectors_override:
                continue
            active.append(c)
        return active

    def _aggregate_sections(self, results: list[CollectorResult]) -> dict[str, Any]:
        """Агрегація фрагментів у секції за категоріями."""
        sections: dict[str, Any] = {}

        for result in results:
            if result.status != CollectorStatus.SUCCESS:
                continue
            for fragment in result.fragments:
                category = fragment.category
                if category not in sections:
                    sections[category] = {
                        "sources": [],
                        "data": {},
                        "records": [],
                        "classification": fragment.classification.value,
                        "confidence": 0.0,
                    }

                section = sections[category]
                section["sources"].append(fragment.source_name)
                section["data"].update(fragment.data)
                section["records"].extend(fragment.raw_records)
                # Зберігаємо максимальну впевненість
                section["confidence"] = max(section["confidence"], fragment.confidence)

        return sections

    def _build_graph(self, query: DossierQuery, results: list[CollectorResult]) -> dict[str, Any]:
        """Побудова Cytoscape-сумісного графа зв'язків."""
        nodes: dict[str, dict[str, Any]] = {}
        edges: list[dict[str, Any]] = []

        # Центральний вузол — суб'єкт досьє
        root_id = query.identifier
        root_label = query.name or query.identifier
        nodes[root_id] = {
            "data": {
                "id": root_id,
                "label": root_label,
                "type": query.entity_type.value,
                "is_root": True,
            }
        }

        # Збір зв'язків від усіх збирачів
        edge_id = 0
        for result in results:
            if result.status != CollectorStatus.SUCCESS:
                continue
            for fragment in result.fragments:
                for link in fragment.discovered_links:
                    target_id = str(link.get("target_id", ""))
                    target_name = link.get("target_name", target_id)
                    relation = link.get("relation_type", "RELATED")
                    risk = link.get("risk", "LOW")

                    if target_id and target_id not in nodes:
                        # Визначаємо тип вузла за типом зв'язку
                        node_type = self._infer_node_type(relation)
                        nodes[target_id] = {
                            "data": {
                                "id": target_id,
                                "label": target_name,
                                "type": node_type,
                                "risk": risk,
                                "source_collector": result.collector_name,
                            }
                        }

                    edge_id += 1
                    edges.append({
                        "data": {
                            "id": f"e{edge_id}",
                            "source": root_id,
                            "target": target_id,
                            "label": relation,
                            "risk": risk,
                            "collector": result.collector_name,
                        }
                    })

        return {
            "nodes": list(nodes.values()),
            "edges": edges,
            "total_nodes": len(nodes),
            "total_edges": len(edges),
        }

    def _infer_node_type(self, relation: str) -> str:
        """Визначає тип вузла за типом зв'язку."""
        mapping = {
            "FOUNDER": "person",
            "MANAGER": "person",
            "BENEFICIARY": "person",
            "OWNS_PROPERTY": "property",
            "OWNS_VEHICLE": "vehicle",
            "CRYPTO_TRANSFER": "crypto_wallet",
            "HAS_SOCIAL_PROFILE": "social",
            "MEMBER_OF_GROUP": "group",
            "SANCTIONED_BY": "sanctions_list",
            "INTERPOL_RED_NOTICE": "interpol",
            "FOUND_ON_DARKNET": "darknet",
            "OFFSHORE_LINK": "company",
            "NOTARY_ACTION_WITH": "person",
            "HAS_ENCUMBRANCE_WITH": "company",
        }
        return mapping.get(relation, "unknown")

    def _assess_risk(self, results: list[CollectorResult]) -> dict[str, Any]:
        """Зведена оцінка ризику на основі всіх зібраних даних."""
        risk_score = 0.0
        risk_factors: list[str] = []
        risk_breakdown: dict[str, float] = {}

        for result in results:
            if result.status != CollectorStatus.SUCCESS:
                continue
            for fragment in result.fragments:
                category = fragment.category

                # Санкції — найвищий ризик
                if category.startswith("sanctions") and fragment.data.get("is_sanctioned"):
                    risk_score += 40
                    risk_factors.append("🔴 Знайдено у санкційних списках")
                    risk_breakdown["sanctions"] = 40

                # Інтерпол
                if category.startswith("interpol") and fragment.data.get("total_matches", 0) > 0:
                    risk_score += 35
                    risk_factors.append("🔴 Знайдено у базі Інтерполу")
                    risk_breakdown["interpol"] = 35

                # Витоки даних
                if category == "data_breaches":
                    breach_count = fragment.data.get("total_breaches", 0)
                    if breach_count > 5:
                        risk_score += 15
                        risk_factors.append(f"🟠 Email знайдено у {breach_count} витоках")
                        risk_breakdown["leaks"] = 15
                    elif breach_count > 0:
                        risk_score += 5
                        risk_breakdown["leaks"] = 5

                # Darknet
                if category == "darknet":
                    mentions = fragment.data.get("dark_web_mentions", [])
                    if mentions:
                        risk_score += 20
                        risk_factors.append(f"🟠 {len(mentions)} згадок у даркнеті")
                        risk_breakdown["darknet"] = 20

                # Судові справи (кримінальні)
                if category == "court_cases":
                    criminal = fragment.data.get("criminal_cases", 0)
                    if criminal > 0:
                        risk_score += 10 * min(criminal, 3)
                        risk_factors.append(f"🟡 {criminal} кримінальних справ")
                        risk_breakdown["court"] = 10 * min(criminal, 3)

                # Борги
                if category == "tax_debt":
                    debts = fragment.data.get("total_debts", 0)
                    if debts > 0:
                        risk_score += 5
                        risk_factors.append(f"🟡 {debts} записів у реєстрі боржників")
                        risk_breakdown["debt"] = 5

                # PEP статус
                if category == "pep" and fragment.data.get("is_pep"):
                    risk_score += 10
                    risk_factors.append("🟡 Публічно значуща особа (PEP)")
                    risk_breakdown["pep"] = 10

                # Медіа (негатив)
                if category == "media":
                    neg = fragment.data.get("negative_mentions", 0)
                    if neg > 2:
                        risk_score += 5
                        risk_factors.append(f"🟡 {neg} негативних згадок у ЗМІ")
                        risk_breakdown["media"] = 5

                # Офшори (OpenCorporates)
                if category == "international_companies":
                    offshore_links = [
                        link for link in fragment.discovered_links
                        if link.get("relation_type") == "OFFSHORE_LINK"
                    ]
                    if offshore_links:
                        risk_score += 15
                        risk_factors.append(f"🟠 {len(offshore_links)} офшорних зв'язків")
                        risk_breakdown["offshore"] = 15

                # ICIJ Offshore Leaks
                if category == "offshore_leaks":
                    panama = fragment.data.get("panama_papers", [])
                    pandora = fragment.data.get("pandora_papers", [])
                    paradise = fragment.data.get("paradise_papers", [])
                    total_leaks = len(panama) + len(pandora) + len(paradise)
                    if total_leaks > 0:
                        risk_score += 30
                        risk_factors.append(f"🔴 Знайдено {total_leaks} записів у ICIJ (Panama/Pandora Papers)")
                        risk_breakdown["icij_leaks"] = 30

                # Крипто-активи
                if category == "blockchain_btc":
                    balance = fragment.data.get("balance_btc", 0)
                    if balance > 1.0:
                        risk_score += 25
                        risk_factors.append(f"🟠 Великий баланс BTC: {balance:.2f} BTC")
                        risk_breakdown["crypto_btc"] = 25
                    elif balance > 0:
                        risk_score += 5
                        risk_breakdown["crypto_btc"] = 5

                if category == "blockchain_eth":
                    balance = fragment.data.get("balance_eth", 0)
                    if balance > 10.0:
                        risk_score += 25
                        risk_factors.append(f"🟠 Великий баланс ETH: {balance:.2f} ETH")
                        risk_breakdown["crypto_eth"] = 25
                    elif balance > 0:
                        risk_score += 5
                        risk_breakdown["crypto_eth"] = 5

                # Telegram
                if category == "telegram_mentions":
                    suspicious_channels = [
                        c for c in fragment.data.get("channels", [])
                        if c.get("sentiment") == "NEGATIVE"
                    ]
                    if suspicious_channels:
                        risk_score += 15
                        risk_factors.append(f"🔴 Згадки у {len(suspicious_channels)} підозрілих Telegram-каналах")
                        risk_breakdown["telegram"] = 15

                # Соціальні мережі
                if category == "social_profiles":
                    profiles = fragment.data.get("profiles", [])
                    if profiles:
                        # Social profiles themselves aren't high risk, but good to note
                        risk_score += 5
                        risk_factors.append(f"⚪ Знайдено {len(profiles)} соціальних профілів")
                        risk_breakdown["social_media"] = 5

        # Нормалізація 0-100
        risk_score = min(risk_score, 100)

        # Визначення рівня
        if risk_score >= 80:
            risk_level = "CRITICAL"
        elif risk_score >= 60:
            risk_level = "HIGH"
        elif risk_score >= 40:
            risk_level = "ELEVATED"
        elif risk_score >= 20:
            risk_level = "MODERATE"
        else:
            risk_level = "LOW"

        return {
            "composite_score": risk_score,
            "risk_level": risk_level,
            "risk_factors": risk_factors,
            "risk_breakdown": risk_breakdown,
            "recommendation": self._get_recommendation(risk_level),
        }

    def _get_recommendation(self, risk_level: str) -> str:
        """Рекомендація аналітику на основі рівня ризику."""
        recommendations = {
            "CRITICAL": "🔴 НЕГАЙНЕ РЕАГУВАННЯ. Передати матеріали до ДКІБ СБУ / НАБУ. Заморозити активи.",
            "HIGH": "🟠 ПОСИЛЕНИЙ МОНІТОРИНГ. Розширити граф зв'язків. Ініціювати внутрішнє розслідування.",
            "ELEVATED": "🟡 УВАГА. Поглибити аналіз фінансових потоків. Перевірити бенефіціарів.",
            "MODERATE": "🟢 СПОСТЕРЕЖЕННЯ. Додати до watchlist. Щотижневий моніторинг.",
            "LOW": "⚪ ЧИСТО. Стандартний моніторинг за розкладом.",
        }
        return recommendations.get(risk_level, "Невизначено")
