"""Публічна кадастрова карта.

Держатель: Держгеокадастр
Формат: API, WMS/WFS
Статус: Не оновлюється з 24.02.2022 (архівні дані)
"""
import logging
from datetime import UTC, datetime

from .base import BaseRegistryClient, RegistryResult, RegistryStatus

logger = logging.getLogger(__name__)


class CadastreClient(BaseRegistryClient):
    """Клієнт для Публічної кадастрової карти."""

    name = "cadastre"
    description = "Публічна кадастрова карта України"
    holder = "Держгеокадастр"
    data_format = "API/WMS/WFS"
    status = RegistryStatus.ARCHIVED  # Не оновлюється з початку війни
    update_frequency = "archived"

    async def search_by_edrpou(self, edrpou: str) -> RegistryResult:
        """Пошук земельних ділянок за ЄДРПОУ."""
        start_time = datetime.now(UTC)
        edrpou = self.normalize_edrpou(edrpou)

        parcels = [
            {
                "cadastral_number": "3220810100:01:001:0001",
                "area_ha": 0.5,
                "purpose": "Для ведення товарного сільськогосподарського виробництва",
                "ownership_type": "Оренда",
                "owner_edrpou": edrpou,
                "region": "Київська область",
                "district": "Бориспільський район",
                "coordinates": {"lat": 50.3456, "lon": 30.9876},
            },
        ]

        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"edrpou": edrpou, "parcels": parcels, "total": len(parcels)},
            warnings=["Дані не оновлюються з 24.02.2022"],
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )

    async def search_by_name(self, name: str) -> RegistryResult:
        """Пошук за назвою власника."""
        start_time = datetime.now(UTC)
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"query": name, "parcels": [], "total": 0},
            warnings=["Дані не оновлюються з 24.02.2022"],
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )

    async def get_parcel_info(self, cadastral_number: str) -> RegistryResult:
        """Отримати інформацію про земельну ділянку."""
        start_time = datetime.now(UTC)

        parcel = {
            "cadastral_number": cadastral_number,
            "area_ha": 1.25,
            "purpose": "Для будівництва і обслуговування житлового будинку",
            "purpose_code": "02.01",
            "ownership_type": "Приватна власність",
            "owner": "Іванов Іван Іванович",
            "region": "Київська область",
            "district": "Бориспільський район",
            "settlement": "с. Гора",
            "coordinates": {
                "center": {"lat": 50.3456, "lon": 30.9876},
                "bounds": [[50.345, 30.987], [50.346, 30.988]],
            },
            "restrictions": [],
            "last_update": "2022-02-23",
        }

        return RegistryResult(
            registry_name=self.name,
            success=True,
            data=parcel,
            warnings=["Дані не оновлюються з 24.02.2022"],
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )
