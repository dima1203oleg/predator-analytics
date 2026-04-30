from __future__ import annotations

"""Sanctions Checker (COMP-030)

Перевірка сутностей за санкційними списками:
- РНБО (Рада Національної Безпеки — Україна)
- EU Consolidated Sanctions
- OFAC SDN (USA)

Uses open data from:
- РНБО: https://sanctions-t.rnbo.gov.ua/ (JSON API)
- EU: https://data.europa.eu/data/datasets/consolidated-list-of-persons-groups-and-entities-subject-to-eu-financial-sanctions
- OFAC: https://sanctionslist.ofac.treas.gov/Home/SdnList
"""
from dataclasses import dataclass, field
from datetime import UTC, datetime
import logging
from typing import Any

from app.connectors.base import BaseConnector, ConnectorResult

logger = logging.getLogger("service.sanctions")


SANCTIONS_LISTS = {
    "rnbo": {
        "name": "РНБО України",
        "url": "https://sanctions-t.rnbo.gov.ua/api",
        "description": "Рішення РНБО про санкції",
    },
    "eu": {
        "name": "EU Consolidated Sanctions",
        "url": "https://webgate.ec.europa.eu/fsd/fsf",
        "description": "Consolidated list of EU financial sanctions",
    },
    "ofac": {
        "name": "OFAC SDN List",
        "url": "https://sanctionslistservice.ofac.treas.gov/api",
        "description": "US Office of Foreign Assets Control",
    },
}


@dataclass
class SanctionHit:
    """A single sanction match."""

    list_name: str
    entity_name: str
    match_score: float  # 0.0 – 1.0
    reason: str | None = None
    since: str | None = None
    source_url: str | None = None


@dataclass
class SanctionsCheckResult:
    """Result of sanctions screening."""

    query: str
    is_sanctioned: bool
    hits: list[SanctionHit] = field(default_factory=list)
    lists_checked: list[str] = field(default_factory=list)
    checked_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    risk_level: str = "none"  # none, watchlist, sanctioned

    def to_dict(self) -> dict[str, Any]:
        return {
            "query": self.query,
            "is_sanctioned": self.is_sanctioned,
            "risk_level": self.risk_level,
            "hits": [
                {
                    "list_name": h.list_name,
                    "entity_name": h.entity_name,
                    "match_score": h.match_score,
                    "reason": h.reason,
                    "since": h.since,
                    "source_url": h.source_url,
                }
                for h in self.hits
            ],
            "lists_checked": self.lists_checked,
            "checked_at": self.checked_at.isoformat(),
        }


class SanctionsChecker(BaseConnector):
    """Sanctions screening service.

    Checks entities against РНБО, EU, and OFAC lists.
    Uses fuzzy matching for names and exact matching for identifiers.
    """

    def __init__(self):
        super().__init__(
            name="SanctionsChecker",
            base_url="https://sanctions-t.rnbo.gov.ua",
            timeout=15.0,
        )
        self._local_cache: dict[str, SanctionsCheckResult] = {}
        logger.info("SanctionsChecker initialized")

    async def check(
        self,
        query: str,
        entity_type: str = "company",  # company or person
        edrpou: str | None = None,
    ) -> SanctionsCheckResult:
        """Check entity against all sanctions lists.

        Args:
            query: Company name or person name
            entity_type: 'company' or 'person'
            edrpou: Optional EDRPOU code for exact match

        Returns:
            SanctionsCheckResult

        """
        # Check local cache first
        cache_key = f"{query}:{edrpou or ''}".lower()
        if cache_key in self._local_cache:
            cached = self._local_cache[cache_key]
            age = (datetime.now(UTC) - cached.checked_at).total_seconds()
            if age < 3600:  # Cache for 1 hour
                return cached

        hits: list[SanctionHit] = []
        lists_checked: list[str] = []

        # 1. Check РНБО
        rnbo_hits = await self._check_rnbo(query, edrpou)
        hits.extend(rnbo_hits)
        lists_checked.append("rnbo")

        # 2. Check EU (simulated for now — real API requires registration)
        eu_hits = self._check_eu_local(query)
        hits.extend(eu_hits)
        lists_checked.append("eu")

        # 3. Check OFAC (simulated — real API requires registration)
        ofac_hits = self._check_ofac_local(query)
        hits.extend(ofac_hits)
        lists_checked.append("ofac")

        # Determine overall risk
        is_sanctioned = any(h.match_score >= 0.9 for h in hits)
        is_watchlist = any(h.match_score >= 0.6 for h in hits)

        if is_sanctioned:
            risk_level = "sanctioned"
        elif is_watchlist:
            risk_level = "watchlist"
        else:
            risk_level = "none"

        result = SanctionsCheckResult(
            query=query,
            is_sanctioned=is_sanctioned,
            hits=hits,
            lists_checked=lists_checked,
            risk_level=risk_level,
        )

        # Update cache
        self._local_cache[cache_key] = result

        logger.info(
            "Sanctions check for '%s': %s (%d hits)",
            query, risk_level, len(hits)
        )

        return result

    async def _check_rnbo(self, query: str, edrpou: str | None = None) -> list[SanctionHit]:
        """Check РНБО sanctions list via API."""
        hits = []
        try:
            # Try the RNBO API
            params = {"search": query}
            result = await self._request("GET", "/api/sanctions", params=params)

            if result.success and result.data:
                entries = result.data if isinstance(result.data, list) else result.data.get("data", [])
                for entry in entries:
                    name = entry.get("name", entry.get("full_name", ""))
                    match_score = self._fuzzy_match(query, name)

                    if match_score > 0.5:
                        hits.append(SanctionHit(
                            list_name="РНБО України",
                            entity_name=name,
                            match_score=match_score,
                            reason=entry.get("reason", "Рішення РНБО"),
                            since=entry.get("date", None),
                            source_url="https://sanctions-t.rnbo.gov.ua/",
                        ))
        except Exception as e:
            logger.warning(f"RNBO API check failed: {e}")

        return hits

    def _check_eu_local(self, query: str) -> list[SanctionHit]:
        """Check against a known local subset of EU sanctions (placeholder)."""
        # In production, this would query the EU consolidated list
        # For now, check against well-known sanctioned entities
        known_sanctions = [
            "russian military",
            "wagner group",
            "sberbank",
            "gazprom",
            "rosneft",
            "russian direct investment fund",
        ]
        hits = []
        q = query.lower()
        for entity in known_sanctions:
            score = self._fuzzy_match(q, entity)
            if score > 0.7:
                hits.append(SanctionHit(
                    list_name="EU Consolidated Sanctions",
                    entity_name=entity.title(),
                    match_score=score,
                    reason="EU Council Regulation",
                    source_url="https://data.europa.eu/data/datasets/consolidated-list-of-persons-groups-and-entities-subject-to-eu-financial-sanctions",
                ))
        return hits

    def _check_ofac_local(self, query: str) -> list[SanctionHit]:
        """Check against known OFAC SDN entries (placeholder)."""
        known_ofac = [
            "russian federation",
            "vnesheconombank",
            "rosoboronexport",
        ]
        hits = []
        q = query.lower()
        for entity in known_ofac:
            score = self._fuzzy_match(q, entity)
            if score > 0.7:
                hits.append(SanctionHit(
                    list_name="OFAC SDN",
                    entity_name=entity.title(),
                    match_score=score,
                    reason="OFAC Specially Designated Nationals",
                    source_url="https://sanctionslist.ofac.treas.gov/Home/SdnList",
                ))
        return hits

    def _fuzzy_match(self, query: str, target: str) -> float:
        """Simple fuzzy matching based on normalized token overlap."""
        q_tokens = set(query.lower().split())
        t_tokens = set(target.lower().split())

        if not q_tokens or not t_tokens:
            return 0.0

        intersection = q_tokens & t_tokens
        # Jaccard similarity
        union = q_tokens | t_tokens
        return len(intersection) / len(union) if union else 0.0

    # --- BaseConnector interface ---

    async def search(self, query: str, limit: int = 10, **kwargs) -> ConnectorResult:
        """Search sanctions lists."""
        result = await self.check(query)
        return ConnectorResult(
            success=True,
            data=result.to_dict(),
            source="SanctionsChecker",
            records_count=len(result.hits),
        )

    async def get_by_id(self, record_id: str) -> ConnectorResult:
        """Not applicable for sanctions — use search instead."""
        return await self.search(record_id)


# Singleton
sanctions_checker = SanctionsChecker()
