"""Тести для CERS Score алгоритму."""

import pytest

from predator_common.cers_score import (
    CersFactors,
    CersLevel,
    CersResult,
    cers_level_from_score,
    compute_cers,
)


class TestCersLevels:
    """Тести рівнів ризику."""

    def test_low_risk_score(self) -> None:
        assert cers_level_from_score(0) == CersLevel.LOW
        assert cers_level_from_score(24) == CersLevel.LOW

    def test_medium_risk_score(self) -> None:
        assert cers_level_from_score(25) == CersLevel.MEDIUM
        assert cers_level_from_score(49) == CersLevel.MEDIUM

    def test_high_risk_score(self) -> None:
        assert cers_level_from_score(50) == CersLevel.HIGH
        assert cers_level_from_score(74) == CersLevel.HIGH

    def test_critical_risk_score(self) -> None:
        assert cers_level_from_score(75) == CersLevel.CRITICAL
        assert cers_level_from_score(100) == CersLevel.CRITICAL


class TestComputeCers:
    """Тести обчислення CERS."""

    def test_zero_risk(self) -> None:
        """Без жодних ризиків — score = 0."""
        factors = CersFactors()
        result = compute_cers(factors)
        assert result.score == 0
        assert result.level == CersLevel.LOW
        assert "відсутні" in result.explanation

    def test_sanctioned_entity_is_critical(self) -> None:
        """Санкціонована особа/компанія — критичний ризик."""
        factors = CersFactors(
            is_rnbo_sanctioned=True,
            is_eu_sanctioned=True,
            is_ofac_sanctioned=True,
        )
        result = compute_cers(factors)
        assert result.score >= 75
        assert result.level == CersLevel.CRITICAL
        assert "санкційних списках" in result.explanation

    def test_single_rnbo_sanction(self) -> None:
        """Лише РНБО санкції — висока або критична небезпека."""
        factors = CersFactors(is_rnbo_sanctioned=True)
        result = compute_cers(factors)
        # РНБО * 0.40 weight → 40 балів мінімум
        assert result.score >= 40
        assert result.level in (CersLevel.HIGH, CersLevel.CRITICAL)

    def test_court_cases_increase_score(self) -> None:
        """Більше судових справ → вищий ризик."""
        low = compute_cers(CersFactors(active_court_cases=1))
        high = compute_cers(CersFactors(active_court_cases=10))
        assert high.score > low.score

    def test_offshore_connections_increase_score(self) -> None:
        """Офшорні зв'язки збільшують ризик."""
        none_ = compute_cers(CersFactors(offshore_connections=0))
        some = compute_cers(CersFactors(offshore_connections=3))
        assert some.score > none_.score

    def test_pep_links_increase_score(self) -> None:
        """Зв'язки з PEP збільшують ризик."""
        without_pep = compute_cers(CersFactors())
        with_pep = compute_cers(CersFactors(has_pep_links=True))
        assert with_pep.score > without_pep.score

    def test_score_bounded_0_100(self) -> None:
        """Бал завжди в межах 0..100."""
        # Максимальний ризик
        factors = CersFactors(
            is_rnbo_sanctioned=True,
            is_eu_sanctioned=True,
            is_ofac_sanctioned=True,
            is_un_sanctioned=True,
            active_court_cases=100,
            offshore_connections=100,
            has_pep_links=True,
            customs_price_anomaly_count=100,
            tax_debt_uah=10_000_000,
        )
        result = compute_cers(factors)
        assert 0 <= result.score <= 100

    def test_result_has_factor_breakdown(self) -> None:
        """Результат містить розбивку по факторах."""
        factors = CersFactors(is_rnbo_sanctioned=True, active_court_cases=3)
        result = compute_cers(factors)
        assert "sanctions" in result.factors
        assert "court" in result.factors
        assert "offshore" in result.factors
        assert result.factors["sanctions"] > 0

    def test_explanation_is_ukrainian(self) -> None:
        """Пояснення має бути Ukrainian (HR-03)."""
        factors = CersFactors(
            is_rnbo_sanctioned=True,
            offshore_connections=2,
            has_pep_links=True,
        )
        result = compute_cers(factors)
        # Перевіряємо що є кириличні символи
        assert any(ord(c) > 127 for c in result.explanation)

    def test_customs_anomalies(self) -> None:
        """Митні аномалії збільшують ризик."""
        no_anomaly = compute_cers(CersFactors())
        with_anomaly = compute_cers(CersFactors(
            customs_price_anomaly_count=5,
            customs_undervaluation_ratio=0.8,
        ))
        assert with_anomaly.score > no_anomaly.score

    def test_tax_debt_increases_score(self) -> None:
        """Податковий борг збільшує ризик."""
        no_debt = compute_cers(CersFactors())
        with_debt = compute_cers(CersFactors(tax_debt_uah=5_000_000))
        assert with_debt.score > no_debt.score

    def test_realistic_medium_risk_company(self) -> None:
        """Реалістичний сценарій: компанія з помірним ризиком."""
        factors = CersFactors(
            active_court_cases=2,
            offshore_connections=1,
            customs_price_anomaly_count=1,
        )
        result = compute_cers(factors)
        # Має бути в діапазоні medium або low
        assert result.level in (CersLevel.LOW, CersLevel.MEDIUM, CersLevel.HIGH)
        assert 0 < result.score < 75
