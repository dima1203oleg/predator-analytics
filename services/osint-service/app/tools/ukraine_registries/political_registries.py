"""Політичні реєстри — партії, люстрація.

Держатель: Міністерство юстиції України
Формат: XML, відкриті дані
"""
import logging
from datetime import datetime, UTC

from .base import BaseRegistryClient, RegistryResult, RegistryStatus

logger = logging.getLogger(__name__)


class PoliticalPartiesClient(BaseRegistryClient):
    """Реєстр політичних партій."""
    
    name = "political_parties"
    description = "Реєстр політичних партій України"
    holder = "Міністерство юстиції України"
    data_format = "XML"
    status = RegistryStatus.ACTIVE
    update_frequency = "weekly"
    
    async def search_by_edrpou(self, edrpou: str) -> RegistryResult:
        """Пошук партії за ЄДРПОУ."""
        start_time = datetime.now(UTC)
        edrpou = self.normalize_edrpou(edrpou)
        
        data = {
            "edrpou": edrpou,
            "is_political_party": False,
            "party_info": None,
        }
        
        # Симуляція — партії мають специфічні ЄДРПОУ
        if edrpou.startswith("2"):
            data["is_political_party"] = True
            data["party_info"] = {
                "name": f"Політична партія «Партія {edrpou}»",
                "short_name": f"ПП {edrpou}",
                "registration_date": "2014-05-20",
                "registration_number": f"ПП-{edrpou[:4]}",
                "status": "active",
                "leader": "Іванов Іван Іванович",
                "address": "м. Київ, вул. Банкова, 1",
                "members_count": 15000,
                "regional_organizations": 25,
            }
        
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data=data,
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )
    
    async def search_by_name(self, name: str) -> RegistryResult:
        """Пошук партій за назвою."""
        start_time = datetime.now(UTC)
        
        results = [
            {
                "edrpou": "21234567",
                "name": f"Політична партія «{name}»",
                "status": "active",
                "registration_date": "2014-05-20",
            },
        ]
        
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"query": name, "results": results, "total": len(results)},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )


class LustrationRegistryClient(BaseRegistryClient):
    """Реєстр осіб, щодо яких застосовано люстрацію."""
    
    name = "lustration_registry"
    description = "Єдиний державний реєстр осіб, щодо яких застосовано положення Закону України «Про очищення влади»"
    holder = "Міністерство юстиції України"
    data_format = "XML"
    status = RegistryStatus.ACTIVE
    update_frequency = "weekly"
    
    async def search_by_edrpou(self, edrpou: str) -> RegistryResult:
        """Пошук за ЄДРПОУ (для керівників компаній)."""
        start_time = datetime.now(UTC)
        
        data = {
            "edrpou": edrpou,
            "lustrated_persons": [],
            "has_lustrated": False,
        }
        
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data=data,
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )
    
    async def search_by_name(self, name: str) -> RegistryResult:
        """Пошук люстрованих осіб за ПІБ."""
        start_time = datetime.now(UTC)
        
        # Симуляція — зазвичай порожній результат
        results = []
        
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={
                "query": name,
                "results": results,
                "total": len(results),
                "is_lustrated": len(results) > 0,
            },
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )
    
    async def check_person(self, name: str, rnokpp: str | None = None) -> RegistryResult:
        """Перевірка особи на люстрацію."""
        start_time = datetime.now(UTC)
        
        data = {
            "name": name,
            "rnokpp": rnokpp,
            "is_lustrated": False,
            "lustration_info": None,
        }
        
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data=data,
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )
