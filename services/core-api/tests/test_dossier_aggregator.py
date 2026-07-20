"""Тести для DossierAggregator та нових колекторів.

Перевіряє:
- Оцінку ризику (_assess_risk) для різних категорій
- Нормалізацію рисків (обмеження 0-100)
- Нові колектори (Telegram, Social Media)
- Реєстрацію та фільтрацію збирачів
"""
import pytest

from app.services.osint.collectors.base import (
    Classification,
    CollectorResult,
    CollectorStatus,
    DataFragment,
    DossierQuery,
    EntityType,
)
from app.services.osint.dossier_aggregator import DossierAggregator


@pytest.fixture
def aggregator() -> DossierAggregator:
    """Створює DossierAggregator для тестів."""
    return DossierAggregator()


def _make_result(
    collector_name: str,
    fragments: list[DataFragment],
) -> CollectorResult:
    """Хелпер для побудови CollectorResult із фрагментами."""
    return CollectorResult(
        collector_name=collector_name,
        status=CollectorStatus.SUCCESS,
        classification=Classification.WHITE,
        started_at="2026-01-01T00:00:00",
        completed_at="2026-01-01T00:00:01",
        duration_ms=100,
        fragments=fragments,
    )


# ===================== _assess_risk: Санкції + Інтерпол =====================

class TestAssessRiskSanctionsInterpol:
    """Перевіряє розрахунок ризику для санкцій та Інтерполу."""

    def test_sanctions_add_40_points(self, aggregator: DossierAggregator) -> None:
        results = [_make_result("sanctions_collector", [
            DataFragment(
                category="sanctions",
                source_name="РНБО",
                classification=Classification.BLACK,
                data={"is_sanctioned": True},
                confidence=1.0,
            )
        ])]
        risk = aggregator._assess_risk(results)
        assert risk["composite_score"] == 40
        assert risk["risk_level"] == "ELEVATED"
        assert "sanctions" in risk["risk_breakdown"]

    def test_interpol_add_35_points(self, aggregator: DossierAggregator) -> None:
        results = [_make_result("interpol_collector", [
            DataFragment(
                category="interpol",
                source_name="Interpol Red Notices",
                classification=Classification.BLACK,
                data={"total_matches": 1},
                confidence=1.0,
            )
        ])]
        risk = aggregator._assess_risk(results)
        assert risk["composite_score"] == 35
        assert "interpol" in risk["risk_breakdown"]

    def test_sanctions_plus_interpol_equals_75(self, aggregator: DossierAggregator) -> None:
        results = [
            _make_result("sanctions_collector", [
                DataFragment(
                    category="sanctions",
                    source_name="РНБО",
                    classification=Classification.BLACK,
                    data={"is_sanctioned": True},
                    confidence=1.0,
                )
            ]),
            _make_result("interpol_collector", [
                DataFragment(
                    category="interpol",
                    source_name="Interpol",
                    classification=Classification.BLACK,
                    data={"total_matches": 2},
                    confidence=1.0,
                )
            ]),
        ]
        risk = aggregator._assess_risk(results)
        assert risk["composite_score"] == 75
        assert risk["risk_level"] == "HIGH"


# ===================== _assess_risk: Криптовалюти =====================

class TestAssessRiskCrypto:
    """Перевіряє розрахунок ризику для криптовалютних активів."""

    def test_btc_balance_above_1_adds_25(self, aggregator: DossierAggregator) -> None:
        results = [_make_result("blockchain_collector", [
            DataFragment(
                category="blockchain_btc",
                source_name="BTC Node",
                classification=Classification.GREY,
                data={"balance_btc": 2.5},
                confidence=1.0,
            )
        ])]
        risk = aggregator._assess_risk(results)
        assert risk["composite_score"] == 25
        assert risk["risk_level"] == "ELEVATED"
        assert "crypto_btc" in risk["risk_breakdown"]

    def test_btc_small_balance_adds_5(self, aggregator: DossierAggregator) -> None:
        results = [_make_result("blockchain_collector", [
            DataFragment(
                category="blockchain_btc",
                source_name="BTC Node",
                classification=Classification.GREY,
                data={"balance_btc": 0.3},
                confidence=1.0,
            )
        ])]
        risk = aggregator._assess_risk(results)
        assert risk["composite_score"] == 5
        assert risk["risk_level"] == "LOW"


# ===================== _assess_risk: Telegram та Social Media =====================

class TestAssessRiskTelegramSocial:
    """Перевіряє розрахунок ризику для Telegram та соцмереж."""

    def test_telegram_suspicious_channels_add_15(self, aggregator: DossierAggregator) -> None:
        results = [_make_result("telegram_collector", [
            DataFragment(
                category="telegram_mentions",
                source_name="Telegram OSINT",
                classification=Classification.GREY,
                data={"channels": [
                    {"name": "DarkMarket_UA", "sentiment": "NEGATIVE"},
                ]},
                confidence=1.0,
            )
        ])]
        risk = aggregator._assess_risk(results)
        assert risk["composite_score"] == 15
        assert risk["risk_level"] == "MODERATE"
        assert "telegram" in risk["risk_breakdown"]

    def test_social_profiles_add_5(self, aggregator: DossierAggregator) -> None:
        results = [_make_result("social_media_collector", [
            DataFragment(
                category="social_profiles",
                source_name="Social OSINT",
                classification=Classification.GREY,
                data={"profiles": [
                    {"platform": "LinkedIn", "name": "Test User"},
                ]},
                confidence=1.0,
            )
        ])]
        risk = aggregator._assess_risk(results)
        assert risk["composite_score"] == 5
        assert risk["risk_level"] == "LOW"
        assert "social_media" in risk["risk_breakdown"]


# ===================== _assess_risk: Нормалізація =====================

class TestAssessRiskNormalization:
    """Перевіряє нормалізацію ризик-скору до 0-100."""

    def test_score_capped_at_100(self, aggregator: DossierAggregator) -> None:
        """40 (sanctions) + 35 (interpol) + 15 (leaks) + 20 (darknet) = 110 → 100."""
        results = [
            _make_result("sanctions", [
                DataFragment(category="sanctions", source_name="РНБО", classification=Classification.BLACK, data={"is_sanctioned": True}, confidence=1.0)
            ]),
            _make_result("interpol", [
                DataFragment(category="interpol", source_name="Interpol", classification=Classification.BLACK, data={"total_matches": 1}, confidence=1.0)
            ]),
            _make_result("leaks", [
                DataFragment(category="data_breaches", source_name="Leaks", classification=Classification.BLACK, data={"total_breaches": 10}, confidence=1.0)
            ]),
            _make_result("darknet", [
                DataFragment(category="darknet", source_name="Darknet", classification=Classification.BLACK, data={"dark_web_mentions": ["post1"]}, confidence=1.0)
            ]),
        ]
        risk = aggregator._assess_risk(results)
        assert risk["composite_score"] == 100
        assert risk["risk_level"] == "CRITICAL"


# ===================== Реєстрація збирачів =====================

class TestCollectorRegistration:
    """Перевіряє коректну реєстрацію всіх збирачів."""

    def test_all_collectors_registered(self, aggregator: DossierAggregator) -> None:
        status = aggregator.get_collectors_status()
        names = [c["name"] for c in status]
        # Перевіряємо що нові збирачі присутні
        assert "telegram_collector" in names
        assert "social_media_collector" in names
        assert "blockchain_collector" in names
        assert "leak_collector" in names
        assert "interpol_collector" in names

    def test_minimum_collectors_count(self, aggregator: DossierAggregator) -> None:
        status = aggregator.get_collectors_status()
        # Повинно бути >= 18 збирачів (WHITE + GREY + BLACK)
        assert len(status) >= 18


# ===================== Рекомендації =====================

class TestRecommendations:
    """Перевіряє рекомендації для різних рівнів ризику."""

    def test_critical_recommendation(self, aggregator: DossierAggregator) -> None:
        rec = aggregator._get_recommendation("CRITICAL")
        assert "НЕГАЙНЕ РЕАГУВАННЯ" in rec

    def test_low_recommendation(self, aggregator: DossierAggregator) -> None:
        rec = aggregator._get_recommendation("LOW")
        assert "ЧИСТО" in rec
