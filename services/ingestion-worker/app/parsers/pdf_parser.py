"""PDF Parser — PREDATOR Analytics v61.0-ELITE Ironclad.

Вилучення тексту з PDF для митних декларацій та супровідних документів.
Стратегія:
  1. Спроба вилучити вбудований текст через PyMuPDF (fitz).
  2. Якщо сторінка сканована (немає текстового шару) → OCR через pytesseract.
  3. Структуризація вилученого тексту в схему митного документа.
"""
from __future__ import annotations

import io
import logging
from pathlib import Path
import re
from typing import Any

try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

try:
    import pytesseract
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False

logger = logging.getLogger("pdf_parser")


class PDFParser:
    """Парсер PDF документів з підтримкою OCR."""

    # ─── Константи ──────────────────────────────────────────────────────────

    OCR_DPI: int = 300
    MIN_TEXT_LEN_FOR_OCR: int = 20  # Якщо текст < 20 символів — викликаємо OCR

    # ─── Основні методи ─────────────────────────────────────────────────────

    @staticmethod
    async def extract_text(file_path: str, *, force_ocr: bool = False) -> str:
        """Вилучення тексту з PDF.

        Аргументи:
            file_path: Шлях до PDF-файлу.
            force_ocr: Якщо True — завжди використовувати OCR (повільніше, але точніше).

        Повертає:
            Вилучений текст або порожній рядок.
        """
        if not PYMUPDF_AVAILABLE:
            logger.warning("PyMuPDF (fitz) не встановлено. Повертаю порожній рядок.")
            return ""

        path = Path(file_path)
        if not path.exists():
            logger.error("Файл не знайдено: %s", file_path)
            return ""

        try:
            doc = fitz.open(file_path)
            pages_text: list[str] = []

            for page_num, page in enumerate(doc, start=1):
                text = page.get_text().strip()

                # Якщо сторінка майже порожня або force_ocr — OCR
                if (force_ocr or len(text) < PDFParser.MIN_TEXT_LEN_FOR_OCR) and TESSERACT_AVAILABLE and PIL_AVAILABLE:
                    ocr_text = await PDFParser._ocr_page(page)
                    if ocr_text:
                        text = ocr_text
                        logger.info("Сторінка %d: OCR виконано", page_num)

                if text:
                    pages_text.append(text)

            doc.close()
            return "\n\n".join(pages_text)

        except Exception as e:
            logger.error("Помилка вилучення тексту з PDF: %s", e)
            return ""

    @staticmethod
    async def _ocr_page(page: fitz.Page) -> str:
        """OCR сканованої сторінки PDF через Tesseract."""
        if not (PIL_AVAILABLE and TESSERACT_AVAILABLE):
            return ""

        try:
            # Рендеринг сторінки в зображення (PNG)
            pix = page.get_pixmap(dpi=PDFParser.OCR_DPI)
            img_data = pix.tobytes("png")
            img = Image.open(io.BytesIO(img_data))

            # Розпізнавання тексту (українська + англійська)
            text = pytesseract.image_to_string(img, lang="ukr+eng")
            return text.strip()

        except Exception as e:
            logger.warning("OCR помилка: %s", e)
            return ""

    @staticmethod
    async def parse_to_schema(file_path: str) -> dict[str, Any]:
        """Парсинг PDF в структуровану схему митного документа.

        Вилучає:
          - ЄДРПОУ (8-значні коди)
          - Номери декларацій (UA-XXX/XXXX/XXXX)
          - Суми (USD, UAH, EUR)
          - Дати (DD.MM.YYYY)
          - Країни (ISO-коди або назви)
          - HS-коди (10-значні)
        """
        text = await PDFParser.extract_text(file_path)
        if not text:
            return {"raw_text": "", "entities": {}}

        return {
            "raw_text": text[:5000],  # Обмеження для кешування
            "entities": {
                "edrpou": re.findall(r'\b\d{8}\b', text),
                "declaration_numbers": re.findall(r'[A-Z]{2}-\d{2,4}/\d{4}/\d+', text),
                "amounts_usd": re.findall(r'\$\s*[\d\s,]+\.?\d*', text),
                "amounts_uah": re.findall(r'\b[\d\s,]+\.?\d*\s*(?:грн|UAH)\b', text, re.IGNORECASE),
                "dates": re.findall(r'\b\d{2}[./-]\d{2}[./-]\d{4}\b', text),
                "hs_codes": re.findall(r'\b\d{10}\b', text),
                "countries": re.findall(
                    r'\b(?:Україна|Польща|Китай|Німеччина|Туреччина|USA|China|Germany|Poland|Turkey)\b',
                    text, re.IGNORECASE
                ),
            },
            "metadata": {
                "page_count": await PDFParser._get_page_count(file_path),
                "text_length": len(text),
                "ocr_used": TESSERACT_AVAILABLE,
            },
        }

    @staticmethod
    async def _get_page_count(file_path: str) -> int:
        """Кількість сторінок у PDF."""
        if not PYMUPDF_AVAILABLE:
            return 0
        try:
            with fitz.open(file_path) as doc:
                return doc.page_count
        except Exception:
            return 0
