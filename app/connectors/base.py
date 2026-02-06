from __future__ import annotations


"""UA Sources - Base Connector
Abstract base class for all Ukrainian data source connectors.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import UTC, datetime, timezone
from enum import Enum
import logging
from typing import Any, Dict, Optional


# import httpx


logger = logging.getLogger(__name__)


class ConnectorStatus(Enum):
    """Connector health status."""
    HEALTHY = "HEALTHY"
    DEGRADED = "DEGRADED"
    OFFLINE = "OFFLINE"
    UNKNOWN = "UNKNOWN"


@dataclass
class ConnectorResult:
    """Standard result from connector operations."""
    success: bool
    data: Any
    error: str | None = None
    source: str | None = None
    timestamp: datetime = None
    records_count: int = 0

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now(UTC)


class BaseConnector(ABC):
    """Abstract base class for Ukrainian data source connectors.

    All connectors must implement:
    - search(): Search for data
    - get_by_id(): Get specific record
    - health_check(): Check connector status
    """

    def __init__(
        self,
        name: str,
        base_url: str,
        timeout: float = 30.0,
        max_retries: int = 3
    ):
        self.name = name
        self.base_url = base_url
        self.timeout = timeout
        self.max_retries = max_retries
        self._client: httpx.AsyncClient | None = None
        self._status = ConnectorStatus.UNKNOWN
        self._last_check: datetime | None = None

    async def _get_client(self) -> Any:
        """Get or create HTTP client with connection pooling."""
        # if self._client is None:
        #     self._client = httpx.AsyncClient(
        #         base_url=self.base_url,
        #         timeout=self.timeout,
        #         limits=httpx.Limits(max_connections=10, max_keepalive_connections=5),
        #         headers={
        #             "User-Agent": "Predator-Analytics/21.0",
        #             "Accept": "application/json",
        #             "Accept-Language": "uk-UA,uk;q=0.9,en;q=0.8"
        #         }
        #     )
        return self._client

    async def close(self) -> None:
        """Close HTTP client."""
        # if self._client:
        #     await self._client.aclose()
        #     self._client = None

    async def _request(
        self,
        method: str,
        endpoint: str,
        params: dict | None = None,
        data: dict | None = None
    ) -> ConnectorResult:
        """Make HTTP request with error handling."""
        # Placeholder for now
        return ConnectorResult(success=False, data=None, error="HTTP client unavailable")

        # client = await self._get_client()

        # for attempt in range(self.max_retries):
        #     try:
        #         response = await client.request(
        #             method=method,
        #             url=endpoint,
        #             params=params,
        #             json=data
        #         )
        #         response.raise_for_status()

        #         return ConnectorResult(
        #             success=True,
        #             data=response.json(),
        #             source=self.name,
        #             records_count=1
        #         )

        #     except httpx.HTTPStatusError as e:
        #         logger.warning(f"{self.name} HTTP error: {e.response.status_code}")
        #         if attempt == self.max_retries - 1:
        #             return ConnectorResult(
        #                 success=False,
        #                 data=None,
        #                 error=f"HTTP {e.response.status_code}",
        #                 source=self.name
        #             )

        #     except httpx.RequestError as e:
        #         logger.warning(f"{self.name} request error: {e}")
        #         if attempt == self.max_retries - 1:
        #             return ConnectorResult(
        #                 success=False,
        #                 data=None,
        #                 error=str(e),
        #                 source=self.name
        #             )
        # return None

    @abstractmethod
    async def search(
        self,
        query: str,
        limit: int = 20,
        **kwargs
    ) -> ConnectorResult:
        """Search for data in the source."""

    @abstractmethod
    async def get_by_id(self, record_id: str) -> ConnectorResult:
        """Get specific record by ID."""

    async def health_check(self) -> ConnectorStatus:
        """Check connector health."""
        try:
            client = await self._get_client()
            response = await client.get("/", timeout=5.0)
            self._status = ConnectorStatus.HEALTHY if response.status_code < 500 else ConnectorStatus.DEGRADED
        except Exception:
            self._status = ConnectorStatus.OFFLINE

        self._last_check = datetime.now(UTC)
        return self._status

    @property
    def status(self) -> dict[str, Any]:
        """Get connector status info."""
        return {
            "name": self.name,
            "status": self._status.value,
            "last_check": self._last_check.isoformat() if self._last_check else None,
            "base_url": self.base_url
        }
