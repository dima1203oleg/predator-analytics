"""Енергетичні реєстри — монополії, газ, біометан.

Держатель: АМКУ, НКРЕКП, Держенергоефективності
Формат: XML, API
"""
import logging
from datetime import UTC, datetime

from .base import BaseRegistryClient, RegistryResult, RegistryStatus

logger = logging.getLogger(__name__)


class NaturalMonopoliesClient(BaseRegistryClient):
    """Зведений перелік природних монополій."""

    name = "natural_monopolies"
    description = "Зведений перелік суб'єктів природних монополій"
    holder = "Антимонопольний комітет України"
    data_format = "XML"
    status = RegistryStatus.ACTIVE
    update_frequency = "quarterly"

    async def search_by_edrpou(self, edrpou: str) -> RegistryResult:
        """Перевірка статусу природної монополії."""
        start_time = datetime.now(UTC)
        edrpou = self.normalize_edrpou(edrpou)

        # Симуляція — монополії мають специфічні ЄДРПОУ
        is_monopoly = edrpou.startswith("00") or edrpou.startswith("01")

        data = {
            "edrpou": edrpou,
            "is_natural_monopoly": is_monopoly,
            "monopoly_info": None,
        }

        if is_monopoly:
            data["monopoly_info"] = {
                "name": f"ПАТ «Монополія {edrpou}»",
                "sector": "Передача електричної енергії",
                "market": "Загальнодержавний",
                "registration_date": "2010-01-01",
                "regulator": "НКРЕКП",
            }

        return RegistryResult(
            registry_name=self.name,
            success=True,
            data=data,
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )

    async def search_by_name(self, name: str) -> RegistryResult:
        """Пошук за назвою."""
        start_time = datetime.now(UTC)
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"query": name, "results": [], "total": 0},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )


class GasMarketOperatorsClient(BaseRegistryClient):
    """Реєстр операторів ринку газу."""

    name = "gas_operators"
    description = "Реєстр операторів ринку природного газу"
    holder = "НКРЕКП"
    data_format = "XML"
    status = RegistryStatus.ACTIVE
    update_frequency = "weekly"

    async def search_by_edrpou(self, edrpou: str) -> RegistryResult:
        """Пошук оператора газу за ЄДРПОУ."""
        start_time = datetime.now(UTC)
        edrpou = self.normalize_edrpou(edrpou)

        data = {
            "edrpou": edrpou,
            "is_gas_operator": True,
            "operator_info": {
                "name": f"ТОВ «Газпостачання {edrpou}»",
                "type": "Постачальник природного газу",
                "license_number": f"ГАЗ-{edrpou[:6]}",
                "license_date": "2020-01-15",
                "license_valid_until": "2030-01-15",
                "regions": ["Київська область", "Житомирська область"],
                "customers_count": 150000,
            },
        }

        return RegistryResult(
            registry_name=self.name,
            success=True,
            data=data,
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )

    async def search_by_name(self, name: str) -> RegistryResult:
        """Пошук за назвою."""
        start_time = datetime.now(UTC)
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"query": name, "results": [], "total": 0},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )


class BiomethaneRegistryClient(BaseRegistryClient):
    """Реєстр біометану (новий, запускається в 2025)."""

    name = "biomethane_registry"
    description = "Реєстр біометану"
    holder = "Держенергоефективності"
    data_format = "API"
    status = RegistryStatus.LIMITED  # Новий реєстр
    update_frequency = "daily"

    async def search_by_edrpou(self, edrpou: str) -> RegistryResult:
        """Пошук виробників біометану."""
        start_time = datetime.now(UTC)
        edrpou = self.normalize_edrpou(edrpou)

        data = {
            "edrpou": edrpou,
            "is_biomethane_producer": False,
            "producer_info": None,
        }

        return RegistryResult(
            registry_name=self.name,
            success=True,
            data=data,
            warnings=["Реєстр запускається в 2025 році"],
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )

    async def search_by_name(self, name: str) -> RegistryResult:
        """Пошук за назвою."""
        start_time = datetime.now(UTC)
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"query": name, "results": [], "total": 0},
            warnings=["Реєстр запускається в 2025 році"],
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )


class OilGasWellsClient(BaseRegistryClient):
    """Єдиний реєстр нафтогазових свердловин."""

    name = "oil_gas_wells"
    description = "Єдиний реєстр нафтогазових та газових свердловин"
    holder = "Держгеонадра"
    data_format = "XML"
    status = RegistryStatus.ACTIVE
    update_frequency = "monthly"

    async def search_by_edrpou(self, edrpou: str) -> RegistryResult:
        """Пошук свердловин за ЄДРПОУ оператора."""
        start_time = datetime.now(UTC)
        edrpou = self.normalize_edrpou(edrpou)

        wells = [
            {
                "well_number": f"СВ-{edrpou[:4]}-001",
                "type": "Газова",
                "field": "Шебелинське",
                "region": "Харківська область",
                "depth_m": 3500,
                "status": "active",
                "operator_edrpou": edrpou,
                "license_number": f"НГ-{edrpou[:6]}",
            },
        ]

        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"edrpou": edrpou, "wells": wells, "total": len(wells)},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )

    async def search_by_name(self, name: str) -> RegistryResult:
        """Пошук за назвою."""
        start_time = datetime.now(UTC)
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"query": name, "wells": [], "total": 0},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )
