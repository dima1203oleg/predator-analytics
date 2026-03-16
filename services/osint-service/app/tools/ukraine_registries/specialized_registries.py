"""Спеціалізовані реєстри — ліки, харчі, довкілля.

Держатель: МОЗ, Держпродспоживслужба, Міндовкілля
Формат: XML, відкриті дані
"""
import logging
from datetime import UTC, datetime

from .base import BaseRegistryClient, RegistryResult, RegistryStatus

logger = logging.getLogger(__name__)


class DrugPricesRegistryClient(BaseRegistryClient):
    """Реєстр оптово-відпускних цін на ліки."""

    name = "drug_prices"
    description = "Реєстр оптово-відпускних цін на лікарські засоби"
    holder = "Міністерство охорони здоров'я України"
    data_format = "XML"
    status = RegistryStatus.ACTIVE
    update_frequency = "weekly"

    async def search_by_edrpou(self, edrpou: str) -> RegistryResult:
        """Пошук виробників/дистриб'юторів ліків."""
        start_time = datetime.now(UTC)
        edrpou = self.normalize_edrpou(edrpou)

        data = {
            "edrpou": edrpou,
            "is_pharma_company": True,
            "company_info": {
                "name": f"ТОВ «Фарма {edrpou}»",
                "type": "Дистриб'ютор",
                "license_number": f"ФАР-{edrpou[:6]}",
            },
            "registered_drugs": [
                {
                    "name": "Парацетамол 500мг",
                    "registration_number": "UA/1234/01/01",
                    "wholesale_price": 25.50,
                    "currency": "UAH",
                    "registration_date": "2020-01-15",
                },
            ],
            "total_drugs": 150,
        }

        return RegistryResult(
            registry_name=self.name,
            success=True,
            data=data,
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )

    async def search_by_name(self, name: str) -> RegistryResult:
        """Пошук за назвою препарату."""
        start_time = datetime.now(UTC)

        drugs = [
            {
                "name": name,
                "manufacturer": "ПАТ «Фармак»",
                "registration_number": "UA/1234/01/01",
                "wholesale_price": 25.50,
                "retail_price_max": 35.00,
            },
        ]

        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"query": name, "drugs": drugs, "total": len(drugs)},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )


class FoodOperatorsRegistryClient(BaseRegistryClient):
    """Реєстр потужностей операторів ринку харчових продуктів."""

    name = "food_operators"
    description = "Реєстр потужностей операторів ринку харчових продуктів"
    holder = "Держпродспоживслужба"
    data_format = "XML"
    status = RegistryStatus.ACTIVE
    update_frequency = "weekly"

    async def search_by_edrpou(self, edrpou: str) -> RegistryResult:
        """Пошук операторів харчового ринку."""
        start_time = datetime.now(UTC)
        edrpou = self.normalize_edrpou(edrpou)

        data = {
            "edrpou": edrpou,
            "is_food_operator": True,
            "operator_info": {
                "name": f"ТОВ «Харчовик {edrpou}»",
                "type": "Виробництво харчових продуктів",
                "registration_number": f"ХАР-{edrpou[:6]}",
                "registration_date": "2019-06-15",
            },
            "facilities": [
                {
                    "type": "Виробничий цех",
                    "address": "м. Київ, вул. Промислова, 10",
                    "capacity": "1000 тонн/рік",
                    "products": ["Молочні продукти", "Сири"],
                    "haccp_certified": True,
                },
            ],
            "export_approved": True,
            "export_countries": ["ЄС", "Молдова", "Грузія"],
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
            data={"query": name, "operators": [], "total": 0},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )


class StorageFacilitiesRegistryClient(BaseRegistryClient):
    """Реєстр місць зберігання підакцизних товарів."""

    name = "storage_facilities"
    description = "Реєстр місць зберігання підакцизних товарів"
    holder = "ДПС України"
    data_format = "XML"
    status = RegistryStatus.ACTIVE
    update_frequency = "weekly"

    async def search_by_edrpou(self, edrpou: str) -> RegistryResult:
        """Пошук місць зберігання за ЄДРПОУ."""
        start_time = datetime.now(UTC)
        edrpou = self.normalize_edrpou(edrpou)

        facilities = [
            {
                "registration_number": f"МЗ-{edrpou[:6]}-001",
                "type": "Склад пального",
                "address": "Київська обл., Бориспільський р-н",
                "capacity_liters": 500000,
                "products": ["Бензин А-95", "Дизельне пальне"],
                "status": "active",
            },
        ]

        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"edrpou": edrpou, "facilities": facilities, "total": len(facilities)},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )

    async def search_by_name(self, name: str) -> RegistryResult:
        """Пошук за назвою."""
        start_time = datetime.now(UTC)
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"query": name, "facilities": [], "total": 0},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )


class EnvironmentalImpactRegistryClient(BaseRegistryClient):
    """Єдиний реєстр оцінки впливу на довкілля."""

    name = "environmental_impact"
    description = "Єдиний реєстр оцінки впливу на довкілля (ОВД)"
    holder = "Міністерство захисту довкілля та природних ресурсів"
    data_format = "XML"
    status = RegistryStatus.ACTIVE
    update_frequency = "daily"

    async def search_by_edrpou(self, edrpou: str) -> RegistryResult:
        """Пошук ОВД за ЄДРПОУ замовника."""
        start_time = datetime.now(UTC)
        edrpou = self.normalize_edrpou(edrpou)

        assessments = [
            {
                "registration_number": f"ОВД-{edrpou[:6]}-2024-001",
                "project_name": "Будівництво виробничого комплексу",
                "customer": f"ТОВ «Компанія {edrpou}»",
                "location": "Київська обл., Бориспільський р-н",
                "status": "completed",
                "decision": "Позитивний висновок",
                "decision_date": "2024-03-15",
                "valid_until": "2029-03-15",
            },
        ]

        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"edrpou": edrpou, "assessments": assessments, "total": len(assessments)},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )

    async def search_by_name(self, name: str) -> RegistryResult:
        """Пошук за назвою проєкту."""
        start_time = datetime.now(UTC)
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"query": name, "assessments": [], "total": 0},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )


class VeterinaryRegistryClient(BaseRegistryClient):
    """Реєстри ветеринарних та кормових препаратів."""

    name = "veterinary_registry"
    description = "Реєстри ветеринарних препаратів та кормових добавок"
    holder = "Держпродспоживслужба"
    data_format = "XML"
    status = RegistryStatus.ACTIVE
    update_frequency = "weekly"

    async def search_by_edrpou(self, edrpou: str) -> RegistryResult:
        """Пошук виробників ветпрепаратів."""
        start_time = datetime.now(UTC)
        edrpou = self.normalize_edrpou(edrpou)

        data = {
            "edrpou": edrpou,
            "is_vet_producer": True,
            "company_info": {
                "name": f"ТОВ «Ветфарм {edrpou}»",
                "type": "Виробник ветеринарних препаратів",
                "license_number": f"ВЕТ-{edrpou[:6]}",
            },
            "registered_products": [
                {
                    "name": "Вакцина проти сказу",
                    "registration_number": "ВП-1234",
                    "type": "Вакцина",
                    "registration_date": "2020-01-15",
                    "valid_until": "2025-01-15",
                },
            ],
            "total_products": 25,
        }

        return RegistryResult(
            registry_name=self.name,
            success=True,
            data=data,
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )

    async def search_by_name(self, name: str) -> RegistryResult:
        """Пошук за назвою препарату."""
        start_time = datetime.now(UTC)
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"query": name, "products": [], "total": 0},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )


class PharmLicensesClient(BaseRegistryClient):
    """Реєстр ліцензій МОЗ (фармліцензії)."""

    name = "pharm_licenses"
    description = "Реєстр ліцензій на провадження господарської діяльності з виробництва лікарських засобів"
    holder = "Міністерство охорони здоров'я України"
    data_format = "XML"
    status = RegistryStatus.ACTIVE
    update_frequency = "weekly"

    async def search_by_edrpou(self, edrpou: str) -> RegistryResult:
        """Пошук фармліцензій за ЄДРПОУ."""
        start_time = datetime.now(UTC)
        edrpou = self.normalize_edrpou(edrpou)

        licenses = [
            {
                "number": f"ФЛ-{edrpou[:6]}-001",
                "type": "Виробництво лікарських засобів",
                "holder": f"ПАТ «Фармак {edrpou}»",
                "issue_date": "2018-06-15",
                "valid_until": "Безстроково",
                "status": "active",
                "gmp_certificate": True,
                "gmp_valid_until": "2026-06-15",
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


class DataGovUAClient(BaseRegistryClient):
    """Портал відкритих даних data.gov.ua."""

    name = "data_gov_ua"
    description = "Єдиний державний веб-портал відкритих даних"
    holder = "Міністерство цифрової трансформації"
    data_format = "API/CKAN"
    status = RegistryStatus.ACTIVE
    update_frequency = "realtime"

    API_URL = "https://data.gov.ua/api/3"

    async def search_by_edrpou(self, edrpou: str) -> RegistryResult:
        """Пошук наборів даних за ЄДРПОУ."""
        start_time = datetime.now(UTC)
        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"edrpou": edrpou, "datasets": [], "total": 0},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )

    async def search_by_name(self, name: str) -> RegistryResult:
        """Пошук наборів даних за ключовим словом."""
        start_time = datetime.now(UTC)

        datasets = [
            {
                "id": "dataset-001",
                "title": f"Набір даних: {name}",
                "organization": "Міністерство юстиції",
                "format": "XML",
                "last_modified": "2024-06-15",
                "url": f"{self.API_URL}/package_show?id=dataset-001",
            },
        ]

        return RegistryResult(
            registry_name=self.name,
            success=True,
            data={"query": name, "datasets": datasets, "total": len(datasets)},
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )

    async def get_dataset(self, dataset_id: str) -> RegistryResult:
        """Отримати метадані набору даних."""
        start_time = datetime.now(UTC)

        dataset = {
            "id": dataset_id,
            "title": "Єдиний державний реєстр юридичних осіб",
            "organization": "Міністерство юстиції України",
            "description": "Відкриті дані ЄДР",
            "format": "XML",
            "resources": [
                {"name": "edr_full.xml", "size_mb": 2500, "last_modified": "2024-06-15"},
            ],
            "tags": ["ЄДР", "юридичні особи", "ФОП"],
        }

        return RegistryResult(
            registry_name=self.name,
            success=True,
            data=dataset,
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )
