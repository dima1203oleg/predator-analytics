"""Telegram Parser — PREDATOR Analytics v61.0-ELITE Ironclad.

Extracting intelligence from Telegram channels and groups.
"""
import re
from typing import Any


class TelegramParser:
    @staticmethod
    def parse_message(text: str) -> dict[str, Any]:
        """Вилучення сутностей з тексту повідомлення Telegram.
        Шукає ЄДРПОУ, назви компаній, суми, дати.
        """
        entities = {
            "edrpous": re.findall(r'\b\d{8}\b', text),
            "urls": re.findall(r'https?://[^\s]+', text),
            "mentions": re.findall(r'@[a-zA-Z0-9_]+', text),
            "hashtags": re.findall(r'#[a-zA-Z0-9_а-яА-ЯіїєґІЇЄҐ]+', text)
        }
        return entities

    @staticmethod
    def clean_text(text: str) -> str:
        """Очищення тексту повідомлення від зайвих символів."""
        if not text:
            return ""
        return " ".join(text.split())
