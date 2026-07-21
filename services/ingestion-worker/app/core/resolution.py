"""Unified Entity Resolution Service — PREDATOR Analytics v55.2-SM-EXTENDED.
AI-Enhanced deduplication and cross-source matching for OSINT signals.
"""

import logging
import os
from typing import Any

import httpx

from app.normalizers.company import CompanyNormalizer

logger = logging.getLogger("ingestion.resolution")
MCP_URL = os.getenv("MCP_ROUTER_URL", "http://mcp-router:8080/v1/query")


class ResolutionService:
    @staticmethod
    async def resolve_company(data: dict[str, Any], tenant_id: str) -> dict[str, Any]:
        """Вирішує ідентичність компанії.
        Якщо нема ЄДРПОУ, використовує AI для пошуку матчів за назвою та адресою.
        """
        edrpou = str(data.get("edrpou", "")).strip()
        name = CompanyNormalizer.normalize_name(data.get("name", ""))

        # Scenario A: Strong identifier exists
        if len(edrpou) >= 8:
            return CompanyNormalizer.normalize_data(data, tenant_id)

        # Scenario B: No identifier, use AI reasoning (Sovereign Linker)
        logger.info(
            f"🔎 [RESOLUTION] Спроба вирішити сутність '{name}' без ЄДРПОУ через Sovereign Linker..."
        )

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                # В реал-таймі тут був би запит до бази для пошуку кандидатів за назвою
                # Але для V55.2-SM-EXTENDED ми використовуємо аналіз контексту через MCP
                resp = await client.post(
                    MCP_URL,
                    json={
                        "prompt": f"Чи є '{name}' ({data.get('address')}) тією ж компанією, що і потенційні кандидати з бази? Дані сигналу: {data}",
                        "task_type": "entity_matching",
                        "context": {"source": data.get("source", "OSINT")},
                    },
                )

                if resp.status_code == 200:
                    resolution = resp.json()
                    confidence = resolution.get("confidence", 0.0)
                    if confidence > 0.85 and resolution.get("resolved_ueid"):
                        logger.info(
                            f"✅ [RESOLVED] Знайдено матч! UEID: {resolution.get('resolved_ueid')} (Conf: {confidence})"
                        )
                        return {
                            **CompanyNormalizer.normalize_data(data, tenant_id),
                            "ueid": resolution.get("resolved_ueid"),
                            "resolved_via": "AI",
                            "confidence": confidence,
                        }
            except Exception as e:
                logger.warning(f"⚠️ [RESOLUTION_FAILED] Sovereign Linker недоступний: {e!s}")

        # Fallback: Create new shadow UEID based on normalized name
        shadow_id = CompanyNormalizer.generate_ueid(f"shadow:{name}", tenant_id)
        return {
            **CompanyNormalizer.normalize_data(data, tenant_id),
            "ueid": shadow_id,
            "is_shadow": True,
        }

    @staticmethod
    async def resolve_person(data: dict[str, Any], tenant_id: str) -> dict[str, Any]:
        """Вирішує ідентичність фізичної особи (PEP, бенефіціар, тощо).
        Використовує AI Sovereign Linker для зіставлення ПІБ, дати народження та інших ознак.
        """
        # Утиліт для нормалізації Person поки немає, робимо базову очистку
        name = str(data.get("name", "")).strip().title()
        tax_id = str(data.get("tax_id", "")).strip()

        # Scenario A: Strong identifier exists (ІПН / РНОКПП)
        if len(tax_id) in (8, 10):
            # В ідеалі тут має бути PersonNormalizer, але для прикладу просто повертаємо
            return {**data, "ueid": f"ua-tax-{tax_id}", "resolved_via": "StrongID"}

        # Scenario B: No identifier, use AI reasoning (Sovereign Linker)
        logger.info(
            f"🔎 [RESOLUTION] Спроба вирішити сутність (Person) '{name}' без ІПН через Sovereign Linker..."
        )

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                resp = await client.post(
                    MCP_URL,
                    json={
                        "prompt": f"Чи є особа '{name}' (дата нар.: {data.get('birth_date')}) тією ж особою, що і потенційні кандидати з бази? Дані сигналу: {data}",
                        "task_type": "entity_matching",
                        "context": {"source": data.get("source", "OSINT"), "type": "Person"},
                    },
                )

                if resp.status_code == 200:
                    resolution = resp.json()
                    confidence = resolution.get("confidence", 0.0)
                    if confidence > 0.88 and resolution.get(
                        "resolved_ueid"
                    ):  # Вищий поріг для людей
                        logger.info(
                            f"✅ [RESOLVED PERSON] Знайдено матч! UEID: {resolution.get('resolved_ueid')} (Conf: {confidence})"
                        )
                        return {
                            **data,
                            "ueid": resolution.get("resolved_ueid"),
                            "resolved_via": "AI",
                            "confidence": confidence,
                        }
            except Exception as e:
                logger.warning(
                    f"⚠️ [RESOLUTION_FAILED] Sovereign Linker недоступний для Person: {e!s}"
                )

        # Fallback: Create new shadow UEID based on name and birth date
        # Використовуємо простий хеш для створення shadow_id
        import hashlib

        unique_str = f"shadow:person:{name}:{data.get('birth_date', 'unknown')}"
        shadow_id = hashlib.sha256(unique_str.encode()).hexdigest()[:12]

        return {**data, "ueid": f"shadow-p-{shadow_id}", "is_shadow": True}
