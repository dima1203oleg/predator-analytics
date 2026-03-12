"""ЄДР — Єдиний державний реєстр юридичних осіб та ФОП.

Держатель: Міністерство юстиції України
Формат: XML/JSON, API
Статус: Основний реєстр, замінює ЄДРПОУ (ліквідація до кінця 2026)

Поля:
- Код ЄДРПОУ / РНОКПП
- Повне найменування
- Статус (зареєстровано, припинено, банкрутство)
- Дата реєстрації
- Адреса
- КВЕД (основний + другорядні)
- Керівник (ПІБ, РНОКПП, посада)
- Засновники (учасники)
- Кінцевий бенефіціарний власник
- Статутний капітал
"""
import logging
from datetime import datetime, UTC
from typing import Any

import httpx

from .base import BaseRegistryClient, RegistryResult, RegistryStatus

logger = logging.getLogger(__name__)


class EDRFullClient(BaseRegistryClient):
    """Клієнт для Єдиного державного реєстру."""
    
    name = "edr"
    description = "Єдиний державний реєстр юридичних осіб, ФОП та громадських формувань"
    holder = "Міністерство юстиції України"
    data_format = "XML/JSON"
    status = RegistryStatus.ACTIVE
    update_frequency = "daily"
    
    # API endpoints
    DATA_GOV_UA = "https://data.gov.ua/api/3/action/package_show?id=1c7f3815-3259-45e0-bdf1-64dca07ddc10"
    USR_API = "https://usr.minjust.gov.ua/api"
    
    async def search_by_edrpou(self, edrpou: str) -> RegistryResult:
        """Пошук компанії за кодом ЄДРПОУ.
        
        Args:
            edrpou: Код ЄДРПОУ (8 цифр)
            
        Returns:
            RegistryResult з даними компанії
        """
        start_time = datetime.now(UTC)
        edrpou = self.normalize_edrpou(edrpou)
        
        if not self.validate_edrpou(edrpou):
            return RegistryResult(
                registry_name=self.name,
                success=False,
                errors=["Невалідний код ЄДРПОУ: має бути 8 цифр"],
            )
        
        # Перевірка кешу
        cache_key = f"edr:{edrpou}"
        cached = self._get_cached(cache_key)
        if cached:
            return RegistryResult(
                registry_name=self.name,
                success=True,
                data=cached,
                cache_hit=True,
            )
        
        # Симуляція даних ЄДР
        # В реальності — запит до API Мін'юсту або data.gov.ua
        company_data = self._simulate_edr_data(edrpou)
        
        response_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
        
        self._set_cached(cache_key, company_data)
        
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data=company_data,
            source_url=f"{self.USR_API}/companies/{edrpou}",
            response_time_ms=response_time,
        )
    
    async def search_by_name(self, name: str) -> RegistryResult:
        """Пошук компаній за назвою.
        
        Args:
            name: Назва компанії (частковий збіг)
            
        Returns:
            RegistryResult зі списком компаній
        """
        start_time = datetime.now(UTC)
        
        if len(name) < 3:
            return RegistryResult(
                registry_name=self.name,
                success=False,
                errors=["Назва має містити мінімум 3 символи"],
            )
        
        # Симуляція пошуку
        results = [
            self._simulate_edr_data("12345678", name=f"{name} ТОВ"),
            self._simulate_edr_data("87654321", name=f"ПП {name}"),
        ]
        
        response_time = (datetime.now(UTC) - start_time).total_seconds() * 1000
        
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"results": results, "total": len(results)},
            response_time_ms=response_time,
        )
    
    async def search_by_director(self, director_name: str) -> RegistryResult:
        """Пошук компаній за ПІБ керівника."""
        start_time = datetime.now(UTC)
        
        # Симуляція
        results = [
            self._simulate_edr_data("11111111", director_name=director_name),
        ]
        
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"results": results, "total": len(results)},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )
    
    async def search_by_founder(self, founder_name: str) -> RegistryResult:
        """Пошук компаній за засновником."""
        start_time = datetime.now(UTC)
        
        results = [
            self._simulate_edr_data("22222222", founder_name=founder_name),
        ]
        
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"results": results, "total": len(results)},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )
    
    async def get_beneficiaries(self, edrpou: str) -> RegistryResult:
        """Отримати кінцевих бенефіціарних власників."""
        start_time = datetime.now(UTC)
        edrpou = self.normalize_edrpou(edrpou)
        
        beneficiaries = [
            {
                "name": "Іванов Іван Іванович",
                "rnokpp": "1234567890",
                "country": "Україна",
                "share_percent": 75.0,
                "control_type": "Прямий",
                "registration_date": "2020-01-15",
            },
            {
                "name": "Петров Петро Петрович",
                "rnokpp": "0987654321",
                "country": "Україна",
                "share_percent": 25.0,
                "control_type": "Прямий",
                "registration_date": "2020-01-15",
            },
        ]
        
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={
                "edrpou": edrpou,
                "beneficiaries": beneficiaries,
                "total": len(beneficiaries),
            },
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )
    
    async def get_history(self, edrpou: str) -> RegistryResult:
        """Отримати історію змін компанії."""
        start_time = datetime.now(UTC)
        edrpou = self.normalize_edrpou(edrpou)
        
        history = [
            {
                "date": "2024-06-15",
                "change_type": "Зміна керівника",
                "old_value": "Сидоров С.С.",
                "new_value": "Іванов І.І.",
            },
            {
                "date": "2023-01-10",
                "change_type": "Зміна адреси",
                "old_value": "м. Київ, вул. Хрещатик, 1",
                "new_value": "м. Київ, вул. Грушевського, 5",
            },
            {
                "date": "2020-01-15",
                "change_type": "Державна реєстрація",
                "old_value": None,
                "new_value": "Зареєстровано",
            },
        ]
        
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={
                "edrpou": edrpou,
                "history": history,
                "total_changes": len(history),
            },
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )
    
    def _simulate_edr_data(
        self,
        edrpou: str,
        name: str | None = None,
        director_name: str | None = None,
        founder_name: str | None = None,
    ) -> dict[str, Any]:
        """Симуляція даних ЄДР."""
        return {
            "edrpou": edrpou,
            "name": name or f"ТОВ «КОМПАНІЯ {edrpou}»",
            "short_name": f"КОМПАНІЯ {edrpou}",
            "status": "зареєстровано",
            "status_code": 1,
            "registration_date": "2020-01-15",
            "registration_number": f"1000{edrpou}",
            "address": {
                "full": "01001, м. Київ, вул. Хрещатик, буд. 1, офіс 100",
                "region": "Київська область",
                "city": "Київ",
                "street": "вул. Хрещатик",
                "building": "1",
                "office": "100",
                "postal_code": "01001",
            },
            "kved": {
                "primary": {
                    "code": "62.01",
                    "name": "Комп'ютерне програмування",
                },
                "secondary": [
                    {"code": "62.02", "name": "Консультування з питань інформатизації"},
                    {"code": "63.11", "name": "Оброблення даних, розміщення інформації"},
                ],
            },
            "director": {
                "name": director_name or "Іванов Іван Іванович",
                "position": "Директор",
                "rnokpp": "1234567890",
                "appointment_date": "2020-01-15",
            },
            "founders": [
                {
                    "name": founder_name or "Петров Петро Петрович",
                    "type": "individual",
                    "rnokpp": "0987654321",
                    "country": "Україна",
                    "share_percent": 100.0,
                    "share_amount": 100000.0,
                },
            ],
            "authorized_capital": {
                "amount": 100000.0,
                "currency": "UAH",
                "paid_percent": 100.0,
            },
            "contacts": {
                "phone": "+380441234567",
                "email": f"info@company{edrpou}.ua",
            },
            "tax_info": {
                "is_vat_payer": True,
                "vat_number": edrpou,
                "is_single_tax": False,
            },
            "bankruptcy": {
                "is_bankrupt": False,
                "proceedings": [],
            },
            "sanctions": {
                "is_sanctioned": False,
                "sanctions_list": [],
            },
        }
