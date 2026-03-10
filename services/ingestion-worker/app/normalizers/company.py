"""
Company Normalizer — PREDATOR Analytics v55.2-SM-EXTENDED.
Стандартизація назв та генерація канонічних UEID.
"""
import re
import hashlib
from typing import Dict, Any, Optional

class CompanyNormalizer:
    @staticmethod
    def generate_ueid(edrpou: str, tenant_id: str) -> str:
        """
        Генерує канонічний UEID на основі ЄДРПОУ та ID тенанта.
        Забезпечує консистентність зв'язків у v55.2.
        """
        base_str = f"{edrpou.strip()}:{tenant_id.strip()}"
        return hashlib.sha256(base_str.encode()).hexdigest()

    @staticmethod
    def normalize_name(name: str) -> str:
        """Очищення та нормалізація назви компанії."""
        if not name:
            return ""
        name = " ".join(name.split())
        name = name.upper()
        # Заміна лат-близнюків
        latin_to_cyrillic = {
            'A': 'А', 'B': 'В', 'C': 'С', 'E': 'Е', 'H': 'Н', 
            'I': 'І', 'K': 'К', 'M': 'М', 'O': 'О', 'P': 'Р', 
            'T': 'Т', 'X': 'Х'
        }
        for lat, cyr in latin_to_cyrillic.items():
            name = name.replace(lat, cyr)
        
        name = re.sub(r'["\'«»„“”]', '', name)
        return name.strip()

    @staticmethod
    def normalize_data(data: Dict[str, Any], tenant_id: str) -> Dict[str, Any]:
        """
        Повна нормалізація об'єкта компанії згідно v55.2.
        """
        edrpou = str(data.get("edrpou", "")).strip()
        # Очищення від нецифрових символів для ЄДРПОУ
        edrpou = re.sub(r'\D', '', edrpou)
        
        normalized_name = CompanyNormalizer.normalize_name(data.get("name", ""))
        
        return {
            "ueid": CompanyNormalizer.generate_ueid(edrpou, tenant_id) if edrpou else None,
            "edrpou": edrpou if len(edrpou) >= 8 else None,
            "name": normalized_name,
            "status": data.get("status", "active").lower(),
            "sector": data.get("sector", "unknown").lower(),
            "tenant_id": tenant_id
        }
