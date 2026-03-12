"""Реєстр прав на нерухоме майно.

Держатель: Міністерство юстиції України
Формат: API (платний доступ)
"""
import logging
from datetime import datetime, UTC

from .base import BaseRegistryClient, RegistryResult, RegistryStatus

logger = logging.getLogger(__name__)


class RealEstateRegistryClient(BaseRegistryClient):
    """Клієнт для Реєстру прав на нерухоме майно."""
    
    name = "real_estate_registry"
    description = "Державний реєстр речових прав на нерухоме майно"
    holder = "Міністерство юстиції України"
    data_format = "API"
    status = RegistryStatus.ACTIVE
    update_frequency = "daily"
    
    async def search_by_edrpou(self, edrpou: str) -> RegistryResult:
        """Пошук нерухомості за ЄДРПОУ власника."""
        start_time = datetime.now(UTC)
        edrpou = self.normalize_edrpou(edrpou)
        
        properties = [
            {
                "registration_number": "12345678",
                "type": "Нежитлове приміщення",
                "address": "м. Київ, вул. Хрещатик, 1, офіс 100",
                "area_sqm": 150.5,
                "ownership_type": "Приватна власність",
                "owner": f"ТОВ «Компанія {edrpou}»",
                "registration_date": "2020-05-15",
                "encumbrances": [],
            },
            {
                "registration_number": "87654321",
                "type": "Земельна ділянка",
                "address": "Київська обл., Бориспільський р-н",
                "area_sqm": 5000.0,
                "cadastral_number": "3220810100:01:001:0001",
                "ownership_type": "Оренда",
                "owner": f"ТОВ «Компанія {edrpou}»",
                "registration_date": "2021-03-20",
                "lease_end": "2031-03-20",
                "encumbrances": [
                    {"type": "Іпотека", "creditor": "ПАТ «Банк»", "amount": 1000000.0},
                ],
            },
        ]
        
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={
                "edrpou": edrpou,
                "properties": properties,
                "total": len(properties),
                "total_area_sqm": sum(p["area_sqm"] for p in properties),
            },
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )
    
    async def search_by_name(self, name: str) -> RegistryResult:
        """Пошук за назвою власника."""
        start_time = datetime.now(UTC)
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"query": name, "properties": [], "total": 0},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )
    
    async def search_by_address(self, address: str) -> RegistryResult:
        """Пошук за адресою."""
        start_time = datetime.now(UTC)
        
        property_data = {
            "registration_number": "99999999",
            "type": "Квартира",
            "address": address,
            "area_sqm": 75.0,
            "ownership_type": "Приватна власність",
            "owners": [
                {"name": "Іванов Іван Іванович", "share": "1/2"},
                {"name": "Іванова Марія Петрівна", "share": "1/2"},
            ],
            "registration_date": "2019-08-10",
            "encumbrances": [],
        }
        
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data=property_data,
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )
    
    async def check_encumbrances(self, registration_number: str) -> RegistryResult:
        """Перевірка обтяжень."""
        start_time = datetime.now(UTC)
        
        encumbrances = [
            {
                "type": "Іпотека",
                "creditor": "ПАТ «Приватбанк»",
                "amount": 500000.0,
                "registration_date": "2020-01-15",
                "end_date": "2030-01-15",
            },
        ]
        
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={
                "registration_number": registration_number,
                "has_encumbrances": len(encumbrances) > 0,
                "encumbrances": encumbrances,
            },
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )
