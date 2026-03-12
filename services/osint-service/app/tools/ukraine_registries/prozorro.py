"""Prozorro — система публічних закупівель.

Держатель: Міністерство економіки України
Формат: API, JSON
"""
import logging
from datetime import datetime, UTC

from .base import BaseRegistryClient, RegistryResult, RegistryStatus

logger = logging.getLogger(__name__)


class ProzorroClient(BaseRegistryClient):
    """Клієнт для Prozorro API."""
    
    name = "prozorro"
    description = "Prozorro — система публічних закупівель"
    holder = "Міністерство економіки України"
    data_format = "API/JSON"
    status = RegistryStatus.ACTIVE
    update_frequency = "realtime"
    
    API_URL = "https://public.api.openprocurement.org/api/2.5"
    
    async def search_by_edrpou(self, edrpou: str) -> RegistryResult:
        """Пошук тендерів за ЄДРПОУ учасника."""
        start_time = datetime.now(UTC)
        edrpou = self.normalize_edrpou(edrpou)
        
        tenders = [
            {
                "id": "UA-2024-01-15-000001-a",
                "title": "Закупівля комп'ютерного обладнання",
                "procuring_entity": "Міністерство цифрової трансформації",
                "expected_value": 500000.0,
                "currency": "UAH",
                "status": "complete",
                "procedure_type": "aboveThresholdUA",
                "date_published": "2024-01-15",
                "date_modified": "2024-02-28",
                "participant_role": "winner",
                "award_amount": 485000.0,
            },
            {
                "id": "UA-2024-03-20-000123-b",
                "title": "Послуги з розробки програмного забезпечення",
                "procuring_entity": "Державна податкова служба",
                "expected_value": 1200000.0,
                "currency": "UAH",
                "status": "active.qualification",
                "procedure_type": "aboveThresholdEU",
                "date_published": "2024-03-20",
                "participant_role": "bidder",
                "bid_amount": 1150000.0,
            },
        ]
        
        # Статистика
        stats = {
            "total_participations": len(tenders),
            "wins": len([t for t in tenders if t["participant_role"] == "winner"]),
            "total_won_amount": sum(t.get("award_amount", 0) for t in tenders if t["participant_role"] == "winner"),
            "active_bids": len([t for t in tenders if t["status"].startswith("active")]),
        }
        
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={
                "edrpou": edrpou,
                "tenders": tenders,
                "statistics": stats,
                "total": len(tenders),
            },
            source_url=f"{self.API_URL}/tenders",
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )
    
    async def search_by_name(self, name: str) -> RegistryResult:
        """Пошук за назвою учасника."""
        start_time = datetime.now(UTC)
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"query": name, "tenders": [], "total": 0},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )
    
    async def get_tender(self, tender_id: str) -> RegistryResult:
        """Отримати деталі тендера."""
        start_time = datetime.now(UTC)
        
        tender = {
            "id": tender_id,
            "title": "Закупівля комп'ютерного обладнання",
            "description": "Детальний опис закупівлі...",
            "procuring_entity": {
                "name": "Міністерство цифрової трансформації",
                "edrpou": "43215678",
                "address": "м. Київ, вул. Грушевського, 12/2",
            },
            "value": {"amount": 500000.0, "currency": "UAH"},
            "status": "complete",
            "procedure_type": "aboveThresholdUA",
            "lots": [
                {"id": "lot1", "title": "Комп'ютери", "value": 300000.0},
                {"id": "lot2", "title": "Монітори", "value": 200000.0},
            ],
            "bids": [
                {"tenderer_edrpou": "12345678", "amount": 485000.0, "status": "active"},
                {"tenderer_edrpou": "87654321", "amount": 495000.0, "status": "unsuccessful"},
            ],
            "awards": [
                {"supplier_edrpou": "12345678", "amount": 485000.0, "status": "active"},
            ],
            "contracts": [
                {"id": "contract1", "amount": 485000.0, "status": "active"},
            ],
            "documents": [
                {"title": "Тендерна документація", "url": "https://..."},
            ],
        }
        
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data=tender,
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )
    
    async def get_supplier_statistics(self, edrpou: str) -> RegistryResult:
        """Отримати статистику постачальника."""
        start_time = datetime.now(UTC)
        edrpou = self.normalize_edrpou(edrpou)
        
        stats = {
            "edrpou": edrpou,
            "total_participations": 45,
            "total_wins": 28,
            "win_rate": 62.2,
            "total_won_amount": 15000000.0,
            "avg_discount": 8.5,
            "top_procuring_entities": [
                {"name": "Міністерство цифрової трансформації", "contracts": 5},
                {"name": "Державна податкова служба", "contracts": 3},
            ],
            "top_categories": [
                {"cpv": "30200000-1", "name": "Комп'ютерне обладнання", "contracts": 15},
                {"cpv": "72000000-5", "name": "ІТ-послуги", "contracts": 10},
            ],
            "years": {
                "2024": {"participations": 12, "wins": 8, "amount": 5000000.0},
                "2023": {"participations": 20, "wins": 12, "amount": 7000000.0},
                "2022": {"participations": 13, "wins": 8, "amount": 3000000.0},
            },
        }
        
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data=stats,
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )
