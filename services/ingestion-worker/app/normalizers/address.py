"""Address Normalizer — PREDATOR Analytics v55.1 Ironclad.

Standardization of Ukrainian addresses and geocoding placeholder.
"""
import re


class AddressNormalizer:
    @staticmethod
    def normalize(address: str) -> str:
        """Базова нормалізація адреси."""
        if not address:
            return ""

        # Видалення зайвих пробілів
        address = " ".join(address.split())

        # Скорочення типів об'єктів
        replacements = {
            r"\bВУЛИЦЯ\b": "вул.",
            r"\bБУДИНОК\b": "буд.",
            r"\bКВАРТИРА\b": "кв.",
            r"\bПРОСПЕКТ\b": "просп.",
            r"\bОБЛАСТЬ\b": "обл.",
            r"\bРАЙОН\b": "р-н",
            r"\bМІСТО\b": "м."
        }

        # Переводимо в нижній регістр для зручності замін, але потім повернемо капіталізацію де треба
        # Або просто робимо case-insensitive заміну
        for pattern, replacement in replacements.items():
            address = re.sub(pattern, replacement, address, flags=re.IGNORECASE)

        return address.strip()
