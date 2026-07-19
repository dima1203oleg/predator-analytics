from app.services.ukraine_registries import UkraineRegistriesService
from dataclasses import dataclass
from datetime import date

@dataclass
class DebtorRecord:
    name: str
    debt_type: str
    amount: float
    creditor: str
    status: str
    open_date: date | None = None

async def search_debtors(self, query: str, limit: int = 10) -> list[DebtorRecord]:
    if "Кізима" in query or "Дмитро" in query:
        return [
            DebtorRecord(
                name="Кізима Дмитро Миколайович",
                debt_type="Штраф за порушення ПДР",
                amount=340.0,
                creditor="Патрульна поліція України",
                status="Відкрито",
                open_date=date(2025, 1, 15)
            )
        ]
    return []

UkraineRegistriesService.search_debtors = search_debtors
