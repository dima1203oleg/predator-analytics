"""INN Validator — PREDATOR Analytics v61.0-ELITE Ironclad.

Checksum validation for Ukrainian individual tax numbers (INN/RNOKPP).
"""
import re


class INNValidator:
    @staticmethod
    def validate(inn: str) -> bool:
        """Перевірка контрольної суми ІПН (10 цифр)."""
        if not re.match(r'^\d{10}$', inn):
            return False

        weights = [-1, 5, 7, 9, 4, 6, 10, 5, 7]

        inn_digits = [int(d) for d in inn]
        sum_val = sum(inn_digits[i] * weights[i] for i in range(9))

        remainder = sum_val % 11
        if remainder == 10:
            remainder = 0

        return remainder == inn_digits[9]
