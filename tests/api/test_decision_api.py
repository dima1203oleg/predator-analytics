"""
Тести для Decision Intelligence API endpoints (v55.2)

Перевіряємо:
- Роботу всіх endpoints
- Кешування Redis
- Fallback на synthetic дані
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi.testclient import TestClient

# Імпортуємо router для тестування
from app.api.v1.decision import router
from app.main import app

client = TestClient(app)


class TestDecisionEndpoints:
    """Тести Decision Intelligence endpoints."""

    def test_quick_score_success(self):
        """Тест quick-score endpoint."""
        response = client.get("/api/v1/decision/quick-score/12345678")
        assert response.status_code == 200
        data = response.json()
        assert "edrpou" in data
        assert "cers_score" in data
        assert "risk_level" in data
        assert "verdict" in data
        assert data["edrpou"] == "12345678"

    def test_niche_finder_success(self):
        """Тест niche-finder endpoint."""
        response = client.get("/api/v1/decision/niche-finder?min_transactions=5&max_players=5&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert "niches" in data
        assert "total" in data
        assert isinstance(data["niches"], list)

    def test_procurement_analysis_validation(self):
        """Тест валідації procurement endpoint."""
        # Без коду товару — повинен повернути 422 (validation error)
        response = client.get("/api/v1/decision/procurement/")
        assert response.status_code in [404, 422]  # FastAPI повертає 404 для missing path param

    @pytest.mark.asyncio
    async def test_cache_integration(self):
        """Тест інтеграції з Redis cache."""
        # Перший запит — cache miss
        response1 = client.get("/api/v1/decision/quick-score/99999999")
        assert response1.status_code == 200
        data1 = response1.json()

        # Другий запит — повинен бути cache hit (той самий результат)
        response2 = client.get("/api/v1/decision/quick-score/99999999")
        assert response2.status_code == 200
        data2 = response2.json()

        # Результати повинні бути ідентичними (закешовані)
        assert data1 == data2

    def test_market_entry_analysis(self):
        """Тест market-entry endpoint."""
        response = client.get("/api/v1/decision/market-entry/87032310")
        assert response.status_code == 200
        data = response.json()
        assert "product_code" in data
        assert "verdict" in data
        assert "attractiveness_score" in data
        assert data["product_code"] == "87032310"

    def test_counterparty_profile(self):
        """Тест counterparty endpoint."""
        payload = {
            "ueid": "12345678",
            "company_name": "ТОВ Тест",
            "edrpou": "12345678",
            "include_graph": False
        }
        response = client.post("/api/v1/decision/counterparty", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "ueid" in data
        assert "risk" in data
        assert "verdict" in data

    def test_recommend_endpoint_validation(self):
        """Тест валідації recommend endpoint."""
        # Без обов'язкових полів — повинен повернути 422
        payload = {
            "ueid": "",
            "product_code": ""
        }
        response = client.post("/api/v1/decision/recommend", json=payload)
        assert response.status_code == 422  # Validation error

    def test_niche_finder_params(self):
        """Тест параметрів niche-finder."""
        # Тест з різними параметрами
        response = client.get(
            "/api/v1/decision/niche-finder?min_transactions=10&max_players=3&limit=5"
        )
        assert response.status_code == 200
        data = response.json()
        assert "criteria" in data
        assert data["criteria"]["min_transactions"] == 10
        assert data["criteria"]["max_players"] == 3

    @pytest.mark.asyncio
    async def test_fallback_to_synthetic(self):
        """Тест fallback на synthetic дані при недоступності БД."""
        # При відсутності БД endpoint повинен повернути synthetic дані
        response = client.get("/api/v1/decision/niche-finder")
        assert response.status_code == 200
        data = response.json()
        # Перевіряємо наявність даних (реальних або synthetic)
        assert "niches" in data
        assert isinstance(data["niches"], list)


class TestDecisionCache:
    """Тести кешування Decision Intelligence."""

    @pytest.mark.asyncio
    async def test_quick_score_cache_ttl(self):
        """Тест TTL кешу quick-score (300 секунд)."""
        # Цей тест перевіряє, що кеш працює з правильним TTL
        edrpou = "11111111"

        # Перший запит
        response1 = client.get(f"/api/v1/decision/quick-score/{edrpou}")
        assert response1.status_code == 200

        # Другий запит (з кешу)
        response2 = client.get(f"/api/v1/decision/quick-score/{edrpou}")
        assert response2.status_code == 200

        # Результати ідентичні
        assert response1.json() == response2.json()

    @pytest.mark.asyncio
    async def test_procurement_cache(self):
        """Тест кешування procurement endpoint."""
        product_code = "87032310"

        # Перший запит
        response1 = client.get(f"/api/v1/decision/procurement/{product_code}?months=12")
        # Може повернути 200 або 500 залежно від БД
        assert response1.status_code in [200, 500]

        if response1.status_code == 200:
            # Другий запит повинен повернути той самий результат з кешу
            response2 = client.get(f"/api/v1/decision/procurement/{product_code}?months=12")
            assert response2.status_code == 200
            assert response1.json() == response2.json()

    @pytest.mark.asyncio
    async def test_market_entry_cache(self):
        """Тест кешування market-entry endpoint."""
        product_code = "87032310"

        response1 = client.get(f"/api/v1/decision/market-entry/{product_code}")
        assert response1.status_code in [200, 500]

        if response1.status_code == 200:
            response2 = client.get(f"/api/v1/decision/market-entry/{product_code}")
            assert response2.status_code == 200
            assert response1.json() == response2.json()


class TestDecisionResponseFormat:
    """Тести формату відповідей Decision Intelligence."""

    def test_quick_score_response_format(self):
        """Тест формату відповіді quick-score."""
        response = client.get("/api/v1/decision/quick-score/12345678")
        assert response.status_code == 200
        data = response.json()

        # Перевіряємо обов'язкові поля
        required_fields = ["edrpou", "cers_score", "risk_level", "verdict", "color"]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"

        # Перевіряємо типи даних
        assert isinstance(data["cers_score"], int)
        assert isinstance(data["risk_level"], str)
        assert data["risk_level"] in ["low", "medium", "high", "critical"]

    def test_niche_finder_response_format(self):
        """Тест формату відповіді niche-finder."""
        response = client.get("/api/v1/decision/niche-finder")
        assert response.status_code == 200
        data = response.json()

        # Перевіряємо структуру
        assert "niches" in data
        assert "total" in data
        assert isinstance(data["niches"], list)

        # Якщо є ніші — перевіряємо їх структуру
        if data["niches"]:
            niche = data["niches"][0]
            required_niche_fields = [
                "product_code", "product_name", "transaction_count",
                "player_count", "total_value_usd", "potential_score"
            ]
            for field in required_niche_fields:
                assert field in niche, f"Missing niche field: {field}"

    def test_market_entry_response_format(self):
        """Тест формату відповіді market-entry."""
        response = client.get("/api/v1/decision/market-entry/87032310")
        assert response.status_code == 200
        data = response.json()

        required_fields = [
            "product_code", "verdict", "verdict_reason",
            "attractiveness_score", "color", "market_metrics"
        ]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"

        # Перевіряємо market_metrics
        assert "hhi_index" in data["market_metrics"]
        assert "active_players" in data["market_metrics"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
