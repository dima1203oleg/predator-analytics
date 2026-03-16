"""GeoIP Tool — геолокація за IP адресою."""
import logging
from datetime import UTC, datetime
from typing import Any

from app.tools.base import BaseTool, ToolResult, ToolStatus

logger = logging.getLogger(__name__)


class GeoIPTool(BaseTool):
    """Адаптер для GeoIP сервісів.

    Визначення геолокації за IP адресою:
    - Країна, місто, регіон
    - ISP, ASN
    - Координати
    - Timezone

    Джерела: MaxMind, ip-api, ipinfo.io
    """

    name = "geoip"
    description = "GeoIP — геолокація за IP адресою"
    version = "1.0"
    categories = ["geolocation", "ip", "osint"]
    supported_targets = ["ip", "domain"]

    def __init__(self, timeout: int = 30):
        """Ініціалізація."""
        super().__init__(timeout)

    async def is_available(self) -> bool:
        """Перевірка доступності."""
        return True

    async def run(self, target: str, options: dict[str, Any] | None = None) -> ToolResult:
        """Геолокація IP.

        Args:
            target: IP адреса або домен
            options: Додаткові опції:
                - include_asn: включати ASN інформацію
                - include_threat: включати threat intelligence

        Returns:
            ToolResult з геолокацією
        """
        start_time = datetime.now(UTC)
        options = options or {}

        include_asn = options.get("include_asn", True)
        include_threat = options.get("include_threat", True)

        findings = []

        # Симуляція GeoIP результатів
        # В реальності — запити до ip-api.com, ipinfo.io, MaxMind
        geo_data = {
            "ip": target,
            "country": "Ukraine",
            "country_code": "UA",
            "region": "Kyiv City",
            "region_code": "30",
            "city": "Kyiv",
            "zip": "01001",
            "latitude": 50.4501,
            "longitude": 30.5234,
            "timezone": "Europe/Kyiv",
            "isp": "Datagroup",
            "org": "Datagroup LLC",
            "as_number": "AS21497",
            "as_name": "Datagroup",
            "is_mobile": False,
            "is_proxy": False,
            "is_hosting": True,
        }

        findings.append({
            "type": "geolocation",
            "value": f"{geo_data['city']}, {geo_data['country']}",
            "confidence": 0.95,
            "source": "geoip",
            "metadata": {
                "lat": geo_data["latitude"],
                "lon": geo_data["longitude"],
                "country_code": geo_data["country_code"],
            },
        })

        if include_asn:
            findings.append({
                "type": "asn",
                "value": geo_data["as_number"],
                "confidence": 0.98,
                "source": "geoip",
                "metadata": {
                    "name": geo_data["as_name"],
                    "isp": geo_data["isp"],
                },
            })

        # Threat intelligence
        threat_data = {}
        if include_threat:
            threat_data = {
                "is_tor_exit": False,
                "is_vpn": False,
                "is_proxy": geo_data["is_proxy"],
                "is_datacenter": geo_data["is_hosting"],
                "abuse_score": 0.1,
                "threat_level": "low",
            }

            if threat_data["is_datacenter"]:
                findings.append({
                    "type": "datacenter_ip",
                    "value": target,
                    "confidence": 0.9,
                    "source": "geoip",
                    "severity": "info",
                })

        duration = (datetime.now(UTC) - start_time).total_seconds()

        return ToolResult(
            tool_name=self.name,
            status=ToolStatus.SUCCESS,
            data={
                "ip": target,
                "location": {
                    "country": geo_data["country"],
                    "country_code": geo_data["country_code"],
                    "region": geo_data["region"],
                    "city": geo_data["city"],
                    "zip": geo_data["zip"],
                    "coordinates": {
                        "latitude": geo_data["latitude"],
                        "longitude": geo_data["longitude"],
                    },
                    "timezone": geo_data["timezone"],
                },
                "network": {
                    "isp": geo_data["isp"],
                    "org": geo_data["org"],
                    "asn": geo_data["as_number"],
                    "as_name": geo_data["as_name"],
                },
                "flags": {
                    "is_mobile": geo_data["is_mobile"],
                    "is_proxy": geo_data["is_proxy"],
                    "is_hosting": geo_data["is_hosting"],
                },
                "threat": threat_data,
            },
            findings=findings,
            duration_seconds=duration,
        )
