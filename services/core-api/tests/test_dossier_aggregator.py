import pytest

from app.services.osint.collectors.base import Classification, DataFragment
from app.services.osint.dossier_aggregator import DossierAggregator


@pytest.fixture
def aggregator():
    # Provide dummy dependencies or None since we only test a pure-ish method
    return DossierAggregator()

def test_assess_risk_sanctions_interpol(aggregator):
    fragments = [
        DataFragment(
            category="sanctions",
            source_name="RNBO",
            classification=Classification.BLACK,
            data={"is_sanctioned": True},
            confidence=1.0
        ),
        DataFragment(
            category="interpol",
            source_name="Interpol Red Notices",
            classification=Classification.BLACK,
            data={"is_wanted": True},
            confidence=1.0
        )
    ]
    score, factors, breakdown, level = aggregator._assess_risk(fragments)

    assert score == 75 # 40 + 35
    assert level == "CRITICAL"
    assert "sanctions" in breakdown
    assert "interpol" in breakdown

def test_assess_risk_crypto_whales(aggregator):
    fragments = [
        DataFragment(
            category="blockchain_btc",
            source_name="BTC Node",
            classification=Classification.GREY,
            data={"balance_btc": 2.5},
            confidence=1.0
        )
    ]
    score, factors, breakdown, level = aggregator._assess_risk(fragments)

    assert score == 25
    assert level == "ELEVATED"
    assert "crypto_btc" in breakdown
    assert "🟠 Великий баланс BTC: 2.50 BTC" in factors

def test_assess_risk_telegram_social_media(aggregator):
    fragments = [
        DataFragment(
            category="telegram",
            source_name="Telegram API",
            classification=Classification.GREY,
            data={"groups_found": [{"name": "hack forum", "risk": "HIGH"}]},
            confidence=1.0
        ),
        DataFragment(
            category="social_media",
            source_name="Social Media API",
            classification=Classification.GREY,
            data={},
            raw_records=[{"platform": "X", "suspicious_keyword_found": True}],
            confidence=1.0
        )
    ]
    score, factors, breakdown, level = aggregator._assess_risk(fragments)

    assert score == 25 # 15 + 10
    assert level == "ELEVATED"
    assert "telegram" in breakdown
    assert "social_media" in breakdown

def test_assess_risk_normalization(aggregator):
    # Test capping at 100
    fragments = [
        DataFragment(
            category="sanctions",
            source_name="RNBO",
            classification=Classification.BLACK,
            data={"is_sanctioned": True},
            confidence=1.0
        ),
        DataFragment(
            category="interpol",
            source_name="Interpol Red Notices",
            classification=Classification.BLACK,
            data={"is_wanted": True},
            confidence=1.0
        ),
        DataFragment(
            category="data_breaches",
            source_name="Leaks",
            classification=Classification.BLACK,
            data={"total_breaches": 10},
            confidence=1.0
        ),
        DataFragment(
            category="darknet",
            source_name="Darknet",
            classification=Classification.BLACK,
            data={"dark_web_mentions": ["post 1"]},
            confidence=1.0
        )
    ]
    score, factors, breakdown, level = aggregator._assess_risk(fragments)

    # 40 + 35 + 15 + 20 = 110, capped at 100
    assert score == 100
    assert level == "CRITICAL"
