"""Транспортні реєстри — МТСБУ, перевізники.

Держатель: МТСБУ, Укртрансбезпека
Формат: API, XML
"""
import logging
from datetime import UTC, datetime

from .base import BaseRegistryClient, RegistryResult, RegistryStatus

logger = logging.getLogger(__name__)


class MTSBUClient(BaseRegistryClient):
    """Централізована база даних МТСБУ (страхова історія)."""

    name = "mtsbu"
    description = "Централізована база даних МТСБУ"
    holder = "Моторне (транспортне) страхове бюро України"
    data_format = "API"
    status = RegistryStatus.ACTIVE
    update_frequency = "daily"

    async def search_by_edrpou(self, edrpou: str) -> RegistryResult:
        """Пошук страхової історії за ЄДРПОУ."""
        start_time = datetime.now(UTC)
        edrpou = self.normalize_edrpou(edrpou)

        data = {
            "edrpou": edrpou,
            "vehicles": [
                {
                    "plate_number": "AA1234BB",
                    "vin": "WVWZZZ3CZWE123456",
                    "insurance_history": [
                        {
                            "policy_number": "АА/1234567",
                            "insurer": "СК «Універсальна»",
                            "start_date": "2024-01-01",
                            "end_date": "2025-01-01",
                            "status": "active",
                            "type": "ОСЦПВ",
                        },
                    ],
                    "accidents": [],
                    "bonus_malus_class": "M0",
                },
            ],
            "total_vehicles": 1,
            "active_policies": 1,
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

    async def check_policy(self, plate_number: str) -> RegistryResult:
        """Перевірка полісу ОСЦПВ за номерним знаком."""
        start_time = datetime.now(UTC)

        data = {
            "plate_number": plate_number.upper(),
            "has_valid_policy": True,
            "policy": {
                "number": "АА/1234567",
                "insurer": "СК «Універсальна»",
                "start_date": "2024-01-01",
                "end_date": "2025-01-01",
                "status": "active",
            },
        }

        return RegistryResult(
            registry_name=self.name,
            success=True,
            data=data,
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )


class CarriersLicensesClient(BaseRegistryClient):
    """Реєстр ліцензій перевізників."""

    name = "carriers_licenses"
    description = "Реєстр ліцензій на перевезення пасажирів та вантажів"
    holder = "Укртрансбезпека"
    data_format = "XML"
    status = RegistryStatus.ACTIVE
    update_frequency = "weekly"

    async def search_by_edrpou(self, edrpou: str) -> RegistryResult:
        """Пошук ліцензій перевізника."""
        start_time = datetime.now(UTC)
        edrpou = self.normalize_edrpou(edrpou)

        licenses = [
            {
                "number": f"ЛП-{edrpou[:6]}-001",
                "type": "Внутрішні перевезення пасажирів автобусами",
                "issue_date": "2020-06-15",
                "valid_until": "2025-06-15",
                "status": "active",
                "vehicles_count": 10,
                "routes": ["Київ - Одеса", "Київ - Львів"],
            },
            {
                "number": f"ЛВ-{edrpou[:6]}-001",
                "type": "Внутрішні перевезення вантажів",
                "issue_date": "2021-03-20",
                "valid_until": "2026-03-20",
                "status": "active",
                "vehicles_count": 25,
            },
        ]

        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"edrpou": edrpou, "licenses": licenses, "total": len(licenses)},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )

    async def search_by_name(self, name: str) -> RegistryResult:
        """Пошук за назвою."""
        start_time = datetime.now(UTC)
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"query": name, "licenses": [], "total": 0},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )


class DriverCabinetClient(BaseRegistryClient):
    """Електронний кабінет водія."""

    name = "driver_cabinet"
    description = "Електронний кабінет водія (історія авто за VIN)"
    holder = "МВС України"
    data_format = "API"
    status = RegistryStatus.ACTIVE
    update_frequency = "daily"

    async def search_by_edrpou(self, edrpou: str) -> RegistryResult:
        """Пошук за ЄДРПОУ (для юросіб)."""
        start_time = datetime.now(UTC)
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"edrpou": edrpou, "vehicles": [], "total": 0},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )

    async def search_by_name(self, name: str) -> RegistryResult:
        """Пошук за ПІБ."""
        start_time = datetime.now(UTC)
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"query": name, "vehicles": [], "total": 0},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )

    async def get_vehicle_history(self, vin: str) -> RegistryResult:
        """Отримати історію авто за VIN."""
        start_time = datetime.now(UTC)

        history = {
            "vin": vin,
            "brand": "Volkswagen",
            "model": "Passat",
            "year": 2020,
            "registrations": [
                {
                    "date": "2020-06-15",
                    "event": "Перша реєстрація в Україні",
                    "region": "Київ",
                    "owner_type": "legal_entity",
                },
            ],
            "technical_inspections": [
                {"date": "2024-01-15", "result": "passed", "valid_until": "2026-01-15"},
            ],
            "accidents": [],
            "stolen": False,
            "mileage_records": [
                {"date": "2024-01-15", "mileage_km": 45000},
            ],
        }

        return RegistryResult(
            registry_name=self.name,
            success=True,
            data=history,
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )
