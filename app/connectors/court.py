from __future__ import annotations

"""Court Registry Parser (COMP-034)

Парсер судового реєстру України (Єдиний державний реєстр судових рішень).
https://reyestr.court.gov.ua/

Uses the official API to search court decisions by:
- Company name / EDRPOU
- Person name
- Case number
- Category (civil, criminal, commercial, administrative)
"""
import logging
from typing import Any

from app.connectors.base import BaseConnector, ConnectorResult

logger = logging.getLogger("connector.court")


# Court categories mapping
COURT_CATEGORIES = {
    1: "Цивільні справи",
    2: "Кримінальні справи",
    3: "Господарські справи",
    4: "Адміністративні справи",
    5: "Справи про адміністративні правопорушення",
}

COURT_FORMS = {
    1: "Вирок",
    2: "Постанова",
    3: "Рішення",
    4: "Ухвала",
    5: "Окрема ухвала",
    6: "Судовий наказ",
}


class CourtRegistryConnector(BaseConnector):
    """Connector for Ukrainian Court Registry (ЄДРСР).

    Searches court decisions and extracts risk-relevant data:
    - Number of cases as defendant
    - Bankruptcy proceedings
    - Tax disputes
    - Criminal cases involving company officers
    """

    def __init__(self):
        super().__init__(
            name="CourtRegistry",
            base_url="https://reyestr.court.gov.ua",
            timeout=30.0,
            max_retries=3,
        )
        self._api_search_url = "https://reyestr.court.gov.ua/Review/getcourtcases"
        logger.info("CourtRegistryConnector initialized")

    async def search(
        self,
        query: str,
        limit: int = 20,
        **kwargs,
    ) -> ConnectorResult:
        """Search court registry.

        Args:
            query: Company name, EDRPOU, person name, or case number
            limit: Max results (up to 100)
            **kwargs:
                category: Court category (1-5)
                form: Decision form (1-6)
                date_from: Start date (YYYY-MM-DD)
                date_to: End date (YYYY-MM-DD)
                role: 'plaintiff' or 'defendant'

        Returns:
            ConnectorResult with court decisions

        """
        category = kwargs.get("category")
        form = kwargs.get("form")
        date_from = kwargs.get("date_from")
        date_to = kwargs.get("date_to")
        role = kwargs.get("role")

        # Build search params for the court registry API
        params: dict[str, Any] = {
            "SearchExpression": query,
            "Page": 1,
            "PageSize": min(limit, 100),
        }

        if category:
            params["CaseCategory"] = category
        if form:
            params["JudgmentForm"] = form
        if date_from:
            params["DateFrom"] = date_from
        if date_to:
            params["DateTo"] = date_to

        try:
            result = await self._request(
                "GET",
                "/Review/getcourtcases",
                params=params,
            )

            if result.success and result.data:
                raw_cases = (
                    result.data
                    if isinstance(result.data, list)
                    else result.data.get("Result", result.data.get("items", []))
                )
                cases = [self._normalize_case(c, role) for c in raw_cases]
                return ConnectorResult(
                    success=True,
                    data=cases,
                    source="court_registry",
                    records_count=len(cases),
                )

            # If API not available, try alternative endpoint
            return await self._search_alternative(query, limit)

        except Exception as e:
            logger.warning(f"Court registry search failed: {e}")
            return await self._search_alternative(query, limit)

    async def _search_alternative(
        self, query: str, limit: int
    ) -> ConnectorResult:
        """Fallback search using data.gov.ua court dataset."""
        try:
            import httpx

            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(
                    "https://data.gov.ua/api/3/action/package_search",
                    params={
                        "q": f"судові рішення {query}",
                        "rows": limit,
                    },
                    headers={"Accept": "application/json"},
                )

                if resp.status_code == 200:
                    data = resp.json()
                    results = data.get("result", {}).get("results", [])
                    cases = [
                        {
                            "id": r.get("id", ""),
                            "title": r.get("title", ""),
                            "description": (r.get("notes", "") or "")[:500],
                            "organization": r.get("organization", {}).get("title", ""),
                            "source": "data.gov.ua",
                        }
                        for r in results
                    ]
                    return ConnectorResult(
                        success=True,
                        data=cases,
                        source="data.gov.ua",
                        records_count=len(cases),
                    )

        except Exception as e:
            logger.warning(f"Alternative court search also failed: {e}")

        return ConnectorResult(
            success=True,
            data=[],
            source=self.name,
            records_count=0,
        )

    async def get_by_id(self, record_id: str) -> ConnectorResult:
        """Get specific court decision by ID."""
        return await self._request(
            "GET",
            f"/Review/{record_id}",
        )

    async def get_risk_summary(
        self, entity_name: str, edrpou: str | None = None
    ) -> dict[str, Any]:
        """Get risk-relevant court summary for an entity.

        Returns aggregated court risk factors for CERS scoring.
        """
        search_query = edrpou or entity_name
        result = await self.search(search_query, limit=100)

        if not result.success or not result.data:
            return {
                "entity": entity_name,
                "total_cases": 0,
                "as_defendant": 0,
                "as_plaintiff": 0,
                "bankruptcy_cases": 0,
                "tax_disputes": 0,
                "criminal_cases": 0,
                "risk_score_contribution": 0,
            }

        cases = result.data
        total = len(cases)
        as_defendant = sum(
            1 for c in cases if c.get("role") == "defendant"
        )
        bankruptcy = sum(
            1 for c in cases
            if "банкрутство" in str(c.get("category", "")).lower()
            or "bankruptcy" in str(c.get("category", "")).lower()
        )
        tax_disputes = sum(
            1 for c in cases
            if "податк" in str(c.get("category", "")).lower()
        )
        criminal = sum(
            1 for c in cases
            if c.get("category_id") == 2
        )

        return {
            "entity": entity_name,
            "edrpou": edrpou,
            "total_cases": total,
            "as_defendant": as_defendant,
            "as_plaintiff": total - as_defendant,
            "bankruptcy_cases": bankruptcy,
            "tax_disputes": tax_disputes,
            "criminal_cases": criminal,
            "risk_score_contribution": min(total, 10),  # For CERS: 0-10 scale
            "source": "court_registry",
        }

    async def fetch(
        self, limit: int = 100, offset: int = 0, **kwargs
    ) -> ConnectorResult:
        """Fetch batch of court decisions for ETL."""
        return await self.search(
            query=kwargs.get("query", ""),
            limit=limit,
            **{k: v for k, v in kwargs.items() if k != "query"},
        )

    def _normalize_case(
        self, raw: dict, role: str | None = None
    ) -> dict[str, Any]:
        """Normalize court case response."""
        category_id = raw.get("CaseCategory", raw.get("category_id", 0))
        form_id = raw.get("JudgmentForm", raw.get("form_id", 0))

        return {
            "id": raw.get("Id", raw.get("id", "")),
            "case_number": raw.get("CaseNumber", raw.get("case_number", "")),
            "court_name": raw.get("CourtName", raw.get("court_name", "")),
            "judge": raw.get("JudgeName", raw.get("judge", "")),
            "date": raw.get("AdjudicationDate", raw.get("date", "")),
            "category_id": category_id,
            "category": COURT_CATEGORIES.get(category_id, "Невідомо"),
            "form_id": form_id,
            "form": COURT_FORMS.get(form_id, "Невідомо"),
            "summary": (raw.get("CaseDescription", raw.get("summary", "")) or "")[:500],
            "role": role or "unknown",
            "source": "court_registry",
        }


# Singleton
court_connector = CourtRegistryConnector()
