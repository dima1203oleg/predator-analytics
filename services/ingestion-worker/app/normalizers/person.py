"""Person Normalizer — PREDATOR Analytics v61.0-ELITE Ironclad.

Standardization of individual names (PIB) and identification numbers (INN).
"""
import re
from typing import Any


class PersonNormalizer:
    @staticmethod
    def normalize_pib(pib: str) -> str:
        """Нормалізація ПІБ (Прізвище Ім'я По батькові)."""
        if not pib:
            return ""

        # Видалення зайвих пробілів та зміна регістру
        pib = " ".join(pib.split())
        pib = pib.title() # Перша літера велика, інші маленькі

        # Специфічна логіка для українських апострофів (всі до одного вигляду)
        pib = pib.replace("'", "’").replace("`", "’").replace("\"", "’")

        return pib

    @staticmethod
    def extract_inn(text: str) -> str | None:
        """Вилучення ІПН (10 цифр) з тексту."""
        match = re.search(r'\b\d{10}\b', text)
        return match.group(0) if match else None

    @staticmethod
    def normalize_data(data: dict[str, Any]) -> dict[str, Any]:
        """Повна нормалізація даних фізичної особи."""
        full_name = data.get("full_name") or f"{data.get('last_name', '')} {data.get('first_name', '')} {data.get('middle_name', '')}"
        return {
            "full_name": PersonNormalizer.normalize_pib(full_name),
            "inn": PersonNormalizer.extract_inn(str(data.get("inn", ""))),
            "role": data.get("role", "UNKNOWN").upper()
        }
