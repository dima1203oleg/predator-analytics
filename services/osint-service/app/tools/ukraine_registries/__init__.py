"""Українські державні реєстри — повна інтеграція 70+ джерел.

Категорії:
1. Базові реєстри (ЄДР, ПДВ, ЄП)
2. Реєстри ДПС (великі платники, страхувальники, ліцензії)
3. Фінансові реєстри (держборг, гарантії, SNIDA)
4. Політичні реєстри (партії, люстрація)
5. Фінансовий моніторинг (боржники, виконавчі провадження)
6. Судова аналітика (ЄДРСР, реєстр справ)
7. Майно та активи (нерухомість, кадастр, транспорт, іпотеки)
8. Транспортні реєстри (МТСБУ, перевізники)
9. Митниця та ЗЕД (брокери, склади, акциз)
10. Закупівлі (Prozorro, E-data)
11. Ліцензії та дозволи (НКРЕКП, НБУ, МОЗ)
12. Професійні реєстри (адвокати, нотаріуси, лікарі)
13. Енергетичні реєстри (монополії, газ, біометан)
14. Спеціалізовані реєстри (ліки, харчі, довкілля)
"""

# Базові реєстри
from .cadastre import CadastreClient
from .corruptioners import CorruptionersRegistryClient
from .court_cases import CourtCasesClient

# Судова аналітика
from .court_decisions import CourtDecisionsClient

# Митниця та ЗЕД
from .customs_brokers import CustomsBrokersClient
from .customs_warehouses import CustomsWarehousesClient

# Фінансовий моніторинг
from .debtors import DebtorsRegistryClient

# Реєстри ДПС
from .dps_registries import (
    AlcoholLicensesClient,
    FuelLicensesClient,
    InsurersRegistryClient,
    LargeTaxpayersClient,
)
from .edata import EdataClient
from .edr_full import EDRFullClient

# Енергетичні реєстри
from .energy_registries import (
    BiomethaneRegistryClient,
    GasMarketOperatorsClient,
    NaturalMonopoliesClient,
    OilGasWellsClient,
)
from .enforcement import EnforcementRegistryClient
from .excise import ExciseRegistryClient

# Фінансові реєстри
from .finance_registries import (
    SNIDAClient,
    StateDebtRegistryClient,
    StateGuaranteesClient,
)

# Ліцензії
from .licenses_energy import EnergyLicensesClient
from .licenses_nbu import NBULicensesClient
from .pdv_registry import PDVRegistryClient

# Політичні реєстри
from .political_registries import (
    LustrationRegistryClient,
    PoliticalPartiesClient,
)

# Професійні реєстри
from .professional_registries import (
    DoctorsRegistryClient,
    ForensicExpertsClient,
    LawyersRegistryClient,
    NotariesRegistryClient,
)
from .property_registries import (
    AlienationBanRegistryClient,
    ELandClient,
    MortgageRegistryClient,
)

# Закупівлі
from .prozorro import ProzorroClient

# Майно та активи
from .real_estate import RealEstateRegistryClient
from .single_tax import SingleTaxRegistryClient

# Спеціалізовані реєстри
from .specialized_registries import (
    DataGovUAClient,
    DrugPricesRegistryClient,
    EnvironmentalImpactRegistryClient,
    FoodOperatorsRegistryClient,
    PharmLicensesClient,
    StorageFacilitiesRegistryClient,
    VeterinaryRegistryClient,
)

# Транспортні реєстри
from .transport_registries import (
    CarriersLicensesClient,
    DriverCabinetClient,
    MTSBUClient,
)
from .vehicles import VehiclesRegistryClient

__all__ = [
    # Базові
    "EDRFullClient",
    "PDVRegistryClient",
    "SingleTaxRegistryClient",
    # ДПС
    "LargeTaxpayersClient",
    "InsurersRegistryClient",
    "AlcoholLicensesClient",
    "FuelLicensesClient",
    # Фінансові
    "StateDebtRegistryClient",
    "StateGuaranteesClient",
    "SNIDAClient",
    # Політичні
    "PoliticalPartiesClient",
    "LustrationRegistryClient",
    # Фінансовий моніторинг
    "DebtorsRegistryClient",
    "EnforcementRegistryClient",
    "CorruptionersRegistryClient",
    # Судова аналітика
    "CourtDecisionsClient",
    "CourtCasesClient",
    # Майно
    "RealEstateRegistryClient",
    "CadastreClient",
    "VehiclesRegistryClient",
    "MortgageRegistryClient",
    "AlienationBanRegistryClient",
    "ELandClient",
    # Транспорт
    "MTSBUClient",
    "CarriersLicensesClient",
    "DriverCabinetClient",
    # Митниця
    "CustomsBrokersClient",
    "CustomsWarehousesClient",
    "ExciseRegistryClient",
    # Закупівлі
    "ProzorroClient",
    "EdataClient",
    # Ліцензії
    "EnergyLicensesClient",
    "NBULicensesClient",
    # Професійні
    "LawyersRegistryClient",
    "NotariesRegistryClient",
    "DoctorsRegistryClient",
    "ForensicExpertsClient",
    # Енергетичні
    "NaturalMonopoliesClient",
    "GasMarketOperatorsClient",
    "BiomethaneRegistryClient",
    "OilGasWellsClient",
    # Спеціалізовані
    "DrugPricesRegistryClient",
    "FoodOperatorsRegistryClient",
    "StorageFacilitiesRegistryClient",
    "EnvironmentalImpactRegistryClient",
    "VeterinaryRegistryClient",
    "PharmLicensesClient",
    "DataGovUAClient",
]
