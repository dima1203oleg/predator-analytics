"""Тести PDF Parser — PREDATOR Analytics v61.0-ELITE."""
from __future__ import annotations

import pytest

from app.parsers.pdf_parser import PDFParser


class TestPDFParser:
    """Unit-тести для PDFParser (без залежності від PyMuPDF)."""

    @pytest.mark.asyncio
    async def test_extract_text_no_pymupdf(self, monkeypatch):
        """Якщо PyMuPDF не встановлено — повертаємо порожній рядок."""
        monkeypatch.setattr("app.parsers.pdf_parser.PYMUPDF_AVAILABLE", False)
        result = await PDFParser.extract_text("/fake/path.pdf")
        assert result == ""

    @pytest.mark.asyncio
    async def test_parse_to_schema_no_text(self, monkeypatch):
        """Якщо текст не вилучено — повертаємо порожню схему."""
        monkeypatch.setattr("app.parsers.pdf_parser.PYMUPDF_AVAILABLE", False)
        result = await PDFParser.parse_to_schema("/fake/path.pdf")
        assert result["raw_text"] == ""
        assert result["entities"] == {}

    def test_regex_patterns(self):
        """Перевірка regex для вилучення сутностей."""
        sample_text = (
            "ЄДРПОУ 12345678, декларація UA-01/2024/1234, "
            "сума $ 1 234.56 та 5 000 грн, дата 15.04.2024, "
            "HS-код 8517123456, країна Україна"
        )
        edrpou = __import__("re").findall(r"\b\d{8}\b", sample_text)
        assert "12345678" in edrpou

        decl = __import__("re").findall(r"[A-Z]{2}-\d{2,4}/\d{4}/\d+", sample_text)
        assert "UA-01/2024/1234" in decl

        dates = __import__("re").findall(r"\b\d{2}[./-]\d{2}[./-]\d{4}\b", sample_text)
        assert "15.04.2024" in dates

    def test_metadata_defaults(self):
        """Перевірка значень за замовчуванням."""
        assert PDFParser.OCR_DPI == 300
        assert PDFParser.MIN_TEXT_LEN_FOR_OCR == 20


class TestTelegramParser:
    """Unit-тести для TelegramParser."""

    def test_parse_message_full(self):
        """Повний тест вилучення сутностей."""
        from app.parsers.telegram_parser import TelegramParser

        text = (
            "@admin Повідомлення від ТОВ «Енерджи-Груп» (ЄДРПОУ 12345678). "
            "Контакт: +380 50 123 45 67, email: info@energy.com.ua. "
            "Дата поставки: 20.05.2024. Сума: $ 45 000 та 1 850 000 грн. "
            "Адреса: м. Київ, вул. Хрещатик, 1. #митниця #ризик"
        )

        result = TelegramParser.parse_message(text)

        assert "12345678" in result["edrpous"]
        assert "info@energy.com.ua" in result["emails"]
        assert "20.05.2024" in result["dates"]
        assert any("$" in a for a in result["amounts_usd"])
        assert any("грн" in a for a in result["amounts_uah"])
        assert result["summary"]["has_company_ref"] is True
        assert result["summary"]["has_risk_keywords"] is True
        assert result["summary"]["language"] == "uk"

    def test_clean_text(self):
        """Тест очищення тексту."""
        from app.parsers.telegram_parser import TelegramParser

        raw = "  Привіт   світ!!!   \n\n  #новина  "
        cleaned = TelegramParser.clean_text(raw)
        assert "  " not in cleaned
        assert "\n" not in cleaned
        assert "!!!" not in cleaned

    def test_empty_text(self):
        """Порожній текст — порожній результат."""
        from app.parsers.telegram_parser import TelegramParser

        assert TelegramParser.parse_message("") == {}
        assert TelegramParser.parse_message(None) == {}

    def test_risk_detection(self):
        """Виявлення ризикових ключових слів."""
        from app.parsers.telegram_parser import TelegramParser

        text = "Виявлено фрод у поставці електроніки. Підозра на контрабанду."
        result = TelegramParser.parse_message(text)
        assert result["summary"]["has_risk_keywords"] is True

    def test_language_detection(self):
        """Визначення мови повідомлення."""
        from app.parsers.telegram_parser import TelegramParser

        uk = "Це українське повідомлення з підозрою"
        en = "This is an English message about customs"
        assert TelegramParser.parse_message(uk)["summary"]["language"] == "uk"
        assert TelegramParser.parse_message(en)["summary"]["language"] == "en"
        assert TelegramParser.parse_message("123")["summary"]["language"] == "unknown"
