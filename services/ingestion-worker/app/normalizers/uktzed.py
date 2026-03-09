"""
UKTZED Normalizer — PREDATOR Analytics v55.1 Ironclad.

Standardization of customs codes (UKTZED) and hierarchical validation.
"""
import re
from typing import Optional

class UKTZEDNormalizer:
    @staticmethod
    def normalize(code: str) -> Optional[str]:
        """Нормалізація коду УКТЗЕД."""
        if not code:
            return None
            
        # Видалення всього крім цифр
        clean_code = re.sub(r'\D', '', code)
        
        # Код має бути 10 знаків
        if len(clean_code) == 10:
            return clean_code
        elif len(clean_code) == 8: # Іноді буває 8, доповнюємо нулями
            return clean_code + "00"
            
        return clean_code[:10].ljust(10, '0')

    @staticmethod
    def get_group(code: str) -> str:
        """Повертає групу товару (перші 2 цифри)."""
        norm = UKTZEDNormalizer.normalize(code)
        return norm[:2] if norm else ""
