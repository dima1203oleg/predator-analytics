from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, date, datetime
from enum import StrEnum
import logging
import os
from typing import Any

import httpx

logger = logging.getLogger(__name__)


class CompanyStatus(StrEnum):
    """Статуси компаній."""

    ACTIVE = "active"
    LIQUIDATED = "liquidated"
    BANKRUPT = "bankrupt"
    SUSPENDED = "suspended"
    IN_LIQUIDATION = "in_liquidation"
    UNKNOWN = "unknown"


class CaseType(StrEnum):
    """Типи судових справ."""

    CIVIL = "civil"
    CRIMINAL = "criminal"
    ADMINISTRATIVE = "administrative"
    COMMERCIAL = "commercial"
    CONSTITUTIONAL = "constitutional"


class PartyRole(StrEnum):
    """Ролі сторін у справі."""

    PLAINTIFF = "plaintiff"
    DEFENDANT = "defendant"
    THIRD_PARTY = "third_party"
    WITNESS = "witness"


@dataclass
class Address:
    """Адреса."""

    full: str
    region: str | None = None
    city: str | None = None
    street: str | None = None
    building: str | None = None
    postal_code: str | None = None


@dataclass
class Person:
    """Фізична особа."""

    name: str
    rnokpp: str | None = None
    birth_date: date | None = None
    citizenship: str | None = None


@dataclass
class Founder:
    """Засновник компанії."""

    name: str
    type: str  # person, organization
    share: float | None = None
    rnokpp: str | None = None
    edrpou: str | None = None
    country: str | None = None


@dataclass
class Manager:
    """Керівник компанії."""

    name: str
    position: str
    appointment_date: date | None = None
    rnokpp: str | None = None


@dataclass
class Beneficiary:
    """Кінцевий бенефіціарний власник."""

    name: str
    ownership_percentage: float | None = None
    country: str | None = None
    rnokpp: str | None = None


@dataclass
class Company:
    """Компанія з ЄДР."""

    edrpou: str
    name: str
    short_name: str | None = None
    status: CompanyStatus = CompanyStatus.UNKNOWN
    registration_date: date | None = None
    address: Address | None = None
    kved_primary: str | None = None
    kved_primary_name: str | None = None
    kved_secondary: list[str] = field(default_factory=list)
    authorized_capital: float | None = None
    founders: list[Founder] = field(default_factory=list)
    managers: list[Manager] = field(default_factory=list)
    beneficiaries: list[Beneficiary] = field(default_factory=list)
    phone: str | None = None
    email: str | None = None
    website: str | None = None


@dataclass
class VATStatus:
    """Статус платника ПДВ."""

    edrpou: str
    name: str
    ipn: str | None = None
    is_vat_payer: bool = False
    registration_date: date | None = None
    status: str | None = None
    tax_office: str | None = None


@dataclass
class TaxDebt:
    """Податковий борг."""

    type: str
    amount: float
    date: date | None = None
    description: str | None = None


@dataclass
class DebtorInfo:
    """Інформація про боржника."""

    edrpou: str
    name: str
    has_debt: bool = False
    total_debt: float = 0.0
    debts: list[TaxDebt] = field(default_factory=list)
    is_restructured: bool = False


@dataclass
class CourtParty:
    """Сторона судової справи."""

    name: str
    role: PartyRole
    edrpou: str | None = None
    rnokpp: str | None = None


@dataclass
class CourtDecision:
    """Судове рішення."""

    date: date
    type: str
    summary: str | None = None
    full_text: str | None = None


@dataclass
class CourtCase:
    """Судова справа."""

    case_number: str
    court: str
    date: date
    type: CaseType
    status: str
    parties: list[CourtParty] = field(default_factory=list)
    subject: str | None = None
    amount: float | None = None
    decisions: list[CourtDecision] = field(default_factory=list)


@dataclass
class TenderParticipant:
    """Учасник тендера."""

    name: str
    edrpou: str
    bid_amount: float | None = None
    is_winner: bool = False


@dataclass
class Tender:
    """Тендер Prozorro."""

    tender_id: str
    title: str
    status: str
    procuring_entity_name: str
    procuring_entity_edrpou: str
    expected_value: float | None = None
    currency: str = "UAH"
    participants: list[TenderParticipant] = field(default_factory=list)
    award_date: date | None = None
    contract_amount: float | None = None


@dataclass
class SanctionEntry:
    """Запис у санкційному списку."""

    name: str
    list_name: str
    date_added: date | None = None
    reason: str | None = None
    document: str | None = None


@dataclass
class SanctionCheck:
    """Результат перевірки санкцій."""

    query: str
    is_sanctioned: bool = False
    matches: list[SanctionEntry] = field(default_factory=list)
    checked_lists: list[str] = field(default_factory=list)
    checked_at: datetime = field(default_factory=lambda: datetime.now(UTC))


@dataclass
class RealEstate:
    """Об'єкт нерухомості."""

    address: str
    type: str  # apartment, house, land, commercial
    cadastral_number: str | None = None
    area_sqm: float | None = None
    owner_name: str | None = None
    owner_edrpou: str | None = None
    owner_rnokpp: str | None = None
    registration_date: date | None = None


@dataclass
class Vehicle:
    """Транспортний засіб."""

    brand: str
    model: str
    vin: str | None = None
    plate_number: str | None = None
    year: int | None = None
    color: str | None = None
    owner_name: str | None = None
    owner_edrpou: str | None = None
    owner_rnokpp: str | None = None
    registration_date: date | None = None


class UkraineRegistriesService:
    """Сервіс для роботи з державними реєстрами України."""

    def __init__(self) -> None:
        self.client = httpx.AsyncClient(timeout=30.0)
        from app.config import get_settings
        settings = get_settings()
        self.edr_api_key = settings.EDR_API_KEY
        self.court_api_key = settings.COURT_API_KEY
        self.dps_api_key = settings.DPS_API_KEY
        
        self.edr_api_url = "https://nais.gov.ua/api/edr" # Example Prod URL
        self.court_api_url = "https://court.gov.ua/api/v1"
        self.prozorro_api_url = settings.PROZORRO_API_URL
        self.dps_api_url = "https://cabinet.tax.gov.ua/api"

    async def get_registries_status(self) -> dict[str, Any]:
        """Отримати статус підключення до всіх реєстрів у форматі для UI."""
        edr_status = "online" if self.edr_api_key and "mock" not in self.edr_api_key.lower() else "mock"
        court_status = "online" if self.court_api_key and "mock" not in self.court_api_key.lower() else "mock"
        
        categories = [
            {
                "id": "EDR", 
                "name": "Реєстрація юросіб", 
                "icon": "Building2", 
                "color": "#3b82f6", 
                "count": 4,
                "registries": [
                    { "id": "edr", "name": "ЄДР — Юридичні особи", "status": edr_status, "records": "1.4M", "lastSync": "2хв тому", "api": "REST", "latency": 45 },
                    { "id": "fop", "name": "Реєстр ФОП", "status": "online", "records": "1.9M", "lastSync": "5хв тому", "api": "REST", "latency": 50 },
                    { "id": "bo", "name": "Реєстр бенефіціарів", "status": "online", "records": "890K", "lastSync": "10хв тому", "api": "REST", "latency": 65 },
                    { "id": "uo", "name": "Громадські об'єднання", "status": "online", "records": "125K", "lastSync": "15хв тому", "api": "CSV", "latency": 30 },
                ]
            },
            {
                "id": "TAX", 
                "name": "Податкова система", 
                "icon": "Receipt", 
                "color": "#ef4444", 
                "count": 4,
                "registries": [
                    { "id": "erpn", "name": "ЄРПН (ПДВ)", "status": "online", "records": "520K", "lastSync": "3хв тому", "api": "REST", "latency": 70 },
                    { "id": "tax-debt", "name": "Податковий борг", "status": "online", "records": "412K", "lastSync": "8хв тому", "api": "REST", "latency": 85 },
                    { "id": "single-tax", "name": "Єдиний податок", "status": "online", "records": "1.7M", "lastSync": "12хв тому", "api": "CSV", "latency": 40 },
                    { "id": "tax-invoices", "name": "Реєстр накладних", "status": "online", "records": "48M", "lastSync": "1хв тому", "api": "REST", "latency": 110 },
                ]
            },
            {
                "id": "COURT", 
                "name": "Судова система", 
                "icon": "Scale", 
                "color": "#8b5cf6", 
                "count": 3,
                "registries": [
                    { "id": "court-decisions", "name": "Судові рішення", "status": court_status, "records": "110M", "lastSync": "4хв тому", "api": "REST", "latency": 150 },
                    { "id": "court-cases", "name": "Судові справи", "status": court_status, "records": "15M", "lastSync": "6хв тому", "api": "REST", "latency": 165 },
                    { "id": "debtors", "name": "Виконавчі провадження", "status": "online", "records": "4.2M", "lastSync": "12хв тому", "api": "REST", "latency": 220 },
                ]
            },
            {
                "id": "MVS", 
                "name": "МВС та Транспорт", 
                "icon": "Car", 
                "color": "#10b981", 
                "count": 2,
                "registries": [
                    { "id": "vehicles", "name": "Транспортні засоби", "status": "online", "records": "9.5M", "lastSync": "20хв тому", "api": "REST", "latency": 130 },
                    { "id": "wanted", "name": "Особи у розшуку", "status": "online", "records": "52K", "lastSync": "1год тому", "api": "REST", "latency": 95 },
                ]
            }
        ]

        all_registries: list[dict[str, Any]] = []
        for cat in categories:
            reg_list = cat.get("registries", [])
            if isinstance(reg_list, list):
                all_registries.extend(reg_list)

        connected_count = sum(1 for reg in all_registries if reg.get("status") == "online")
        total_count = len(all_registries)

        return {
            "totalRegistries": total_count,
            "connected": connected_count,
            "categories": categories
        }

    # ======================== ЄДР ========================

    async def get_company(self, edrpou: str) -> Company | None:
        """Отримати дані компанії з ЄДР."""
        # В реальності тут буде запит до API ЄДР
        # Поки що повертаємо mock дані
        return self._mock_company(edrpou)

    async def search_companies(
        self,
        name: str | None = None,
        region: str | None = None,
        kved: str | None = None,
        status: CompanyStatus | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[Company], int]:
        """Пошук компаній за критеріями."""
        # Mock реалізація
        companies = [self._mock_company("12345678")]
        return companies, len(companies)

    async def get_company_history(self, edrpou: str) -> list[dict]:
        """Отримати історію змін компанії."""
        return [
            {
                "date": "2025-01-15",
                "type": "director_change",
                "old_value": "Іванов І.І.",
                "new_value": "Петров П.П.",
            },
            {
                "date": "2024-06-01",
                "type": "address_change",
                "old_value": "м. Київ, вул. Хрещатик, 1",
                "new_value": "м. Київ, вул. Хрещатик, 10",
            },
        ]

    def _mock_company(self, edrpou: str) -> Company:
        """Mock дані компанії."""
        return Company(
            edrpou=edrpou,
            name=f"ТОВ \"КОМПАНІЯ {edrpou}\"",
            short_name=f"КОМПАНІЯ {edrpou}",
            status=CompanyStatus.ACTIVE,
            registration_date=date(2015, 3, 20),
            address=Address(
                full="01001, м. Київ, вул. Хрещатик, 1",
                region="Київська",
                city="Київ",
                street="Хрещатик",
                building="1",
            ),
            kved_primary="62.01",
            kved_primary_name="Комп'ютерне програмування",
            kved_secondary=["62.02", "63.11"],
            authorized_capital=100000.0,
            founders=[
                Founder(
                    name="Іванов Іван Іванович",
                    type="person",
                    share=50.0,
                    rnokpp="1234567890",
                ),
                Founder(
                    name="ТОВ \"ХОЛДИНГ\"",
                    type="organization",
                    share=50.0,
                    edrpou="87654321",
                ),
            ],
            managers=[
                Manager(
                    name="Петров Петро Петрович",
                    position="Директор",
                    appointment_date=date(2020, 1, 15),
                ),
            ],
            beneficiaries=[
                Beneficiary(
                    name="Іванов Іван Іванович",
                    ownership_percentage=75.0,
                    country="UA",
                ),
            ],
            phone="+380441234567",
            email="info@company.ua",
            website="https://company.ua",
        )

    # ======================== ПДВ ========================

    async def check_vat_status(self, edrpou: str) -> VATStatus:
        """Перевірка статусу платника ПДВ."""
        return VATStatus(
            edrpou=edrpou,
            name=f"ТОВ \"КОМПАНІЯ {edrpou}\"",
            ipn="123456789012",
            is_vat_payer=True,
            registration_date=date(2015, 4, 1),
            status="active",
            tax_office="ДПІ у Шевченківському районі м. Києва",
        )

    # ======================== БОРЖНИКИ ========================

    async def check_debtor(self, edrpou: str) -> DebtorInfo:
        """Перевірка податкових боргів."""
        return DebtorInfo(
            edrpou=edrpou,
            name=f"ТОВ \"КОМПАНІЯ {edrpou}\"",
            has_debt=True,
            total_debt=1500000.0,
            debts=[
                TaxDebt(
                    type="tax",
                    amount=1000000.0,
                    date=date(2025, 6, 15),
                    description="Податок на прибуток",
                ),
                TaxDebt(
                    type="penalty",
                    amount=500000.0,
                    date=date(2025, 9, 1),
                    description="Штрафні санкції",
                ),
            ],
            is_restructured=False,
        )

    # ======================== СУДОВИЙ РЕЄСТР ========================

    async def search_court_cases(
        self,
        party_name: str | None = None,
        party_edrpou: str | None = None,
        case_number: str | None = None,
        court: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        limit: int = 50,
    ) -> tuple[list[CourtCase], int]:
        """Пошук судових справ."""
        cases = [
            CourtCase(
                case_number="910/1234/26",
                court="Господарський суд міста Києва",
                date=date(2026, 1, 15),
                type=CaseType.COMMERCIAL,
                status="розглядається",
                parties=[
                    CourtParty(
                        name="ТОВ \"КОМПАНІЯ\"",
                        role=PartyRole.PLAINTIFF,
                        edrpou="12345678",
                    ),
                    CourtParty(
                        name="ТОВ \"КОНТРАГЕНТ\"",
                        role=PartyRole.DEFENDANT,
                        edrpou="87654321",
                    ),
                ],
                subject="Стягнення заборгованості",
                amount=500000.0,
                decisions=[
                    CourtDecision(
                        date=date(2026, 2, 20),
                        type="ухвала",
                        summary="Відкрито провадження у справі",
                    ),
                ],
            ),
        ]
        return cases, len(cases)

    async def get_court_case(self, case_number: str) -> CourtCase | None:
        """Отримати судову справу за номером."""
        cases, _ = await self.search_court_cases(case_number=case_number)
        return cases[0] if cases else None

    # ======================== PROZORRO ========================

    async def search_tenders(
        self,
        participant_edrpou: str | None = None,
        procuring_entity_edrpou: str | None = None,
        status: str | None = None,
        amount_from: float | None = None,
        amount_to: float | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        limit: int = 50,
    ) -> tuple[list[Tender], int]:
        """Пошук тендерів у Prozorro."""
        tenders = [
            Tender(
                tender_id="UA-2026-03-01-000001-a",
                title="Закупівля комп'ютерного обладнання",
                status="complete",
                procuring_entity_name="Міністерство цифрової трансформації",
                procuring_entity_edrpou="00000001",
                expected_value=1000000.0,
                currency="UAH",
                participants=[
                    TenderParticipant(
                        name="ТОВ \"КОМПАНІЯ\"",
                        edrpou="12345678",
                        bid_amount=950000.0,
                        is_winner=True,
                    ),
                    TenderParticipant(
                        name="ТОВ \"КОНКУРЕНТ\"",
                        edrpou="11111111",
                        bid_amount=980000.0,
                        is_winner=False,
                    ),
                ],
                award_date=date(2026, 3, 15),
                contract_amount=950000.0,
            ),
        ]
        return tenders, len(tenders)

    async def get_tender(self, tender_id: str) -> Tender | None:
        """Отримати тендер за ID."""
        tenders, _ = await self.search_tenders()
        return tenders[0] if tenders else None

    # ======================== САНКЦІЇ ========================

    async def check_sanctions(
        self,
        name: str,
        edrpou: str | None = None,
        rnokpp: str | None = None,
    ) -> SanctionCheck:
        """Перевірка у санкційних списках."""
        # Mock — в реальності запит до API РНБО
        return SanctionCheck(
            query=name,
            is_sanctioned=False,
            matches=[],
            checked_lists=["rnbo_ua", "ofac", "eu", "uk", "un"],
            checked_at=datetime.now(UTC),
        )

    # ======================== НЕРУХОМІСТЬ ========================

    async def search_real_estate(
        self,
        owner_name: str | None = None,
        owner_edrpou: str | None = None,
        owner_rnokpp: str | None = None,
        address: str | None = None,
        limit: int = 50,
    ) -> list[RealEstate]:
        """Пошук нерухомості."""
        return [
            RealEstate(
                cadastral_number="8000000000:01:001:0001",
                address="м. Київ, вул. Хрещатик, 1, кв. 1",
                type="apartment",
                area_sqm=120.5,
                owner_name="Іванов Іван Іванович",
                owner_rnokpp="1234567890",
                registration_date=date(2018, 5, 10),
            ),
        ]

    # ======================== ТРАНСПОРТ ========================

    async def search_vehicles(
        self,
        owner_name: str | None = None,
        owner_edrpou: str | None = None,
        owner_rnokpp: str | None = None,
        vin: str | None = None,
        plate_number: str | None = None,
        limit: int = 50,
    ) -> list[Vehicle]:
        """Пошук транспортних засобів."""
        return [
            Vehicle(
                vin="WVWZZZ3CZWE123456",
                plate_number="АА1234ВВ",
                brand="Volkswagen",
                model="Passat",
                year=2020,
                color="чорний",
                owner_name="Іванов Іван Іванович",
                owner_rnokpp="1234567890",
                registration_date=date(2020, 3, 15),
            ),
        ]

    # ======================== КОМПЛЕКСНЕ РОЗСЛІДУВАННЯ ========================

    async def investigate_company(self, edrpou: str) -> dict[str, Any]:
        """Повне розслідування компанії."""
        company = await self.get_company(edrpou)
        vat = await self.check_vat_status(edrpou)
        debts = await self.check_debtor(edrpou)
        cases, _ = await self.search_court_cases(party_edrpou=edrpou)
        tenders, _ = await self.search_tenders(participant_edrpou=edrpou)
        sanctions = await self.check_sanctions(company.name if company else edrpou, edrpou=edrpou)

        return {
            "edrpou": edrpou,
            "name": company.name if company else None,
            "investigation_id": f"inv_{datetime.now(UTC).strftime('%Y%m%d_%H%M%S')}",
            "generated_at": datetime.now(UTC).isoformat(),
            "sections": {
                "edr": {
                    "status": company.status.value if company else None,
                    "registration_date": company.registration_date.isoformat() if (company and company.registration_date) else None,
                    "address": company.address.full if (company and company.address) else None,
                    "kved": company.kved_primary if company else None,
                    "authorized_capital": company.authorized_capital if company else None,
                    "founders_count": len(company.founders) if company else 0,
                    "managers_count": len(company.managers) if company else 0,
                },
                "vat": {
                    "is_vat_payer": vat.is_vat_payer,
                    "ipn": vat.ipn,
                    "status": vat.status,
                },
                "tax_debts": {
                    "has_debt": debts.has_debt,
                    "total_debt": debts.total_debt,
                    "debts_count": len(debts.debts),
                },
                "court_cases": {
                    "total_cases": len(cases),
                    "as_plaintiff": sum(1 for c in cases for p in c.parties if p.role == PartyRole.PLAINTIFF and p.edrpou == edrpou),
                    "as_defendant": sum(1 for c in cases for p in c.parties if p.role == PartyRole.DEFENDANT and p.edrpou == edrpou),
                },
                "prozorro": {
                    "total_tenders": len(tenders),
                    "won_tenders": sum(1 for t in tenders for p in t.participants if p.edrpou == edrpou and p.is_winner),
                    "total_contracts_value": sum(t.contract_amount or 0 for t in tenders for p in t.participants if p.edrpou == edrpou and p.is_winner),
                },
                "sanctions": {
                    "is_sanctioned": sanctions.is_sanctioned,
                    "matches_count": len(sanctions.matches),
                },
            },
            "risk_indicators": {
                "has_tax_debt": debts.has_debt,
                "high_tax_debt": debts.total_debt > 1000000,
                "has_court_cases": len(cases) > 0,
                "is_sanctioned": sanctions.is_sanctioned,
                "recent_registration": (company.registration_date is not None and (datetime.now(UTC).date() - company.registration_date).days < 365) if (company and company.registration_date) else False,
            },
        }

    async def investigate_person(self, rnokpp: str, name: str) -> dict[str, Any]:
        """Повне розслідування фізичної особи."""
        sanctions = await self.check_sanctions(name, rnokpp=rnokpp)
        real_estate = await self.search_real_estate(owner_rnokpp=rnokpp)
        vehicles = await self.search_vehicles(owner_rnokpp=rnokpp)
        cases, _ = await self.search_court_cases(party_name=name)

        return {
            "rnokpp": rnokpp,
            "name": name,
            "investigation_id": f"inv_{datetime.now(UTC).strftime('%Y%m%d_%H%M%S')}",
            "generated_at": datetime.now(UTC).isoformat(),
            "sections": {
                "sanctions": {
                    "is_sanctioned": sanctions.is_sanctioned,
                    "matches_count": len(sanctions.matches),
                },
                "real_estate": {
                    "total_objects": len(real_estate),
                    "total_area_sqm": sum(r.area_sqm or 0 for r in real_estate),
                },
                "vehicles": {
                    "total_vehicles": len(vehicles),
                },
                "court_cases": {
                    "total_cases": len(cases),
                },
            },
        }

    async def close(self):
        """Закриття клієнта."""
        await self.client.aclose()
