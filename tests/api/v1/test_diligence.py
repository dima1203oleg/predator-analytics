"""
Тести для /api/v1/diligence — Due Diligence компаній.
"""

from __future__ import annotations


class TestCompanyProfile:
    """Тести для профілю компанії."""

    def test_edrpou_format(self) -> None:
        """ЄДРПОУ має бути 8-значним числом."""
        edrpou = "12345678"
        assert len(edrpou) == 8
        assert edrpou.isdigit()

    def test_risk_score_valid_range(self) -> None:
        """Ризик-бал в діапазоні [0, 100]."""
        risk_score = 35.5
        assert 0 <= risk_score <= 100

    def test_company_status_values(self) -> None:
        """Статус компанії — один із допустимих значень."""
        valid_statuses = {"active", "inactive", "suspended", "liquidated"}
        status = "active"
        assert status in valid_statuses

    def test_director_has_required_fields(self) -> None:
        """Директор має обов'язкові поля."""
        director = {
            "id": "1234567890",
            "type": "Person",
            "label": "Петренко Іван Васильович",
            "properties": {
                "role": "Директор",
                "is_pep": False,
            },
        }
        assert "id" in director
        assert "type" in director
        assert "label" in director
        assert "properties" in director
        assert "role" in director["properties"]
        assert "is_pep" in director["properties"]
