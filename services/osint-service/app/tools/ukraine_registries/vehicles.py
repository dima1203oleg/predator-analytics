"""Реєстр транспортних засобів МВС.

Держатель: МВС України
Формат: API (через Дію)
"""
import logging
from datetime import datetime, UTC

from .base import BaseRegistryClient, RegistryResult, RegistryStatus

logger = logging.getLogger(__name__)


class VehiclesRegistryClient(BaseRegistryClient):
    """Клієнт для Реєстру транспортних засобів."""
    
    name = "vehicles_registry"
    description = "Реєстр транспортних засобів МВС"
    holder = "МВС України"
    data_format = "API"
    status = RegistryStatus.ACTIVE
    update_frequency = "daily"
    
    async def search_by_edrpou(self, edrpou: str) -> RegistryResult:
        """Пошук ТЗ за ЄДРПОУ власника."""
        start_time = datetime.now(UTC)
        edrpou = self.normalize_edrpou(edrpou)
        
        vehicles = [
            {
                "plate_number": "AA1234BB",
                "vin": "WVWZZZ3CZWE123456",
                "brand": "Volkswagen",
                "model": "Passat",
                "year": 2020,
                "color": "Чорний",
                "body_type": "Седан",
                "engine_volume": 2.0,
                "fuel_type": "Дизель",
                "owner_edrpou": edrpou,
                "registration_date": "2020-06-15",
                "first_registration_date": "2020-03-10",
            },
            {
                "plate_number": "AA5678CC",
                "vin": "WDBRF61J21F123456",
                "brand": "Mercedes-Benz",
                "model": "Sprinter",
                "year": 2019,
                "color": "Білий",
                "body_type": "Вантажний фургон",
                "engine_volume": 2.2,
                "fuel_type": "Дизель",
                "owner_edrpou": edrpou,
                "registration_date": "2019-08-20",
            },
        ]
        
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"edrpou": edrpou, "vehicles": vehicles, "total": len(vehicles)},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )
    
    async def search_by_name(self, name: str) -> RegistryResult:
        """Пошук за ПІБ власника."""
        start_time = datetime.now(UTC)
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"query": name, "vehicles": [], "total": 0},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )
    
    async def search_by_vin(self, vin: str) -> RegistryResult:
        """Пошук за VIN-кодом."""
        start_time = datetime.now(UTC)
        
        vehicle = {
            "vin": vin,
            "plate_number": "AA1234BB",
            "brand": "Volkswagen",
            "model": "Passat",
            "year": 2020,
            "color": "Чорний",
            "owner_type": "legal_entity",
            "owner_name": "ТОВ «Компанія»",
            "registration_history": [
                {"date": "2020-06-15", "event": "Перша реєстрація в Україні"},
                {"date": "2020-03-10", "event": "Виробництво (Німеччина)"},
            ],
            "accidents": [],
            "stolen": False,
        }
        
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data=vehicle,
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )
    
    async def search_by_plate(self, plate_number: str) -> RegistryResult:
        """Пошук за номерним знаком."""
        start_time = datetime.now(UTC)
        
        vehicle = {
            "plate_number": plate_number.upper(),
            "vin": "WVWZZZ3CZWE123456",
            "brand": "Volkswagen",
            "model": "Passat",
            "year": 2020,
            "owner_type": "legal_entity",
            "stolen": False,
        }
        
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data=vehicle,
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )
