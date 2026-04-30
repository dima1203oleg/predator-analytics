from __future__ import annotations

from datetime import datetime
from typing import Any

from fastapi.testclient import TestClient
import pytest

from app.api.v1.forecast import get_forecast_service
from app.core.database import get_db
from app.main import app


class DummyResult:
    def __init__(self, rows: list[tuple[datetime | None, float | None, str | None, str | None]]) -> None:
        self._rows = rows

    def all(self) -> list[tuple[datetime | None, float | None, str | None, str | None]]:
        return self._rows


class DummySession:
    def __init__(self, rows: list[tuple[datetime | None, float | None, str | None, str | None]]) -> None:
        self._rows = rows

    async def execute(self, stmt: Any) -> DummyResult:
        return DummyResult(self._rows)


async def dummy_db_with_rows(rows: list[tuple[datetime | None, float | None, str | None, str | None]]):
    yield DummySession(rows)


class StubForecastService:
    def __init__(self, response: dict[str, Any]) -> None:
        self.response = response
        self.received_history: list[dict[str, float | str]] | None = None
        self.received_kwargs: dict[str, Any] | None = None

    def predict_demand(
        self,
        *,
        product_code: str,
        product_name: str | None,
        country_code: str | None,
        history_data: list[dict[str, float | str]] | None,
        months_ahead: int,
        model_key: str,
    ) -> dict[str, Any]:
        self.received_history = history_data
        self.received_kwargs = {
            "product_code": product_code,
            "product_name": product_name,
            "country_code": country_code,
            "months_ahead": months_ahead,
            "model_key": model_key,
        }
        base = {
            "product_code": product_code,
            "product_name": product_name or product_code,
            "country_code": country_code,
            "model_used": model_key,
        }
        return base | self.response


@pytest.fixture(autouse=True)
def clear_overrides():
    app.dependency_overrides = {}
    yield
    app.dependency_overrides = {}


def test_forecast_demand_with_real_history():
    rows = [
        (datetime(2024, 1, 1), 10.0, "Ноутбуки", "UA"),
        (datetime(2024, 2, 1), 12.0, None, None),
    ]
    stub = StubForecastService(
        {
            "source": "real",
            "confidence_score": 0.9,
            "mape": 0.1,
            "data_points_used": 2,
            "forecast": [],
            "interpretation_uk": "Прогноз побудовано на реальних даних.",
        }
    )

    app.dependency_overrides[get_db] = lambda: dummy_db_with_rows(rows)
    app.dependency_overrides[get_forecast_service] = lambda: stub

    client = TestClient(app)
    response = client.post(
        "/api/v1/forecast/demand",
        json={"product_code": "84713000", "months_ahead": 2, "model": "prophet"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["source"] == "real"
    assert stub.received_history is not None and len(stub.received_history) == 2
    assert stub.received_kwargs == {
        "product_code": "84713000",
        "product_name": "Ноутбуки",
        "country_code": "UA",
        "months_ahead": 2,
        "model_key": "prophet",
    }


def test_forecast_demand_fallback_synthetic_when_no_history():
    rows: list[tuple[datetime | None, float | None, str | None, str | None]] = []
    stub = StubForecastService(
        {
            "source": "synthetic",
            "confidence_score": 0.85,
            "mape": 0.12,
            "data_points_used": 0,
            "forecast": [],
            "interpretation_uk": "Повернено синтетичний прогноз через брак даних.",
        }
    )

    app.dependency_overrides[get_db] = lambda: dummy_db_with_rows(rows)
    app.dependency_overrides[get_forecast_service] = lambda: stub

    client = TestClient(app)
    response = client.post(
        "/api/v1/forecast/demand",
        json={"product_code": "99999999", "months_ahead": 3, "model": "xgboost"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["source"] == "synthetic"
    assert stub.received_history == []
    assert data["product_code"] == "99999999"


def test_forecast_models_registry_exposed():
    client = TestClient(app)
    response = client.get("/api/v1/forecast/models")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data.get("models"), list)
    assert any(model.get("key") == "prophet" for model in data["models"])
    assert any(model.get("key") == "xgboost" for model in data["models"])
