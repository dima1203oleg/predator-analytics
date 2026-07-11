import pytest
from unittest.mock import MagicMock
from app.services.risk.risk_service import RiskService
from app.models.risk import RiskAssessment
from app.models.company import Company

@pytest.fixture
def mock_db_session():
    mock_session = MagicMock()
    mock_session.get.return_value = Company(
        id="test_company",
        debt_to_equity=0.7,
        has_sanctions=False
    )
    mock_session.commit.return_value = None
    return mock_session

@pytest.mark.asyncio
async def test_assess_risk_success(mock_db_session):
    # Mock redis_client.get
    redis_client = MagicMock()
    redis_client.get.return_value = None
    redis_client.setex.return_value = None

    # Mock calculate_risk_score and _get_risk_level
    RiskService._calculate_risk_score = MagicMock(return_value=0.6)
    RiskService._get_risk_level = MagicMock(return_value="medium")

    assessment = await RiskService.assess_risk("test_company")

    assert assessment is not None
    assert assessment.company_id == "test_company"
    assert assessment.risk_score == 0.6
    assert assessment.risk_level == "medium"

@pytest.mark.asyncio
async def test_assess_risk_company_not_found():
    # Mock redis_client.get
    redis_client = MagicMock()
    redis_client.get.return_value = None

    # Mock db_session to return None for company
    mock_session = MagicMock()
    mock_session.get.return_value = None
    mock_db_session = mock_session # Assign to mock_db_session for consistency

    assessment = await RiskService.assess_risk("non_existent_company")

    assert assessment is None

@pytest.mark.asyncio
async def test_assess_risk_cached(mock_db_session):
    # Mock redis_client.get to return cached data
    redis_client = MagicMock()
    cached_data = RiskAssessment(company_id="test_company", risk_score=0.7, risk_level="medium")
    redis_client.get.return_value = cached_data.json().encode('utf-8')

    assessment = await RiskService.assess_risk("test_company")

    assert assessment is not None
    assert assessment.company_id == "test_company"
    assert assessment.risk_score == 0.7
    assert assessment.risk_level == "medium"
    # Ensure db_session was not called
    mock_db_session.get.assert_not_called()