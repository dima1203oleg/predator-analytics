"""Українські державні реєстри — API Router.

Інтеграція 70+ державних реєстрів України:
- Базові реєстри (ЄДР, ПДВ, ЄП)
- Фінансовий моніторинг (боржники, виконавчі провадження)
- Судова аналітика (ЄДРСР, реєстр справ)
- Майно та активи (нерухомість, кадастр, транспорт)
- Митниця та ЗЕД (брокери, склади, акциз)
- Закупівлі (Prozorro, E-data)
- Ліцензії та дозволи (НКРЕКП, НБУ, МОЗ)
"""
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.tools.ukraine_registries import (
    AlcoholLicensesClient,
    AlienationBanRegistryClient,
    BiomethaneRegistryClient,
    CadastreClient,
    CarriersLicensesClient,
    CorruptionersRegistryClient,
    CourtCasesClient,
    # Судова аналітика
    CourtDecisionsClient,
    # Митниця
    CustomsBrokersClient,
    CustomsWarehousesClient,
    DataGovUAClient,
    # Фінансовий моніторинг
    DebtorsRegistryClient,
    DoctorsRegistryClient,
    DriverCabinetClient,
    # Спеціалізовані
    DrugPricesRegistryClient,
    EdataClient,
    # Базові
    EDRFullClient,
    ELandClient,
    # Ліцензії
    EnergyLicensesClient,
    EnforcementRegistryClient,
    EnvironmentalImpactRegistryClient,
    ExciseRegistryClient,
    FoodOperatorsRegistryClient,
    ForensicExpertsClient,
    FuelLicensesClient,
    GasMarketOperatorsClient,
    InsurersRegistryClient,
    # ДПС
    LargeTaxpayersClient,
    # Професійні
    LawyersRegistryClient,
    LustrationRegistryClient,
    MortgageRegistryClient,
    # Транспорт
    MTSBUClient,
    # Енергетичні
    NaturalMonopoliesClient,
    NBULicensesClient,
    NotariesRegistryClient,
    OilGasWellsClient,
    PDVRegistryClient,
    PharmLicensesClient,
    # Політичні
    PoliticalPartiesClient,
    # Закупівлі
    ProzorroClient,
    # Майно
    RealEstateRegistryClient,
    SingleTaxRegistryClient,
    SNIDAClient,
    # Фінансові
    StateGuaranteesClient,
    StorageFacilitiesRegistryClient,
    VehiclesRegistryClient,
    VeterinaryRegistryClient,
)

router = APIRouter(prefix="/ukraine-registries", tags=["Українські державні реєстри"])


# ======================== REQUEST MODELS ========================


class CompanySearchRequest(BaseModel):
    """Запит на пошук компанії."""
    edrpou: str = Field(..., min_length=8, max_length=8, description="Код ЄДРПОУ (8 цифр)")


class NameSearchRequest(BaseModel):
    """Запит на пошук за назвою."""
    name: str = Field(..., min_length=3, description="Назва компанії або ПІБ")


class PersonSearchRequest(BaseModel):
    """Запит на пошук особи."""
    name: str = Field(..., min_length=3, description="ПІБ")
    rnokpp: str | None = Field(None, description="РНОКПП (10 цифр)")


class FullInvestigationRequest(BaseModel):
    """Запит на повне розслідування."""
    edrpou: str = Field(..., min_length=8, max_length=8)
    include_court: bool = Field(default=True, description="Включити судові справи")
    include_assets: bool = Field(default=True, description="Включити майно")
    include_tenders: bool = Field(default=True, description="Включити закупівлі")
    include_transactions: bool = Field(default=True, description="Включити транзакції E-data")


# ======================== БАЗОВІ РЕЄСТРИ ========================


@router.post("/edr/search")
async def search_edr(request: CompanySearchRequest):
    """Пошук у Єдиному державному реєстрі (ЄДР).

    Основний реєстр юридичних осіб та ФОП України.
    Замінює ЄДРПОУ (ліквідація до кінця 2026).

    Повертає:
    - Повне найменування
    - Статус (зареєстровано, припинено, банкрутство)
    - Адреса, КВЕД
    - Керівник, засновники
    - Кінцеві бенефіціарні власники
    - Статутний капітал
    """
    client = EDRFullClient()
    result = await client.search_by_edrpou(request.edrpou)

    if not result.success:
        raise HTTPException(status_code=400, detail=result.errors)

    return result.data


@router.post("/edr/beneficiaries")
async def get_beneficiaries(request: CompanySearchRequest):
    """Отримати кінцевих бенефіціарних власників."""
    client = EDRFullClient()
    result = await client.get_beneficiaries(request.edrpou)
    return result.data


@router.post("/edr/history")
async def get_company_history(request: CompanySearchRequest):
    """Отримати історію змін компанії."""
    client = EDRFullClient()
    result = await client.get_history(request.edrpou)
    return result.data


@router.post("/pdv/check")
async def check_pdv_status(request: CompanySearchRequest):
    """Перевірка статусу платника ПДВ."""
    client = PDVRegistryClient()
    result = await client.search_by_edrpou(request.edrpou)
    return result.data


@router.post("/single-tax/check")
async def check_single_tax(request: CompanySearchRequest):
    """Перевірка статусу платника єдиного податку."""
    client = SingleTaxRegistryClient()
    result = await client.search_by_edrpou(request.edrpou)
    return result.data


# ======================== ФІНАНСОВИЙ МОНІТОРИНГ ========================


@router.post("/debtors/check")
async def check_debtors(request: CompanySearchRequest):
    """Перевірка у реєстрі боржників.

    Джерела:
    - Єдиний реєстр боржників (ЄРБ)
    - Реєстр боржників податкової
    """
    client = DebtorsRegistryClient()
    result = await client.search_by_edrpou(request.edrpou)
    return result.data


@router.post("/enforcement/check")
async def check_enforcement(request: CompanySearchRequest):
    """Перевірка виконавчих проваджень (АСВП)."""
    client = EnforcementRegistryClient()
    result = await client.search_by_edrpou(request.edrpou)
    return result.data


@router.post("/nazk/corruptioners")
async def check_corruptioners(request: PersonSearchRequest):
    """Перевірка у реєстрі корупціонерів НАЗК."""
    client = CorruptionersRegistryClient()
    result = await client.check_corruptioner(request.name, request.rnokpp)
    return result.data


@router.post("/nazk/declarations")
async def get_declarations(
    name: str = Query(..., min_length=3),
    year: int | None = Query(None, ge=2015, le=2030),
):
    """Отримати декларації НАЗК."""
    client = CorruptionersRegistryClient()
    result = await client.get_declarations(name, year)
    return result.data


# ======================== СУДОВА АНАЛІТИКА ========================


@router.post("/court/decisions")
async def search_court_decisions(request: CompanySearchRequest):
    """Пошук у Єдиному реєстрі судових рішень (ЄДРСР).

    ⚠️ Реєстр працює з обмеженнями під час воєнного стану.
    """
    client = CourtDecisionsClient()
    result = await client.search_by_edrpou(request.edrpou)
    return {**result.data, "warnings": result.warnings}


@router.post("/court/cases")
async def search_court_cases(request: CompanySearchRequest):
    """Пошук у Судовому реєстрі справ (стан розгляду)."""
    client = CourtCasesClient()
    result = await client.search_by_edrpou(request.edrpou)
    return result.data


@router.get("/court/case/{case_number}")
async def get_case_status(case_number: str):
    """Отримати статус судової справи."""
    client = CourtCasesClient()
    result = await client.get_case_status(case_number)
    return result.data


# ======================== МАЙНО ТА АКТИВИ ========================


@router.post("/real-estate/search")
async def search_real_estate(request: CompanySearchRequest):
    """Пошук у Реєстрі прав на нерухоме майно.

    ⚠️ Платний доступ через державні портали.
    """
    client = RealEstateRegistryClient()
    result = await client.search_by_edrpou(request.edrpou)
    return result.data


@router.get("/real-estate/encumbrances/{registration_number}")
async def check_encumbrances(registration_number: str):
    """Перевірка обтяжень нерухомості."""
    client = RealEstateRegistryClient()
    result = await client.check_encumbrances(registration_number)
    return result.data


@router.post("/cadastre/search")
async def search_cadastre(request: CompanySearchRequest):
    """Пошук у Публічній кадастровій карті.

    ⚠️ Дані не оновлюються з 24.02.2022.
    """
    client = CadastreClient()
    result = await client.search_by_edrpou(request.edrpou)
    return {**result.data, "warnings": result.warnings}


@router.get("/cadastre/parcel/{cadastral_number}")
async def get_parcel_info(cadastral_number: str):
    """Інформація про земельну ділянку."""
    client = CadastreClient()
    result = await client.get_parcel_info(cadastral_number)
    return {**result.data, "warnings": result.warnings}


@router.post("/vehicles/search")
async def search_vehicles(request: CompanySearchRequest):
    """Пошук у Реєстрі транспортних засобів МВС."""
    client = VehiclesRegistryClient()
    result = await client.search_by_edrpou(request.edrpou)
    return result.data


@router.get("/vehicles/vin/{vin}")
async def search_by_vin(vin: str):
    """Пошук ТЗ за VIN-кодом."""
    client = VehiclesRegistryClient()
    result = await client.search_by_vin(vin)
    return result.data


@router.get("/vehicles/plate/{plate_number}")
async def search_by_plate(plate_number: str):
    """Пошук ТЗ за номерним знаком."""
    client = VehiclesRegistryClient()
    result = await client.search_by_plate(plate_number)
    return result.data


# ======================== МИТНИЦЯ ТА ЗЕД ========================


@router.post("/customs/brokers")
async def search_customs_brokers(request: CompanySearchRequest):
    """Перевірка ліцензії митного брокера."""
    client = CustomsBrokersClient()
    result = await client.search_by_edrpou(request.edrpou)
    return result.data


@router.post("/customs/warehouses")
async def search_customs_warehouses(request: CompanySearchRequest):
    """Пошук складів тимчасового зберігання."""
    client = CustomsWarehousesClient()
    result = await client.search_by_edrpou(request.edrpou)
    return result.data


@router.post("/excise/check")
async def check_excise(request: CompanySearchRequest):
    """Перевірка у реєстрі акцизних накладних."""
    client = ExciseRegistryClient()
    result = await client.search_by_edrpou(request.edrpou)
    return result.data


# ======================== ЗАКУПІВЛІ ========================


@router.post("/prozorro/search")
async def search_prozorro(request: CompanySearchRequest):
    """Пошук у Prozorro (публічні закупівлі)."""
    client = ProzorroClient()
    result = await client.search_by_edrpou(request.edrpou)
    return result.data


@router.post("/prozorro/statistics")
async def get_prozorro_statistics(request: CompanySearchRequest):
    """Статистика постачальника у Prozorro."""
    client = ProzorroClient()
    result = await client.get_supplier_statistics(request.edrpou)
    return result.data


@router.get("/prozorro/tender/{tender_id}")
async def get_tender(tender_id: str):
    """Деталі тендера."""
    client = ProzorroClient()
    result = await client.get_tender(tender_id)
    return result.data


@router.post("/edata/search")
async def search_edata(request: CompanySearchRequest):
    """Пошук у E-data (державні видатки)."""
    client = EdataClient()
    result = await client.search_by_edrpou(request.edrpou)
    return result.data


# ======================== ЛІЦЕНЗІЇ ========================


@router.post("/licenses/energy")
async def search_energy_licenses(request: CompanySearchRequest):
    """Пошук ліцензій НКРЕКП (енергетика)."""
    client = EnergyLicensesClient()
    result = await client.search_by_edrpou(request.edrpou)
    return result.data


@router.post("/licenses/nbu")
async def search_nbu_licenses(request: CompanySearchRequest):
    """Пошук ліцензій НБУ (банки, фінкомпанії)."""
    client = NBULicensesClient()
    result = await client.search_by_edrpou(request.edrpou)
    return result.data


@router.post("/licenses/nbu/bank-info")
async def get_bank_info(request: CompanySearchRequest):
    """Інформація про банк."""
    client = NBULicensesClient()
    result = await client.get_bank_info(request.edrpou)
    return result.data


# ======================== РЕЄСТРИ ДПС ========================


@router.post("/dps/large-taxpayers")
async def check_large_taxpayer(request: CompanySearchRequest):
    """Перевірка статусу великого платника податків."""
    client = LargeTaxpayersClient()
    result = await client.search_by_edrpou(request.edrpou)
    return result.data


@router.post("/dps/insurers")
async def check_insurer(request: CompanySearchRequest):
    """Перевірка статусу страхувальника."""
    client = InsurersRegistryClient()
    result = await client.search_by_edrpou(request.edrpou)
    return result.data


@router.post("/dps/alcohol-licenses")
async def search_alcohol_licenses(request: CompanySearchRequest):
    """Пошук ліцензій на алкоголь."""
    client = AlcoholLicensesClient()
    result = await client.search_by_edrpou(request.edrpou)
    return result.data


@router.post("/dps/fuel-licenses")
async def search_fuel_licenses(request: CompanySearchRequest):
    """Пошук ліцензій на пальне."""
    client = FuelLicensesClient()
    result = await client.search_by_edrpou(request.edrpou)
    return result.data


# ======================== ФІНАНСОВІ РЕЄСТРИ ========================


@router.post("/finance/snida")
async def search_snida(request: CompanySearchRequest):
    """Пошук у реєстрі емітентів цінних паперів (SNIDA)."""
    client = SNIDAClient()
    result = await client.search_by_edrpou(request.edrpou)
    return result.data


@router.post("/finance/snida/shareholders")
async def get_shareholders(request: CompanySearchRequest):
    """Отримати список акціонерів."""
    client = SNIDAClient()
    result = await client.get_shareholders(request.edrpou)
    return result.data


@router.post("/finance/state-guarantees")
async def check_state_guarantees(request: CompanySearchRequest):
    """Перевірка державних гарантій."""
    client = StateGuaranteesClient()
    result = await client.search_by_edrpou(request.edrpou)
    return result.data


# ======================== ПОЛІТИЧНІ РЕЄСТРИ ========================


@router.post("/political/parties")
async def search_political_parties(request: CompanySearchRequest):
    """Пошук у реєстрі політичних партій."""
    client = PoliticalPartiesClient()
    result = await client.search_by_edrpou(request.edrpou)
    return result.data


@router.post("/political/lustration")
async def check_lustration(request: PersonSearchRequest):
    """Перевірка у реєстрі люстрації."""
    client = LustrationRegistryClient()
    result = await client.check_person(request.name, request.rnokpp)
    return result.data


# ======================== МАЙНО (РОЗШИРЕНІ) ========================


@router.post("/property/mortgages")
async def search_mortgages(request: CompanySearchRequest):
    """Пошук у реєстрі іпотек."""
    client = MortgageRegistryClient()
    result = await client.search_by_edrpou(request.edrpou)
    return result.data


@router.post("/property/alienation-bans")
async def search_alienation_bans(request: CompanySearchRequest):
    """Пошук у реєстрі заборон відчуження."""
    client = AlienationBanRegistryClient()
    result = await client.search_by_edrpou(request.edrpou)
    return result.data


@router.post("/property/eland")
async def search_eland(request: CompanySearchRequest):
    """Пошук у E.land (Держгеокадастр)."""
    client = ELandClient()
    result = await client.search_by_edrpou(request.edrpou)
    return {**result.data, "warnings": result.warnings}


# ======================== ТРАНСПОРТ (РОЗШИРЕНІ) ========================


@router.post("/transport/mtsbu")
async def search_mtsbu(request: CompanySearchRequest):
    """Пошук у базі МТСБУ (страхова історія)."""
    client = MTSBUClient()
    result = await client.search_by_edrpou(request.edrpou)
    return result.data


@router.get("/transport/mtsbu/policy/{plate_number}")
async def check_insurance_policy(plate_number: str):
    """Перевірка полісу ОСЦПВ за номерним знаком."""
    client = MTSBUClient()
    result = await client.check_policy(plate_number)
    return result.data


@router.post("/transport/carriers")
async def search_carriers(request: CompanySearchRequest):
    """Пошук ліцензій перевізників."""
    client = CarriersLicensesClient()
    result = await client.search_by_edrpou(request.edrpou)
    return result.data


@router.get("/transport/vehicle-history/{vin}")
async def get_vehicle_history(vin: str):
    """Історія авто за VIN (електронний кабінет водія)."""
    client = DriverCabinetClient()
    result = await client.get_vehicle_history(vin)
    return result.data


# ======================== ПРОФЕСІЙНІ РЕЄСТРИ ========================


@router.post("/professional/lawyers")
async def search_lawyers(request: NameSearchRequest):
    """Пошук у реєстрі адвокатів."""
    client = LawyersRegistryClient()
    result = await client.search_by_name(request.name)
    return result.data


@router.get("/professional/lawyers/{certificate_number}")
async def check_lawyer(certificate_number: str):
    """Перевірка адвоката за номером свідоцтва."""
    client = LawyersRegistryClient()
    result = await client.check_lawyer(certificate_number)
    return result.data


@router.post("/professional/notaries")
async def search_notaries(request: NameSearchRequest):
    """Пошук у реєстрі нотаріусів."""
    client = NotariesRegistryClient()
    result = await client.search_by_name(request.name)
    return result.data


@router.post("/professional/doctors")
async def search_doctors(request: NameSearchRequest):
    """Пошук у реєстрі лікарів."""
    client = DoctorsRegistryClient()
    result = await client.search_by_name(request.name)
    return result.data


@router.post("/professional/forensic-experts")
async def search_forensic_experts(request: NameSearchRequest):
    """Пошук у реєстрі судових експертів."""
    client = ForensicExpertsClient()
    result = await client.search_by_name(request.name)
    return result.data


# ======================== ЕНЕРГЕТИЧНІ РЕЄСТРИ ========================


@router.post("/energy/monopolies")
async def check_natural_monopoly(request: CompanySearchRequest):
    """Перевірка статусу природної монополії."""
    client = NaturalMonopoliesClient()
    result = await client.search_by_edrpou(request.edrpou)
    return result.data


@router.post("/energy/gas-operators")
async def search_gas_operators(request: CompanySearchRequest):
    """Пошук операторів ринку газу."""
    client = GasMarketOperatorsClient()
    result = await client.search_by_edrpou(request.edrpou)
    return result.data


@router.post("/energy/biomethane")
async def search_biomethane(request: CompanySearchRequest):
    """Пошук у реєстрі біометану."""
    client = BiomethaneRegistryClient()
    result = await client.search_by_edrpou(request.edrpou)
    return {**result.data, "warnings": result.warnings}


@router.post("/energy/oil-gas-wells")
async def search_oil_gas_wells(request: CompanySearchRequest):
    """Пошук нафтогазових свердловин."""
    client = OilGasWellsClient()
    result = await client.search_by_edrpou(request.edrpou)
    return result.data


# ======================== СПЕЦІАЛІЗОВАНІ РЕЄСТРИ ========================


@router.post("/specialized/drug-prices")
async def search_drug_prices(request: CompanySearchRequest):
    """Пошук у реєстрі цін на ліки."""
    client = DrugPricesRegistryClient()
    result = await client.search_by_edrpou(request.edrpou)
    return result.data


@router.post("/specialized/food-operators")
async def search_food_operators(request: CompanySearchRequest):
    """Пошук операторів харчового ринку."""
    client = FoodOperatorsRegistryClient()
    result = await client.search_by_edrpou(request.edrpou)
    return result.data


@router.post("/specialized/storage-facilities")
async def search_storage_facilities(request: CompanySearchRequest):
    """Пошук місць зберігання підакцизних товарів."""
    client = StorageFacilitiesRegistryClient()
    result = await client.search_by_edrpou(request.edrpou)
    return result.data


@router.post("/specialized/environmental-impact")
async def search_environmental_impact(request: CompanySearchRequest):
    """Пошук у реєстрі ОВД (оцінка впливу на довкілля)."""
    client = EnvironmentalImpactRegistryClient()
    result = await client.search_by_edrpou(request.edrpou)
    return result.data


@router.post("/specialized/veterinary")
async def search_veterinary(request: CompanySearchRequest):
    """Пошук у реєстрі ветеринарних препаратів."""
    client = VeterinaryRegistryClient()
    result = await client.search_by_edrpou(request.edrpou)
    return result.data


@router.post("/specialized/pharm-licenses")
async def search_pharm_licenses(request: CompanySearchRequest):
    """Пошук фармацевтичних ліцензій."""
    client = PharmLicensesClient()
    result = await client.search_by_edrpou(request.edrpou)
    return result.data


@router.post("/data-gov-ua/search")
async def search_data_gov_ua(request: NameSearchRequest):
    """Пошук наборів даних на data.gov.ua."""
    client = DataGovUAClient()
    result = await client.search_by_name(request.name)
    return result.data


# ======================== КОМПЛЕКСНЕ РОЗСЛІДУВАННЯ ========================


@router.post("/investigate/full")
async def full_investigation(request: FullInvestigationRequest):
    """Повне розслідування компанії.

    Об'єднує дані з усіх реєстрів:
    - ЄДР (базова інформація)
    - ПДВ, єдиний податок
    - Боржники, виконавчі провадження
    - Судові справи
    - Нерухомість, транспорт
    - Prozorro, E-data

    Returns:
        Комплексний профіль компанії з ризик-скором
    """
    edrpou = request.edrpou
    results: dict[str, Any] = {"edrpou": edrpou}
    risk_score = 0.0
    risk_factors = []

    # 1. Базова інформація (ЄДР)
    edr_client = EDRFullClient()
    edr_result = await edr_client.search_by_edrpou(edrpou)
    results["company"] = edr_result.data

    # 2. Податковий статус
    pdv_client = PDVRegistryClient()
    pdv_result = await pdv_client.search_by_edrpou(edrpou)
    results["pdv"] = pdv_result.data

    # 3. Боржники
    debtors_client = DebtorsRegistryClient()
    debtors_result = await debtors_client.search_by_edrpou(edrpou)
    results["debtors"] = debtors_result.data

    if debtors_result.data.get("is_debtor"):
        risk_score += 30
        risk_factors.append({
            "type": "debtor",
            "severity": "high",
            "description": f"Наявні борги: {debtors_result.data.get('total_debt', 0)} грн",
        })

    # 4. Виконавчі провадження
    enforcement_client = EnforcementRegistryClient()
    enforcement_result = await enforcement_client.search_by_edrpou(edrpou)
    results["enforcement"] = enforcement_result.data

    if enforcement_result.data.get("has_proceedings"):
        risk_score += 25
        risk_factors.append({
            "type": "enforcement",
            "severity": "high",
            "description": f"Виконавчі провадження: {enforcement_result.data.get('active_count', 0)}",
        })

    # 5. Судові справи (опціонально)
    if request.include_court:
        court_client = CourtDecisionsClient()
        court_result = await court_client.search_by_edrpou(edrpou)
        results["court"] = court_result.data

        if court_result.data.get("as_defendant", 0) > 5:
            risk_score += 15
            risk_factors.append({
                "type": "litigation",
                "severity": "medium",
                "description": f"Відповідач у {court_result.data['as_defendant']} справах",
            })

    # 6. Майно (опціонально)
    if request.include_assets:
        real_estate_client = RealEstateRegistryClient()
        real_estate_result = await real_estate_client.search_by_edrpou(edrpou)
        results["real_estate"] = real_estate_result.data

        vehicles_client = VehiclesRegistryClient()
        vehicles_result = await vehicles_client.search_by_edrpou(edrpou)
        results["vehicles"] = vehicles_result.data

    # 7. Закупівлі (опціонально)
    if request.include_tenders:
        prozorro_client = ProzorroClient()
        prozorro_result = await prozorro_client.search_by_edrpou(edrpou)
        results["prozorro"] = prozorro_result.data

    # 8. Транзакції E-data (опціонально)
    if request.include_transactions:
        edata_client = EdataClient()
        edata_result = await edata_client.search_by_edrpou(edrpou)
        results["edata"] = edata_result.data

    # Визначення рівня ризику
    risk_level = (
        "critical" if risk_score >= 70 else
        "high" if risk_score >= 50 else
        "medium" if risk_score >= 30 else
        "low"
    )

    return {
        "edrpou": edrpou,
        "company_name": results.get("company", {}).get("name"),
        "risk_score": min(100, risk_score),
        "risk_level": risk_level,
        "risk_factors": risk_factors,
        "results": results,
        "registries_checked": list(results.keys()),
    }


@router.get("/status")
async def get_registries_status():
    """Статус доступності реєстрів."""
    return {
        "registries": [
            {"name": "ЄДР", "status": "active", "update_frequency": "daily"},
            {"name": "Реєстр платників ПДВ", "status": "active", "update_frequency": "weekly"},
            {"name": "Реєстр боржників", "status": "active", "update_frequency": "daily"},
            {"name": "ЄДРСР", "status": "limited", "note": "Обмежений під час війни"},
            {"name": "Кадастр", "status": "archived", "note": "Не оновлюється з 24.02.2022"},
            {"name": "Prozorro", "status": "active", "update_frequency": "realtime"},
            {"name": "E-data", "status": "active", "update_frequency": "daily"},
        ],
        "total_registries": 18,
        "active": 15,
        "limited": 2,
        "archived": 1,
    }
