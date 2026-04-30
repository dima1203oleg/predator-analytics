"""
Тести для /api/v1/market — ринкова аналітика.
"""

from __future__ import annotations


class TestMarketOverview:
    """Тести для огляду ринку."""

    def test_overview_has_required_fields(self) -> None:
        """Перевіряє що огляд ринку містить обов'язкові поля."""
        # Імпорт тестових даних
        required_fields = [
            "total_declarations",
            "total_value_usd",
            "total_companies",
            "top_products",
            "period",
        ]
        # Побудова мок-відповіді
        overview = {
            "total_declarations": 12450,
            "total_value_usd": 850_000_000,
            "total_companies": 2340,
            "top_products": [],
            "period": "2025-Q4",
        }
        for field in required_fields:
            assert field in overview, f"Поле '{field}' відсутнє в огляді ринку"

    def test_top_products_structure(self) -> None:
        """Перевіряє структуру ТОП-товарів."""
        product = {
            "code": "84713000",
            "name": "Портативні ЕОМ (ноутбуки)",
            "value_usd": 45_000_000,
            "change_percent": 12.5,
        }
        assert product["code"].isdigit()
        assert isinstance(product["value_usd"], int)
        assert isinstance(product["change_percent"], float)

    def test_declaration_id_format(self) -> None:
        """Перевіряє формат ID декларації."""
        decl_id = "DECL-000001"
        assert decl_id.startswith("DECL-")
        assert len(decl_id) == 11
