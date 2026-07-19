"""Tax Collector — Реєстр платників ПДВ та податковий борг (ДПС).

Класифікація: WHITE.
"""
from .base import BaseCollector, Classification, DataFragment, DossierQuery, EntityType


class TaxCollector(BaseCollector):
    name = "tax"
    display_name = "ДПС (Податковий статус)"
    classification = Classification.WHITE
    description = "Реєстр ПДВ, податковий борг, перевірка ІПН"
    supported_entities = [EntityType.COMPANY, EntityType.PERSON]

    async def collect(self, query: DossierQuery) -> list[DataFragment]:
        from app.services.ukraine_registries import UkraineRegistriesService
        fragments: list[DataFragment] = []
        service = UkraineRegistriesService()
        try:
            if query.edrpou:
                vat = await service.check_vat_status(query.edrpou)
                if vat:
                    fragments.append(DataFragment(
                        category="tax_vat",
                        source_name="Реєстр платників ПДВ",
                        classification=Classification.WHITE,
                        data={
                            "edrpou": query.edrpou,
                            "is_vat_payer": vat.is_active,
                            "vat_number": vat.vat_number,
                            "registration_date": vat.registration_date.isoformat() if vat.registration_date else None,
                            "annulment_date": vat.annulment_date.isoformat() if vat.annulment_date else None,
                        },
                    ))

            # Перевірка боргу
            search_key = query.edrpou or query.rnokpp or query.name
            if search_key:
                debtors = await service.search_debtors(query=search_key, limit=10)
                if debtors:
                    records = []
                    for d in debtors:
                        records.append({
                            "debtor_name": d.name,
                            "debt_type": d.debt_type,
                            "amount": d.amount,
                            "creditor": d.creditor,
                            "status": d.status,
                            "open_date": d.open_date.isoformat() if d.open_date else None,
                        })

                    fragments.append(DataFragment(
                        category="tax_debt",
                        source_name="Реєстр Боржників (ДПС/Мін'юст)",
                        classification=Classification.WHITE,
                        data={"total_debts": len(debtors)},
                        raw_records=records,
                    ))
        except Exception as e:
            self._logger.warning(f"Tax API помилка: {e}")
        finally:
            await service.close()
        return fragments
