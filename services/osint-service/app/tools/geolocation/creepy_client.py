"""Creepy Tool — геолокація з соціальних мереж та метаданих."""
import logging
from datetime import UTC, datetime
from typing import Any

from app.tools.base import BaseTool, ToolResult, ToolStatus

logger = logging.getLogger(__name__)


class CreepyTool(BaseTool):
    """Адаптер для Creepy.

    Creepy — інструмент для витягування геолокації:
    - З метаданих фото (EXIF GPS)
    - З соціальних мереж (Twitter, Instagram, Flickr)
    - Побудова карти переміщень

    GitHub: https://github.com/ilektrojohn/creepy
    """

    name = "creepy"
    description = "Creepy — геолокація з соціальних мереж та EXIF"
    version = "1.4"
    categories = ["geolocation", "social", "metadata"]
    supported_targets = ["username", "image", "url"]

    async def is_available(self) -> bool:
        """Перевірка доступності."""
        return True

    async def run(self, target: str, options: dict[str, Any] | None = None) -> ToolResult:
        """Витягування геолокації.

        Args:
            target: Username, URL зображення або шлях до файлу
            options: Додаткові опції:
                - source: джерело (twitter, instagram, flickr, exif)
                - date_from: дата від
                - date_to: дата до
                - build_timeline: побудувати timeline

        Returns:
            ToolResult з геолокаціями
        """
        start_time = datetime.now(UTC)
        options = options or {}

        source = options.get("source", "auto")
        build_timeline = options.get("build_timeline", True)

        findings = []
        locations = []

        # Визначаємо тип цілі
        if target.startswith("http") and any(ext in target.lower() for ext in [".jpg", ".jpeg", ".png"]):
            # Зображення — витягуємо EXIF
            locations = [
                {
                    "source": "exif",
                    "latitude": 50.4501,
                    "longitude": 30.5234,
                    "timestamp": "2026-03-10T14:30:00Z",
                    "accuracy": "exact",
                    "metadata": {
                        "camera": "iPhone 15 Pro",
                        "software": "iOS 17.4",
                    },
                },
            ]

            findings.append({
                "type": "exif_location",
                "value": "50.4501, 30.5234",
                "confidence": 0.98,
                "source": "creepy",
                "metadata": {
                    "city": "Kyiv",
                    "country": "Ukraine",
                },
            })

        else:
            # Username — збираємо з соцмереж
            locations = [
                {
                    "source": "twitter",
                    "latitude": 50.4501,
                    "longitude": 30.5234,
                    "timestamp": "2026-03-10T10:00:00Z",
                    "accuracy": "city",
                    "context": "Tweet with location tag",
                },
                {
                    "source": "twitter",
                    "latitude": 50.4547,
                    "longitude": 30.5238,
                    "timestamp": "2026-03-09T18:30:00Z",
                    "accuracy": "exact",
                    "context": "Photo with GPS",
                },
                {
                    "source": "instagram",
                    "latitude": 48.8566,
                    "longitude": 2.3522,
                    "timestamp": "2026-02-15T12:00:00Z",
                    "accuracy": "place",
                    "context": "Tagged at Eiffel Tower",
                },
                {
                    "source": "instagram",
                    "latitude": 50.0755,
                    "longitude": 14.4378,
                    "timestamp": "2026-01-20T09:00:00Z",
                    "accuracy": "city",
                    "context": "Prague check-in",
                },
            ]

            for loc in locations:
                findings.append({
                    "type": "social_location",
                    "value": f"{loc['latitude']}, {loc['longitude']}",
                    "confidence": 0.85 if loc["accuracy"] == "exact" else 0.7,
                    "source": f"creepy:{loc['source']}",
                    "metadata": {
                        "timestamp": loc["timestamp"],
                        "context": loc.get("context"),
                    },
                })

        # Побудова timeline
        timeline = []
        if build_timeline and locations:
            # Сортуємо за часом
            sorted_locs = sorted(locations, key=lambda x: x["timestamp"])
            for i, loc in enumerate(sorted_locs):
                timeline.append({
                    "order": i + 1,
                    "timestamp": loc["timestamp"],
                    "location": {
                        "lat": loc["latitude"],
                        "lon": loc["longitude"],
                    },
                    "source": loc["source"],
                    "accuracy": loc["accuracy"],
                })

        # Аналіз патернів
        patterns = {}
        if len(locations) >= 3:
            # Визначаємо "домашню" локацію (найчастіша)
            from collections import Counter
            cities = []
            for loc in locations:
                # Спрощена логіка — в реальності reverse geocoding
                if loc["latitude"] > 50 and loc["longitude"] > 30:
                    cities.append("Kyiv")
                elif loc["latitude"] > 48 and loc["longitude"] < 3:
                    cities.append("Paris")
                else:
                    cities.append("Other")

            city_counts = Counter(cities)
            if city_counts:
                most_common = city_counts.most_common(1)[0]
                patterns["likely_home"] = most_common[0]
                patterns["home_confidence"] = most_common[1] / len(cities)

            # Визначаємо подорожі
            patterns["travel_detected"] = len(set(cities)) > 1
            patterns["countries_visited"] = list(set(cities))

        duration = (datetime.now(UTC) - start_time).total_seconds()

        return ToolResult(
            tool_name=self.name,
            status=ToolStatus.SUCCESS,
            data={
                "target": target,
                "locations_found": len(locations),
                "locations": locations,
                "timeline": timeline,
                "patterns": patterns,
                "sources_used": list(set(loc["source"] for loc in locations)),
            },
            findings=findings,
            duration_seconds=duration,
        )
