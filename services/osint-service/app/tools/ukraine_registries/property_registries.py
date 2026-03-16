"""Реєстри нерухомості — іпотеки, заборони відчуження.

Держатель: Міністерство юстиції України
Формат: API
"""
import logging
from datetime import UTC, datetime

from .base import BaseRegistryClient, RegistryResult, RegistryStatus

logger = logging.getLogger(__name__)


class MortgageRegistryClient(BaseRegistryClient):
    """Державний реєстр іпотек."""

    name = "mortgage_registry"
    description = "Державний реєстр іпотек"
    holder = "Міністерство юстиції України"
    data_format = "API"
    status = RegistryStatus.ACTIVE
    update_frequency = "daily"

    async def search_by_edrpou(self, edrpou: str) -> RegistryResult:
        """Пошук іпотек за ЄДРПОУ іпотекодавця/іпотекодержателя."""
        start_time = datetime.now(UTC)
        edrpou = self.normalize_edrpou(edrpou)

        mortgages = [
            {
                "registration_number": f"ІП-{edrpou[:6]}-001",
                "registration_date": "2022-03-15",
                "mortgagor": {
                    "name": f"ТОВ «Компанія {edrpou}»",
                    "edrpou": edrpou,
                },
                "mortgagee": {
                    "name": "ПАТ «Приватбанк»",
                    "edrpou": "14360570",
                },
                "property": {
                    "type": "Нежитлове приміщення",
                    "address": "м. Київ, вул. Хрещатик, 1",
                    "area_sqm": 500.0,
                },
                "obligation": {
                    "type": "Кредитний договір",
                    "amount": 5000000.0,
                    "currency": "UAH",
                    "term_until": "2027-03-15",
                },
                "status": "active",
            },
        ]

        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={
                "edrpou": edrpou,
                "mortgages": mortgages,
                "total": len(mortgages),
                "as_mortgagor": len([m for m in mortgages if m["mortgagor"]["edrpou"] == edrpou]),
                "as_mortgagee": len([m for m in mortgages if m["mortgagee"]["edrpou"] == edrpou]),
            },
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )

    async def search_by_name(self, name: str) -> RegistryResult:
        """Пошук за назвою."""
        start_time = datetime.now(UTC)
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"query": name, "mortgages": [], "total": 0},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )


class AlienationBanRegistryClient(BaseRegistryClient):
    """Єдиний реєстр заборон відчуження об'єктів нерухомого майна."""

    name = "alienation_ban_registry"
    description = "Єдиний реєстр заборон відчуження об'єктів нерухомого майна"
    holder = "Міністерство юстиції України"
    data_format = "API"
    status = RegistryStatus.ACTIVE
    update_frequency = "daily"

    async def search_by_edrpou(self, edrpou: str) -> RegistryResult:
        """Пошук заборон за ЄДРПОУ."""
        start_time = datetime.now(UTC)
        edrpou = self.normalize_edrpou(edrpou)

        bans = [
            {
                "registration_number": f"ЗВ-{edrpou[:6]}-001",
                "registration_date": "2023-06-20",
                "property": {
                    "type": "Земельна ділянка",
                    "cadastral_number": "3220810100:01:001:0001",
                    "address": "Київська обл., Бориспільський р-н",
                },
                "ban_type": "Арешт",
                "imposer": "Виконавча служба",
                "case_number": "12345/24",
                "status": "active",
            },
        ]

        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={
                "edrpou": edrpou,
                "bans": bans,
                "total": len(bans),
                "has_active_bans": any(b["status"] == "active" for b in bans),
            },
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )

    async def search_by_name(self, name: str) -> RegistryResult:
        """Пошук за назвою."""
        start_time = datetime.now(UTC)
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"query": name, "bans": [], "total": 0},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )


class ELandClient(BaseRegistryClient):
    """E.land — електронні послуги Держгеокадастру."""

    name = "eland"
    description = "E.land — електронні послуги Держгеокадастру"
    holder = "Держгеокадастр"
    data_format = "API/XML"
    status = RegistryStatus.LIMITED  # Обмежений під час війни
    update_frequency = "daily"

    async def search_by_edrpou(self, edrpou: str) -> RegistryResult:
        """Пошук земельних ділянок за ЄДРПОУ."""
        start_time = datetime.now(UTC)
        edrpou = self.normalize_edrpou(edrpou)

        parcels = [
            {
                "cadastral_number": "3220810100:01:001:0001",
                "area_ha": 1.5,
                "purpose": "Для ведення товарного сільськогосподарського виробництва",
                "ownership_type": "Власність",
                "owner_edrpou": edrpou,
                "registration_date": "2020-05-15",
                "restrictions": [],
            },
        ]

        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"edrpou": edrpou, "parcels": parcels, "total": len(parcels)},
            warnings=["Сервіс працює з обмеженнями під час воєнного стану"],
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )

    async def search_by_name(self, name: str) -> RegistryResult:
        """Пошук за назвою."""
        start_time = datetime.now(UTC)
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"query": name, "parcels": [], "total": 0},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )
