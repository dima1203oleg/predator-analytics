"""Telegram Parser — PREDATOR Analytics v61.0-ELITE Ironclad.

Extracting intelligence from Telegram channels and groups.
"""
import re
from typing import Any


class TelegramParser:
    # ─── Регулярні вирази для митних даних ──────────────────────────────────

    RE_EDRPOU = re.compile(r'\b\d{8}\b')
    RE_URL = re.compile(r'https?://[^\s]+')
    RE_MENTION = re.compile(r'@[a-zA-Z0-9_]+')
    RE_HASHTAG = re.compile(r'#[a-zA-Z0-9_а-яА-ЯіїєґІЇЄҐ]+')
    RE_PHONE = re.compile(r'\+?380?\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}')
    RE_EMAIL = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}')
    RE_DATE = re.compile(r'\b\d{2}[./-]\d{2}[./-]\d{4}\b')
    RE_AMOUNT_USD = re.compile(r'\$\s*[\d\s,.]+\b')
    RE_AMOUNT_UAH = re.compile(r'\b[\d\s,.]+\s*(?:грн|грн\.|UAH)\b', re.IGNORECASE)
    RE_AMOUNT_EUR = re.compile(r'\b[\d\s,.]+\s*(?:євро|євр|EUR|€)\b', re.IGNORECASE)
    RE_ADDRESS = re.compile(
        r'(?:м\.|місто|вул\.|вулиця|пр\.|проспект|обл\.|область|р-н|район)\s*[А-Яа-яІіЇїЄєҐґ\w\s,.\-/]+',
        re.IGNORECASE
    )

    @staticmethod
    def parse_message(text: str) -> dict[str, Any]:
        """Вилучення сутностей з тексту повідомлення Telegram.

        Виявляє: ЄДРПОУ, суми, дати, телефони, email, адреси, URL, згадки, хештеги.
        """
        if not text:
            return {}

        return {
            "edrpous": TelegramParser.RE_EDRPOU.findall(text),
            "urls": TelegramParser.RE_URL.findall(text),
            "mentions": TelegramParser.RE_MENTION.findall(text),
            "hashtags": TelegramParser.RE_HASHTAG.findall(text),
            "phones": TelegramParser.RE_PHONE.findall(text),
            "emails": TelegramParser.RE_EMAIL.findall(text),
            "dates": TelegramParser.RE_DATE.findall(text),
            "amounts_usd": TelegramParser.RE_AMOUNT_USD.findall(text),
            "amounts_uah": TelegramParser.RE_AMOUNT_UAH.findall(text),
            "amounts_eur": TelegramParser.RE_AMOUNT_EUR.findall(text),
            "addresses": TelegramParser.RE_ADDRESS.findall(text),
            "summary": TelegramParser._build_summary(text),
        }

    @staticmethod
    def clean_text(text: str) -> str:
        """Очищення тексту повідомлення від зайвих символів."""
        if not text:
            return ""
        # Нормалізація пробілів
        cleaned = " ".join(text.split())
        # Видалення зайвих спецсимволів
        cleaned = re.sub(r'[^\w\s@#./:+=-]', '', cleaned)
        return cleaned

    @staticmethod
    def _build_summary(text: str) -> dict[str, Any]:
        """Короткий аналітичний summary повідомлення."""
        words = text.split()
        return {
            "word_count": len(words),
            "char_count": len(text),
            "has_company_ref": bool(re.search(r'\b(?:ТОВ|ФОП|АТ|ПРАТ|ПП|LLC|Ltd|Inc)\b', text, re.IGNORECASE)),
            "has_risk_keywords": bool(re.search(
                r'\b(?:ризик|порушення|затримка|штраф|контрабанда|фрод|аномалія|підозра)\b',
                text, re.IGNORECASE
            )),
            "language": "uk" if re.search(r'[іїєґІЇЄҐ]', text) else "en" if re.search(r'[a-zA-Z]{3,}', text) else "unknown",
        }
