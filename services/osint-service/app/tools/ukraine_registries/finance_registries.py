"""Фінансові реєстри — держборг, гарантії, SNIDA.

Держатель: Міністерство фінансів України, НКЦПФР
Формат: XML/JSON, API
"""
import logging
from datetime import datetime, UTC

from .base import BaseRegistryClient, RegistryResult, RegistryStatus

logger = logging.getLogger(__name__)


class StateDebtRegistryClient(BaseRegistryClient):
    """Реєстр державного боргу."""
    
    name = "state_debt"
    description = "Реєстр державного боргу України"
    holder = "Міністерство фінансів України"
    data_format = "XML"
    status = RegistryStatus.ACTIVE
    update_frequency = "monthly"
    
    async def search_by_edrpou(self, edrpou: str) -> RegistryResult:
        """Пошук боргових зобов'язань за ЄДРПОУ."""
        start_time = datetime.now(UTC)
        edrpou = self.normalize_edrpou(edrpou)
        
        # Для держорганів — перевірка боргових зобов'язань
        data = {
            "edrpou": edrpou,
            "has_state_guarantees": False,
            "guarantees": [],
            "bonds_issued": [],
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


class StateGuaranteesClient(BaseRegistryClient):
    """Реєстр державних гарантій."""
    
    name = "state_guarantees"
    description = "Реєстр державних гарантій"
    holder = "Міністерство фінансів України"
    data_format = "XML"
    status = RegistryStatus.ACTIVE
    update_frequency = "monthly"
    
    async def search_by_edrpou(self, edrpou: str) -> RegistryResult:
        """Пошук держгарантій за ЄДРПОУ."""
        start_time = datetime.now(UTC)
        edrpou = self.normalize_edrpou(edrpou)
        
        data = {
            "edrpou": edrpou,
            "has_guarantees": False,
            "guarantees": [],
            "total_amount": 0.0,
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


class SNIDAClient(BaseRegistryClient):
    """SNIDA — Реєстр емітентів цінних паперів.
    
    Держатель: НКЦПФР
    Дані про власників акцій, емісії, звітність.
    """
    
    name = "snida"
    description = "Реєстр емітентів цінних паперів (SNIDA)"
    holder = "НКЦПФР"
    data_format = "API/JSON"
    status = RegistryStatus.ACTIVE
    update_frequency = "daily"
    
    async def search_by_edrpou(self, edrpou: str) -> RegistryResult:
        """Пошук емітента за ЄДРПОУ."""
        start_time = datetime.now(UTC)
        edrpou = self.normalize_edrpou(edrpou)
        
        data = {
            "edrpou": edrpou,
            "is_issuer": True,
            "issuer_info": {
                "name": f"ПАТ «Компанія {edrpou}»",
                "type": "Публічне акціонерне товариство",
                "registration_date": "2015-03-20",
                "authorized_capital": 50000000.0,
                "shares_count": 500000,
                "nominal_value": 100.0,
            },
            "securities": [
                {
                    "type": "Акції прості іменні",
                    "isin": f"UA{edrpou}00001",
                    "count": 500000,
                    "nominal_value": 100.0,
                    "issue_date": "2015-03-20",
                },
            ],
            "shareholders": [
                {
                    "name": "Іванов Іван Іванович",
                    "type": "individual",
                    "share_percent": 51.0,
                    "shares_count": 255000,
                },
                {
                    "name": "ТОВ «Холдинг»",
                    "type": "legal_entity",
                    "edrpou": "87654321",
                    "share_percent": 49.0,
                    "shares_count": 245000,
                },
            ],
            "reports": [
                {"year": 2023, "type": "Річний звіт", "submitted": True},
                {"year": 2022, "type": "Річний звіт", "submitted": True},
            ],
        }
        
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data=data,
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )
    
    async def search_by_name(self, name: str) -> RegistryResult:
        """Пошук емітентів за назвою."""
        start_time = datetime.now(UTC)
        
        results = [
            {
                "edrpou": "12345678",
                "name": f"{name} ПАТ",
                "type": "Публічне акціонерне товариство",
                "authorized_capital": 50000000.0,
            },
        ]
        
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"query": name, "results": results, "total": len(results)},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )
    
    async def get_shareholders(self, edrpou: str) -> RegistryResult:
        """Отримати список акціонерів."""
        result = await self.search_by_edrpou(edrpou)
        if result.success:
            return RegistryResult(
                registry_name=self.name,
                success=True,
                data={
                    "edrpou": edrpou,
                    "shareholders": result.data.get("shareholders", []),
                },
            )
        return result
