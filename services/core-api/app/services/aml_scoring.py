"""AML Scoring Service — Оцінка ризиків (Anti-Money Laundering).

Вагова модель ризиків згідно з ТЗ:
- Наявність у санкційних списках (вага 100)
- Участь у судових справах про контрабанду (вага 80)
- Податкові борги > 1 млн грн (вага 70)
- Зв'язки з офшорними юрисдикціями (вага 60)
- Відсутність реальної діяльності (вага 50)
- Часта зміна керівників/засновників (вага 40)
- Масова реєстрація на одну адресу (вага 30)
"""
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import StrEnum
import logging
from typing import Any, ClassVar  # Додано Dict для більш точної типізації

logger = logging.getLogger(__name__)


class RiskLevel(StrEnum):
    """Рівні ризику."""

    CRITICAL = "critical"  # 80-100
    HIGH = "high"  # 60-79
    MEDIUM = "medium"  # 40-59
    LOW = "low"  # 20-39
    MINIMAL = "minimal"  # 0-19


class RiskCategory(StrEnum):
    """Категорії ризиків."""

    SANCTIONS = "sanctions"
    CRIMINAL = "criminal"
    TAX = "tax"
    OFFSHORE = "offshore"
    SHELL_COMPANY = "shell_company"
    MANAGEMENT = "management"
    REGISTRATION = "registration"
    PEP = "pep"
    BENEFICIAL_OWNERSHIP = "beneficial_ownership"
    FINANCIAL = "financial"


@dataclass
class RiskFactor:
    """Фактор ризику."""

    category: RiskCategory
    name: str
    description: str
    weight: int  # 0-100
    detected: bool = False
    details: dict[str, Any] = field(default_factory=dict)
    source: str = ""


@dataclass
class RiskScore:
    """Результат оцінки ризику."""

    entity_id: str
    entity_name: str
    entity_type: str  # person, organization
    total_score: int  # 0-100
    risk_level: RiskLevel
    factors: list[RiskFactor] = field(default_factory=list)
    recommendations: list[str] = field(default_factory=list)
    calculated_at: datetime = field(default_factory=lambda: datetime.now(UTC))


# Офшорні юрисдикції
OFFSHORE_JURISDICTIONS = {
    "BVI": "Британські Віргінські Острови",
    "CY": "Кіпр",
    "PA": "Панама",
    "KY": "Кайманові Острови",
    "SC": "Сейшельські Острови",
    "BZ": "Беліз",
    "MT": "Мальта",
    "LU": "Люксембург",
    "LI": "Ліхтенштейн",
    "MC": "Монако",
    "AD": "Андорра",
    "GI": "Гібралтар",
    "JE": "Джерсі",
    "GG": "Гернсі",
    "IM": "Острів Мен",
    "VG": "Віргінські Острови (США)",
    "MH": "Маршаллові Острови",
    "WS": "Самоа",
    "VU": "Вануату",
}

# Ключові слова для виявлення контрабанди
SMUGGLING_KEYWORDS = [
    "контрабанда", "ухилення від сплати", "митні платежі",
    "незаконне переміщення", "підроблені документи", "фіктивний експорт",
    "занижена митна вартість", "пересортиця", "тіньовий імпорт",
]


class AMLScoringService:
    """Сервіс оцінки AML-ризиків."""

    # Вагові коефіцієнти факторів ризику
    RISK_WEIGHTS: ClassVar[dict[RiskCategory, int]] = {
        RiskCategory.SANCTIONS: 100,
        RiskCategory.CRIMINAL: 80,
        RiskCategory.TAX: 70,
        RiskCategory.OFFSHORE: 60,
        RiskCategory.SHELL_COMPANY: 50,
        RiskCategory.MANAGEMENT: 40,
        RiskCategory.REGISTRATION: 30,
        RiskCategory.PEP: 50,
        RiskCategory.BENEFICIAL_OWNERSHIP: 45,
        RiskCategory.FINANCIAL: 35,
    }

    def __init__(self) -> None:
        self.factors: list[RiskFactor] = []

    def _get_risk_level(self, score: int) -> RiskLevel:
        """Визначити рівень ризику за скором."""
        if score >= 80:
            return RiskLevel.CRITICAL
        elif score >= 60:
            return RiskLevel.HIGH
        elif score >= 40:
            return RiskLevel.MEDIUM
        elif score >= 20:
            return RiskLevel.LOW
        else:
            return RiskLevel.MINIMAL

    def _generate_recommendations(self, factors: list[RiskFactor]) -> list[str]:
        """Генерація рекомендацій на основі виявлених факторів."""
        recommendations = []

        detected_factors = [f for f in factors if f.detected]

        for factor in detected_factors:
            if factor.category == RiskCategory.SANCTIONS:
                recommendations.append(
                    "🚨 КРИТИЧНО: Суб'єкт знаходиться у санкційному списку. "
                    "Рекомендовано негайно припинити будь-які операції."
                )
            elif factor.category == RiskCategory.CRIMINAL:
                recommendations.append(
                    "⚠️ Виявлено участь у кримінальних справах. "
                    "Рекомендовано провести поглиблену перевірку."
                )
            elif factor.category == RiskCategory.TAX:
                recommendations.append(
                    "⚠️ Значні податкові борги. "
                    "Рекомендовано перевірити фінансову стабільність."
                )
            elif factor.category == RiskCategory.OFFSHORE:
                recommendations.append(
                    "⚠️ Зв'язки з офшорними юрисдикціями. "
                    "Рекомендовано перевірити структуру власності."
                )
            elif factor.category == RiskCategory.SHELL_COMPANY:
                recommendations.append(
                    "⚠️ Ознаки фіктивної компанії. "
                    "Рекомендовано перевірити реальну діяльність."
                )
            elif factor.category == RiskCategory.MANAGEMENT:
                recommendations.append(
                    "ℹ️ Часта зміна керівництва. "
                    "Рекомендовано перевірити історію компанії."
                )
            elif factor.category == RiskCategory.PEP:
                recommendations.append(
                    "⚠️ Політично значуща особа (PEP). "
                    "Рекомендовано застосувати посилену перевірку."
                )

        if not recommendations:
            recommendations.append(
                "✅ Суттєвих факторів ризику не виявлено. "
                "Рекомендовано стандартний моніторинг."
            )

        return recommendations

    async def calculate_score(
        self,
        entity_id: str,
        entity_name: str,
        entity_type: str,
        data: dict[str, Any], # Властивості словника можуть бути довільними
    ) -> RiskScore:
        """Розрахунок AML-скору для сутності."""
        factors = []

        # 1. Перевірка санкцій
        sanctions_factor = await self._check_sanctions(data)
        factors.append(sanctions_factor)

        # 2. Перевірка кримінальних справ
        criminal_factor = await self._check_criminal_cases(data)
        factors.append(criminal_factor)

        # 3. Перевірка податкових боргів
        tax_factor = await self._check_tax_debts(data)
        factors.append(tax_factor)

        # 4. Перевірка офшорних зв'язків
        offshore_factor = await self._check_offshore_connections(data)
        factors.append(offshore_factor)

        # 5. Перевірка ознак фіктивності
        shell_factor = await self._check_shell_company_signs(data)
        factors.append(shell_factor)

        # 6. Перевірка змін керівництва
        management_factor = await self._check_management_changes(data)
        factors.append(management_factor)

        # 7. Перевірка масової реєстрації
        registration_factor = await self._check_mass_registration(data)
        factors.append(registration_factor)

        # 8. Перевірка PEP
        pep_factor = await self._check_pep_status(data)
        factors.append(pep_factor)

        # 9. Перевірка бенефіціарної власності
        beneficial_factor = await self._check_beneficial_ownership(data)
        factors.append(beneficial_factor)

        # 10. Фінансові показники
        financial_factor = await self._check_financial_indicators(data)
        factors.append(financial_factor)

        # Розрахунок загального скору
        total_score = self._calculate_total_score(factors)
        risk_level = self._get_risk_level(total_score)
        recommendations = self._generate_recommendations(factors)

        return RiskScore(
            entity_id=entity_id,
            entity_name=entity_name,
            entity_type=entity_type,
            total_score=total_score,
            risk_level=risk_level,
            factors=factors,
            recommendations=recommendations,
        )

    def _calculate_total_score(self, factors: list[RiskFactor]) -> int:
        """Розрахунок загального скору."""
        total = 0
        max_possible = 0

        for factor in factors:
            max_possible += factor.weight
            if factor.detected:
                total += factor.weight

        # Нормалізація до 0-100
        normalized_score = int(total / max_possible * 100) if max_possible > 0 else 0

        return min(100, normalized_score)

    async def _check_sanctions(self, data: dict[str, Any]) -> RiskFactor: # Властивості словника можуть бути довільними
        """Перевірка санкційних списків."""
        sanctions_data = data.get("sanctions", {})
        is_sanctioned = sanctions_data.get("is_sanctioned", False)

        return RiskFactor(
            category=RiskCategory.SANCTIONS,
            name="Санкційні списки",
            description="Наявність у санкційних списках (РНБО, OFAC, EU, UK)",
            weight=self.RISK_WEIGHTS[RiskCategory.SANCTIONS],
            detected=is_sanctioned,
            details={
                "lists": sanctions_data.get("lists", []),
                "date_added": sanctions_data.get("date_added"),
                "reason": sanctions_data.get("reason"),
            },
            source="sanctions_registry",
        )

    async def _check_criminal_cases(self, data: dict[str, Any]) -> RiskFactor: # Властивості словника можуть бути довільними
        """Перевірка кримінальних справ."""
        court_cases = data.get("court_cases", [])

        # Фільтруємо справи про контрабанду
        smuggling_cases = []
        for case in court_cases:
            case_text = (case.get("description", "") + " " + case.get("decision", "")).lower()
            if any(keyword in case_text for keyword in SMUGGLING_KEYWORDS):
                smuggling_cases.append(case)

        return RiskFactor(
            category=RiskCategory.CRIMINAL,
            name="Кримінальні справи",
            description="Участь у судових справах про контрабанду та митні порушення",
            weight=self.RISK_WEIGHTS[RiskCategory.CRIMINAL],
            detected=len(smuggling_cases) > 0,
            details={
                "total_cases": len(court_cases),
                "smuggling_cases": len(smuggling_cases),
                "cases": smuggling_cases[:5],  # Перші 5
            },
            source="court_registry",
        )

    async def _check_tax_debts(self, data: dict[str, Any]) -> RiskFactor: # Властивості словника можуть бути довільними
        """Перевірка податкових боргів."""
        tax_data = data.get("tax", {})
        debt_amount = tax_data.get("debt_amount", 0)
        threshold = 1_000_000  # 1 млн грн

        return RiskFactor(
            category=RiskCategory.TAX,
            name="Податкові борги",
            description="Податкові борги понад 1 млн грн",
            weight=self.RISK_WEIGHTS[RiskCategory.TAX],
            detected=debt_amount > threshold,
            details={
                "debt_amount": debt_amount,
                "threshold": threshold,
                "debt_date": tax_data.get("debt_date"),
                "is_restructured": tax_data.get("is_restructured", False),
            },
            source="tax_registry",
        )

    async def _check_offshore_connections(self, data: dict[str, Any]) -> RiskFactor: # Властивості словника можуть бути довільними
        """Перевірка офшорних зв'язків."""
        founders = data.get("founders", [])
        beneficiaries = data.get("beneficiaries", [])

        offshore_connections = []

        for entity in founders + beneficiaries:
            country = entity.get("country", "").upper()
            if country in OFFSHORE_JURISDICTIONS:
                offshore_connections.append({
                    "name": entity.get("name"),
                    "country": country,
                    "jurisdiction": OFFSHORE_JURISDICTIONS[country],
                    "role": "founder" if entity in founders else "beneficiary",
                })

        return RiskFactor(
            category=RiskCategory.OFFSHORE,
            name="Офшорні зв'язки",
            description="Зв'язки з офшорними юрисдикціями",
            weight=self.RISK_WEIGHTS[RiskCategory.OFFSHORE],
            detected=len(offshore_connections) > 0,
            details={
                "connections_count": len(offshore_connections),
                "connections": offshore_connections,
                "jurisdictions": list({c["country"] for c in offshore_connections}),
            },
            source="edr",
        )

    async def _check_shell_company_signs(self, data: dict[str, Any]) -> RiskFactor: # Властивості словника можуть бути довільними
        """Перевірка ознак фіктивної компанії."""
        signs = []

        # Нульова звітність
        if data.get("financial", {}).get("zero_reporting", False):
            signs.append("Нульова звітність")

        # Відсутність працівників
        employees = data.get("employees_count", 0)
        if employees == 0:
            signs.append("Відсутність працівників")

        # Статутний капітал = мінімальний
        capital = data.get("authorized_capital", 0)
        if capital <= 1000:
            signs.append("Мінімальний статутний капітал")

        # Відсутність активів
        if data.get("financial", {}).get("total_assets", 0) == 0:
            signs.append("Відсутність активів")

        # Масовий директор
        if data.get("director", {}).get("is_mass_director", False):
            signs.append("Масовий директор")

        return RiskFactor(
            category=RiskCategory.SHELL_COMPANY,
            name="Ознаки фіктивності",
            description="Ознаки фіктивної компанії (shell company)",
            weight=self.RISK_WEIGHTS[RiskCategory.SHELL_COMPANY],
            detected=len(signs) >= 2,  # 2+ ознаки
            details={
                "signs_count": len(signs),
                "signs": signs,
            },
            source="edr",
        )

    async def _check_management_changes(self, data: dict[str, Any]) -> RiskFactor: # Властивості словника можуть бути довільними
        """Перевірка частоти зміни керівництва."""
        management_history = data.get("management_history", [])

        # Рахуємо зміни за останні 2 роки
        recent_changes = len([
            m for m in management_history
            if m.get("year", 0) >= datetime.now(UTC).year - 2
        ])

        return RiskFactor(
            category=RiskCategory.MANAGEMENT,
            name="Зміни керівництва",
            description="Часта зміна керівників/засновників (>3 за 2 роки)",
            weight=self.RISK_WEIGHTS[RiskCategory.MANAGEMENT],
            detected=recent_changes > 3,
            details={
                "changes_count": recent_changes,
                "period": "2 роки",
                "history": management_history[:10],
            },
            source="edr",
        )

    async def _check_mass_registration(self, data: dict[str, Any]) -> RiskFactor: # Властивості словника можуть бути довільними
        """Перевірка масової реєстрації на одну адресу."""
        address_data = data.get("address", {})
        companies_at_address = address_data.get("companies_count", 1)

        return RiskFactor(
            category=RiskCategory.REGISTRATION,
            name="Масова реєстрація",
            description="Масова реєстрація на одну адресу (>10 компаній)",
            weight=self.RISK_WEIGHTS[RiskCategory.REGISTRATION],
            detected=companies_at_address > 10,
            details={
                "companies_count": companies_at_address,
                "address": address_data.get("address"),
                "is_virtual_office": address_data.get("is_virtual_office", False),
            },
            source="edr",
        )

    async def _check_pep_status(self, data: dict[str, Any]) -> RiskFactor: # Властивості словника можуть бути довільними
        """Перевірка статусу PEP (Politically Exposed Person)."""
        pep_data = data.get("pep", {})
        is_pep = pep_data.get("is_pep", False)

        return RiskFactor(
            category=RiskCategory.PEP,
            name="Політично значуща особа",
            description="Статус PEP (Politically Exposed Person)",
            weight=self.RISK_WEIGHTS[RiskCategory.PEP],
            detected=is_pep,
            details={
                "pep_level": pep_data.get("level"),  # national, regional, local
                "position": pep_data.get("position"),
                "related_peps": pep_data.get("related_peps", []),
            },
            source="pep_registry",
        )

    async def _check_beneficial_ownership(self, data: dict[str, Any]) -> RiskFactor: # Властивості словника можуть бути довільними
        """Перевірка бенефіціарної власності."""
        beneficiaries = data.get("beneficiaries", [])

        issues = []

        # Відсутність бенефіціарів
        if len(beneficiaries) == 0:
            issues.append("Бенефіціари не вказані")

        # Номінальні власники
        for ben in beneficiaries:
            if ben.get("is_nominee", False):
                issues.append(f"Номінальний власник: {ben.get('name')}")

        # Складна структура (>3 рівні)
        max_level = max([ben.get("ownership_level", 1) for ben in beneficiaries], default=1)
        if max_level > 3:
            issues.append(f"Складна структура власності ({max_level} рівнів)")

        return RiskFactor(
            category=RiskCategory.BENEFICIAL_OWNERSHIP,
            name="Бенефіціарна власність",
            description="Проблеми з прозорістю бенефіціарної власності",
            weight=self.RISK_WEIGHTS[RiskCategory.BENEFICIAL_OWNERSHIP],
            detected=len(issues) > 0,
            details={
                "issues": issues,
                "beneficiaries_count": len(beneficiaries),
                "max_ownership_level": max_level,
            },
            source="edr",
        )

    async def _check_financial_indicators(self, data: dict[str, Any]) -> RiskFactor: # Властивості словника можуть бути довільними
        """Перевірка фінансових показників."""
        financial = data.get("financial", {})

        issues = []

        # Збиткова діяльність
        if financial.get("net_income", 0) < 0:
            issues.append("Збиткова діяльність")

        # Різке зростання оборотів (>500%)
        revenue_growth = financial.get("revenue_growth_percent", 0)
        if revenue_growth > 500:
            issues.append(f"Різке зростання оборотів ({revenue_growth}%)")

        # Невідповідність активів та оборотів
        assets = financial.get("total_assets", 0)
        revenue = financial.get("revenue", 0)
        if assets > 0 and revenue > 0:
            ratio = revenue / assets
            if ratio > 100:  # Оборот в 100+ разів більший за активи
                issues.append("Невідповідність активів та оборотів")

        return RiskFactor(
            category=RiskCategory.FINANCIAL,
            name="Фінансові показники",
            description="Аномальні фінансові показники",
            weight=self.RISK_WEIGHTS[RiskCategory.FINANCIAL],
            detected=len(issues) > 0,
            details={
                "issues": issues,
                "net_income": financial.get("net_income"),
                "revenue": financial.get("revenue"),
                "total_assets": financial.get("total_assets"),
            },
            source="financial_statements",
        )

    async def batch_calculate(
        self,
        entities: list[dict[str, Any]], # Властивості словника можуть бути довільними
    ) -> list[RiskScore]:
        """Пакетний розрахунок скорів."""
        results = []

        for entity in entities:
            score = await self.calculate_score(
                entity_id=entity.get("id", ""),
                entity_name=entity.get("name", ""),
                entity_type=entity.get("type", "organization"),
                data=entity.get("data", {}),
            )
            results.append(score)

        return results

    def get_risk_distribution(self, scores: list[RiskScore]) -> dict[str, int]: # Властивості словника можуть бути довільними
        """Розподіл ризиків."""
        distribution = {level.value: 0 for level in RiskLevel}

        for score in scores:
            distribution[score.risk_level.value] += 1

        return distribution
