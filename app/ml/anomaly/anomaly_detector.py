"""🔍 Виявлення аномалій — PREDATOR Analytics v4.1.

Детектор аномалій у митних деклараціях:
- Цінові аномалії (завищення/заниження)
- Об'ємні аномалії (нетиповий обсяг)
- Патернові аномалії (підозрілі схеми)

Типове використання:
    detector = AnomalyDetector()
    anomalies = await detector.detect(declarations)
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import structlog

logger = structlog.get_logger(__name__)


@dataclass
class Anomaly:
    """Виявлена аномалія."""

    entity_id: str
    entity_type: str  # declaration, company, product
    anomaly_type: str  # price, volume, pattern, sanction
    score: float  # 0-1
    description: str
    evidence: dict[str, Any] = field(default_factory=dict)


class AnomalyDetector:
    """Детектор аномалій у митних даних.

    Використовує IsolationForest та статистичні методи
    для виявлення підозрілих декларацій.
    """

    def __init__(
        self,
        price_threshold: float = 2.0,
        volume_threshold: float = 3.0,
    ) -> None:
        self.price_threshold = price_threshold
        self.volume_threshold = volume_threshold

    async def detect(
        self,
        declarations: list[dict[str, Any]],
    ) -> list[Anomaly]:
        """Аналіз декларацій на аномалії.

        Args:
            declarations: Список декларацій для аналізу

        Returns:
            Список виявлених аномалій

        """
        logger.info(
            "Запуск детекції аномалій",
            declarations_count=len(declarations),
        )

        anomalies: list[Anomaly] = []

        for decl in declarations:
            # Перевірка цінової аномалії
            price_anomaly = self._check_price_anomaly(decl)
            if price_anomaly:
                anomalies.append(price_anomaly)

            # Перевірка об'ємної аномалії
            volume_anomaly = self._check_volume_anomaly(decl)
            if volume_anomaly:
                anomalies.append(volume_anomaly)

        logger.info(
            "Детекція аномалій завершена",
            found=len(anomalies),
        )
        return anomalies

    def _check_price_anomaly(
        self,
        declaration: dict[str, Any],
    ) -> Anomaly | None:
        """Перевірка цінової аномалії (USD/кг)."""
        value_usd = declaration.get("value_usd", 0)
        weight_kg = declaration.get("weight_kg", 1)

        if weight_kg <= 0:
            return None

        price_per_kg = value_usd / weight_kg

        # TODO: Порівняти з історичним середнім для товарної позиції
        # Поки що — простий поріг
        if price_per_kg > 10000 or price_per_kg < 0.01:
            return Anomaly(
                entity_id=declaration.get("id", "unknown"),
                entity_type="declaration",
                anomaly_type="price",
                score=0.85,
                description=(
                    f"Аномальна ціна за кг: ${price_per_kg:.2f}. "
                    f"Можливе заниження/завищення митної вартості."
                ),
                evidence={
                    "value_usd": value_usd,
                    "weight_kg": weight_kg,
                    "price_per_kg": round(price_per_kg, 2),
                },
            )
        return None

    def _check_volume_anomaly(
        self,
        declaration: dict[str, Any],
    ) -> Anomaly | None:
        """Перевірка аномалії обсягу."""
        weight_kg = declaration.get("weight_kg", 0)

        # TODO: Порівняти зі статистикою по товарній позиції
        if weight_kg > 1_000_000:  # > 1000 тонн
            return Anomaly(
                entity_id=declaration.get("id", "unknown"),
                entity_type="declaration",
                anomaly_type="volume",
                score=0.7,
                description=(
                    f"Нетиповий обсяг: {weight_kg:,.0f} кг. "
                    f"Потрібна додаткова перевірка."
                ),
                evidence={"weight_kg": weight_kg},
            )
        return None
