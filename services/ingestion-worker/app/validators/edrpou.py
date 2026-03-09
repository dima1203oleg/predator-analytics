"""
EDRPOU Validator — PREDATOR Analytics v55.1 Ironclad.

Checksum validation for Ukrainian company identifiers (EDRPOU).
"""
import re

class EDRPOUValidator:
    @staticmethod
    def validate(code: str) -> bool:
        """Перевірка контрольної суми ЄДРПОУ."""
        if not re.match(r'^\d{8}$', code):
            return False
            
        weights_low = [1, 2, 3, 4, 5, 6, 7]
        weights_high = [7, 1, 2, 3, 4, 5, 6]
        
        def calculate_sum(code_str, weights):
            return sum(int(code_str[i]) * weights[i] for i in range(7))
            
        dignits = [int(d) for d in code]
        sum_val = calculate_sum(code, weights_low)
        remainder = sum_val % 11
        
        if remainder < 10:
            return remainder == dignits[7]
            
        # Якщо залишок 10, пробуємо інші ваги
        sum_val = calculate_sum(code, weights_high)
        remainder = sum_val % 11
        
        if remainder < 10:
            return remainder == dignits[7]
            
        return dignits[7] == 0
