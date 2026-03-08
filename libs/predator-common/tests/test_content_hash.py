"""Тести для content hash (дедуплікація)."""

import pytest
from predator_common.content_hash import compute_content_hash, compute_declaration_hash


class TestComputeContentHash:
    """Тести для compute_content_hash."""

    def test_returns_64_char_hex(self) -> None:
        """Хеш має бути 64-символьний hex."""
        result = compute_content_hash({"edrpou": "12345678", "name": "ТОВ Ромашка"})
        assert len(result) == 64
        assert all(c in "0123456789abcdef" for c in result)

    def test_deterministic(self) -> None:
        """Однаковий вхід → однаковий хеш."""
        data = {"edrpou": "12345678", "name": "ТОВ Ромашка"}
        assert compute_content_hash(data) == compute_content_hash(data)

    def test_key_order_independent(self) -> None:
        """Порядок ключів не впливає на хеш."""
        data1 = {"edrpou": "12345678", "name": "ТОВ Ромашка"}
        data2 = {"name": "ТОВ Ромашка", "edrpou": "12345678"}
        assert compute_content_hash(data1) == compute_content_hash(data2)

    def test_none_values_excluded(self) -> None:
        """None значення ігноруються."""
        data1 = {"edrpou": "12345678", "name": "ТОВ Ромашка"}
        data2 = {"edrpou": "12345678", "name": "ТОВ Ромашка", "phone": None}
        assert compute_content_hash(data1) == compute_content_hash(data2)

    def test_empty_string_excluded(self) -> None:
        """Порожні рядки ігноруються."""
        data1 = {"edrpou": "12345678", "name": "ТОВ Ромашка"}
        data2 = {"edrpou": "12345678", "name": "ТОВ Ромашка", "phone": ""}
        assert compute_content_hash(data1) == compute_content_hash(data2)

    def test_different_data_gives_different_hash(self) -> None:
        """Різні дані → різний хеш."""
        data1 = {"edrpou": "12345678", "name": "ТОВ Ромашка"}
        data2 = {"edrpou": "87654321", "name": "ПАТ Укрімпекс"}
        assert compute_content_hash(data1) != compute_content_hash(data2)

    def test_empty_dict(self) -> None:
        """Порожній словник обробляється без помилок."""
        result = compute_content_hash({})
        assert len(result) == 64


class TestComputeDeclarationHash:
    """Тести для compute_declaration_hash."""

    def test_basic_hash(self) -> None:
        """Базовий хеш декларації."""
        result = compute_declaration_hash(
            declaration_number="UA100020/240115/0001234",
            declaration_date="2024-01-15",
            uktzed_code="9403600000",
            importer_edrpou="12345678",
            invoice_value_usd=45000.00,
        )
        assert len(result) == 64

    def test_same_declaration_same_hash(self) -> None:
        """Однакова декларація → однаковий хеш."""
        kwargs = {
            "declaration_number": "UA100020/240115/0001234",
            "declaration_date": "2024-01-15",
            "uktzed_code": "9403600000",
            "importer_edrpou": "12345678",
            "invoice_value_usd": 45000.00,
        }
        assert compute_declaration_hash(**kwargs) == compute_declaration_hash(**kwargs)
