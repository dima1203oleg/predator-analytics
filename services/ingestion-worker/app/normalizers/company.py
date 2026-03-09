"""
Company Normalizer — PREDATOR Analytics v55.1 Ironclad.

Standardization of company names and identifiers.
"""
import re
from typing import Dict, Any, Optional

class CompanyNormalizer:
    @staticmethod
    def normalize_name(name: str) -> str:
        """Очищення та нормалізація назви компанії."""
        if not name:
            return ""
        # Видалення зайвих пробілів
        name = " ".join(name.split())
        # Верхній регістр
        name = name.upper()
        # Заміна латинських літер-близнюків на кириличні (A, B, C, E, H, I, K, M, O, P, T, X)
        latin_to_cyrillic = {
            'A': 'А', 'B': 'В', 'C': 'С', 'E': 'Е', 'H': 'Н', 
            'I': 'І', 'K': 'К', 'M': 'М', 'O': 'О', 'P': 'Р', 
            'T': 'Т', 'X': 'Х'
        }
        for lat, cyr in latin_to_cyrillic.items():
            name = name.replace(lat, cyr)
        
        # Видалення лапок різних типів
        name = re.sub(r'["\'«»„“”]', '', name)
        
        return name.strip()

    @staticmethod
    def extract_edrpou(text: str) -> Optional[str]:
        """Пошук ЄДРПОУ в тексті."""
        match = re.search(r'\b\d{8}\b', text)
        return match.group(0) if match else None

    @staticmethod
    def normalize_data(data: Dict[str, Any]) -> Dict[str, Any]:
        """Повна нормалізація об'єкта компанії."""
        return {
            "name": CompanyNormalizer.normalize_name(data.get("name", "")),
            "edrpou": CompanyNormalizer.extract_edrpou(str(data.get("edrpou", ""))),
            "address": data.get("address", "").strip() if data.get("address") else None,
            "status": data.get("status", "ACTIVE").upper()
        }
