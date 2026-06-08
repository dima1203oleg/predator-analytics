"""Інтеграція з податковою службою України.

Модуль для отримання податкових даних компаній:
- Податкові зобов'язання
- ПДВ
- Податкові накладні
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
import logging

import httpx

logger = logging.getLogger(__name__)


@dataclass
class TaxRecord:
    """Податковий запис компанії."""

    company_ueid: str
    company_edrpou: str
    period_start: date
    period_end: date
    vat_obligations: float
    vat_paid: float
    income_tax: float
    total_tax_obligations: float
    total_tax_paid: float


@dataclass
class VATInvoice:
    """Податкова накладна."""

    invoice_number: str
    company_ueid: str
    invoice_date: date
    amount: float
    vat_amount: float


class TaxServiceIntegration:
    """Клієнт для інтеграції з податковою службою."""

    def __init__(self, base_url: str | None = None, api_key: str | None = None):
        self.base_url = base_url or "https://api.tax.gov.ua/v1"
        self.api_key = api_key
        self.client = httpx.AsyncClient(timeout=30.0)

    async def get_company_tax_records(
        self,
        company_edrpou: str,
        period_start: date,
        period_end: date,
    ) -> list[TaxRecord]:
        """Отримати податкові записи компанії за період."""
        try:
            # Симуляція API виклику (реальний API потребує аутентифікації)
            logger.info(f"Отримання податкових даних для ЄДРПОУ {company_edrpou}")

            # TODO: Реалізувати реальний API виклик
            # response = await self.client.get(
            #     f"{self.base_url}/companies/{company_edrpou}/tax",
            #     params={"period_start": period_start, "period_end": period_end},
            #     headers={"Authorization": f"Bearer {self.api_key}"}
            # )
            # data = response.json()

            # Тимчасова заглушка для демонстрації
            return [
                TaxRecord(
                    company_ueid=f"UEID-{company_edrpou}",
                    company_edrpou=company_edrpou,
                    period_start=period_start,
                    period_end=period_end,
                    vat_obligations=100000.0,
                    vat_paid=95000.0,
                    income_tax=50000.0,
                    total_tax_obligations=150000.0,
                    total_tax_paid=145000.0,
                )
            ]
        except Exception as e:
            logger.error(f"Помилка отримання податкових даних: {e}")
            return []

    async def get_vat_invoices(
        self,
        company_edrpou: str,
        invoice_date: date,
    ) -> list[VATInvoice]:
        """Отримати податкові накладні компанії за датою."""
        try:
            logger.info(f"Отримання ПДВ накладних для ЄДРПОУ {company_edrpou}")

            # TODO: Реалізувати реальний API виклик
            return [
                VATInvoice(
                    invoice_number=f"INV-{invoice_date.strftime('%Y%m%d')}-001",
                    company_ueid=f"UEID-{company_edrpou}",
                    invoice_date=invoice_date,
                    amount=50000.0,
                    vat_amount=10000.0,
                )
            ]
        except Exception as e:
            logger.error(f"Помилка отримання ПДВ накладних: {e}")
            return []

    async def close(self):
        """Закрити HTTP клієнт."""
        await self.client.aclose()


# Синглтон для використання в додатку
_tax_service: TaxServiceIntegration | None = None


def get_tax_service() -> TaxServiceIntegration:
    """Отримати синглтон інстанс податкової служби."""
    global _tax_service
    if _tax_service is None:
        _tax_service = TaxServiceIntegration()
    return _tax_service
