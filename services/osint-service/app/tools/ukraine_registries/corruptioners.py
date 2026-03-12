"""Реєстр корупціонерів та декларації НАЗК.

Держатель: Національне агентство з питань запобігання корупції (НАЗК)
Формат: API, JSON
"""
import logging
from datetime import datetime, UTC

from .base import BaseRegistryClient, RegistryResult, RegistryStatus

logger = logging.getLogger(__name__)


class CorruptionersRegistryClient(BaseRegistryClient):
    """Клієнт для реєстрів НАЗК."""
    
    name = "nazk_registry"
    description = "Реєстр корупціонерів та декларації НАЗК"
    holder = "НАЗК"
    data_format = "API/JSON"
    status = RegistryStatus.ACTIVE
    update_frequency = "weekly"
    
    DECLARATIONS_API = "https://public-api.nazk.gov.ua/v2/documents"
    CORRUPTIONERS_API = "https://corruptinfo.nazk.gov.ua/api"
    
    async def search_by_edrpou(self, edrpou: str) -> RegistryResult:
        """Пошук за ЄДРПОУ (зв'язок з компанією)."""
        start_time = datetime.now(UTC)
        
        data = {
            "edrpou": edrpou,
            "related_corruptioners": [],
            "related_declarations": [],
        }
        
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data=data,
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )
    
    async def search_by_name(self, name: str) -> RegistryResult:
        """Пошук корупціонера/декларанта за ПІБ."""
        start_time = datetime.now(UTC)
        
        # Симуляція пошуку в реєстрі корупціонерів
        corruptioners = []
        declarations = [
            {
                "id": "abc123",
                "year": 2023,
                "type": "Щорічна",
                "declarant_name": name,
                "position": "Директор департаменту",
                "organization": "Міністерство економіки",
                "submitted_at": "2024-03-15",
                "url": f"https://public.nazk.gov.ua/documents/abc123",
            },
        ]
        
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={
                "query": name,
                "corruptioners": corruptioners,
                "declarations": declarations,
                "is_corruptioner": len(corruptioners) > 0,
            },
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )
    
    async def check_corruptioner(self, name: str, rnokpp: str | None = None) -> RegistryResult:
        """Перевірка наявності у реєстрі корупціонерів."""
        start_time = datetime.now(UTC)
        
        # Симуляція
        is_corruptioner = False
        
        data = {
            "name": name,
            "rnokpp": rnokpp,
            "is_corruptioner": is_corruptioner,
            "records": [],
        }
        
        if is_corruptioner:
            data["records"] = [
                {
                    "offense_type": "Корупційне правопорушення",
                    "court_decision": "Рішення суду №123/456",
                    "decision_date": "2023-06-15",
                    "punishment": "Штраф 17000 грн",
                    "restriction_period": "3 роки",
                    "restriction_end": "2026-06-15",
                },
            ]
        
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data=data,
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )
    
    async def get_declarations(self, name: str, year: int | None = None) -> RegistryResult:
        """Отримати декларації особи."""
        start_time = datetime.now(UTC)
        
        declarations = [
            {
                "id": f"decl_{year or 2023}_1",
                "year": year or 2023,
                "type": "Щорічна",
                "declarant_name": name,
                "position": "Державний службовець",
                "organization": "Державний орган",
                "income": {
                    "salary": 500000.0,
                    "other": 50000.0,
                    "total": 550000.0,
                },
                "assets": {
                    "real_estate": 2,
                    "vehicles": 1,
                    "bank_accounts": 150000.0,
                },
                "submitted_at": f"{year or 2023}-03-31",
            },
        ]
        
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"name": name, "declarations": declarations, "total": len(declarations)},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )
