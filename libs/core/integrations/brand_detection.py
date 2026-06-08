"""Brand Detection Module для виявлення підробок та фіктивних брендів.

Модуль використовує NLP та ML для виявлення брендів в описах товарів.
"""

from __future__ import annotations

from dataclasses import dataclass
import logging
import re

logger = logging.getLogger(__name__)


@dataclass
class BrandMatch:
    """Знайдений бренд."""

    brand_name: str
    confidence: float
    position: int
    is_verified: bool


@dataclass
class BrandDetectionResult:
    """Результат виявлення брендів."""

    detected_brands: list[BrandMatch]
    is_counterfeit: bool
    confidence: float
    suspicious_indicators: list[str]


class BrandRegistry:
    """Реєстр відомих брендів."""

    def __init__(self):
        # TODO: Завантажувати з БД
        self._known_brands = {
            "nike": True,
            "adidas": True,
            "apple": True,
            "samsung": True,
            "sony": True,
            "lg": True,
            "bosch": True,
            "siemens": True,
            "philips": True,
            "panasonic": True,
            # Додати більше брендів
        }

    def is_known_brand(self, brand_name: str) -> bool:
        """Перевірити чи бренд відомий."""
        return brand_name.lower() in self._known_brands

    def add_brand(self, brand_name: str, is_verified: bool = True):
        """Додати бренд до реєстру."""
        self._known_brands[brand_name.lower()] = is_verified


class BrandDetector:
    """Детектор брендів на основі NLP."""

    def __init__(self):
        self.registry = BrandRegistry()
        # Патерни для виявлення брендів
        self.brand_patterns = [
            r'\b(nike|adidas|puma|reebok|new balance)\b',
            r'\b(apple|samsung|huawei|xiaomi|oppo|vivo)\b',
            r'\b(sony|lg|philips|panasonic|sharp|toshiba)\b',
            r'\b(bosch|siemens|miele|electrolux|whirlpool)\b',
            r'\b(gucci|prada|chanel|louis vuitton|hermes|dior)\b',
            r'\b(rolex|omega|cartier|tag heuer|patek philippe)\b',
            r'\b(bmw|mercedes|audi|volkswagen|toyota|honda)\b',
            # Додати більше патернів
        ]

    def detect_brands(
        self,
        text: str,
    ) -> BrandDetectionResult:
        """Виявити бренди в тексті.
        
        Args:
            text: Опис товару
            
        Returns:
            Результат виявлення брендів

        """
        text_lower = text.lower()
        detected_brands = []
        suspicious_indicators = []

        # Виявлення брендів за патернами
        for pattern in self.brand_patterns:
            matches = re.finditer(pattern, text_lower, re.IGNORECASE)
            for match in matches:
                brand_name = match.group()
                is_verified = self.registry.is_known_brand(brand_name)
                confidence = 0.9 if is_verified else 0.5

                detected_brands.append(BrandMatch(
                    brand_name=brand_name,
                    confidence=confidence,
                    position=match.start(),
                    is_verified=is_verified,
                ))

        # Аналіз підозрілих індикаторів
        if "no name" in text_lower or "no-name" in text_lower:
            suspicious_indicators.append("Товар декларується як no-name")

        if "generic" in text_lower:
            suspicious_indicators.append("Товар декларується як generic")

        if "unbranded" in text_lower:
            suspicious_indicators.append("Товар декларується як unbranded")

        # Якщо знайдено бренд але декларується як no-name
        if detected_brands and any("no name" in ind.lower() for ind in suspicious_indicators):
            suspicious_indicators.append("Бренд виявлено але декларується як no-name")

        # Розрахунок загальної впевненості
        overall_confidence = 0.0
        if detected_brands:
            overall_confidence = sum(b.confidence for b in detected_brands) / len(detected_brands)

        # Визначення чи це підробка
        is_counterfeit = (
            len(detected_brands) > 0
            and overall_confidence > 0.7
            and len(suspicious_indicators) > 0
        )

        return BrandDetectionResult(
            detected_brands=detected_brands,
            is_counterfeit=is_counterfeit,
            confidence=overall_confidence,
            suspicious_indicators=suspicious_indicators,
        )


class BrandDetectionService:
    """Сервіс для виявлення брендів."""

    def __init__(self):
        self.detector = BrandDetector()

    def analyze_goods_description(
        self,
        goods_description: str,
    ) -> BrandDetectionResult:
        """Проаналізувати опис товару на наявність брендів.
        
        Args:
            goods_description: Опис товару
            
        Returns:
            Результат аналізу

        """
        return self.detector.detect_brands(goods_description)


# Синглтон
_brand_detection_service: BrandDetectionService | None = None


def get_brand_detection_service() -> BrandDetectionService:
    """Отримати синглтон інстанс сервісу виявлення брендів."""
    global _brand_detection_service
    if _brand_detection_service is None:
        _brand_detection_service = BrandDetectionService()
    return _brand_detection_service
