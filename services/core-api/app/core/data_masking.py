"""Data Masking Middleware — Маскування чутливих даних згідно з RBAC v61.0.

Цей модуль забезпечує маскування чутливих даних на рівні API для різних ролей:
- PROMO: суворе маскування (ЄДРПОУ → "**", назви → "ТОВ *", суми → діапазони)
- PRO: маскування на рівні API (без деанонімізації)
- VIP: повний доступ до чутливих даних (з можливістю перемикання)
- ADMIN: жодного доступу до бізнес-даних
"""
from enum import StrEnum
from typing import Any


class DataSensitivity(StrEnum):
    """Рівні чутливості даних."""

    PUBLIC = "public"           # Публічні дані (без маскування)
    MASKED_PROMO = "masked_promo"  # Маскування для PROMO (суворе)
    MASKED_PRO = "masked_pro"      # Маскування для PRO (без деанонімізації)
    SENSITIVE = "sensitive"    # Чутливі дані (тільки для VIP)


class DataMaskingService:
    """Сервіс маскування даних згідно з роллю користувача."""

    def __init__(self, role: str):
        self.role = role.lower()

    def should_mask(self, sensitivity: DataSensitivity) -> bool:
        """Перевіряє, чи потрібно маскувати дані для цієї ролі."""
        if self.role in ["admin", "commander"]:
            # Адмін не має доступу до бізнес-даних взагалі
            return True

        if self.role in ["promo", "client_basic", "operator", "explorer", "business", "guest"]:
            # PROMO: суворе маскування для всього, крім PUBLIC
            return sensitivity != DataSensitivity.PUBLIC

        if self.role in ["pro", "client_premium", "analyst", "bank"]:
            # PRO: маскування тільки для SENSITIVE
            return sensitivity == DataSensitivity.SENSITIVE

        if self.role in ["vip", "client_drpo", "investigator", "gov"]:
            # VIP: без маскування (можна перемикати через canToggleSensitiveData)
            return False

        return True

    def mask_value(self, value: Any, field_type: str = "text") -> Any:
        """Маскує значення поля залежно від типу."""
        if value is None:
            return None

        if isinstance(value, (int, float)):
            return self._mask_number(value, field_type)

        if isinstance(value, str):
            return self._mask_text(value, field_type)

        if isinstance(value, dict):
            return self._mask_dict(value)

        if isinstance(value, list):
            return [self.mask_value(item, field_type) for item in value]

        return value

    def _mask_text(self, text: str, field_type: str) -> str:
        """Маскує текстове значення."""
        if not text:
            return text

        # ЄДРПОУ / EDRPOU
        if field_type in ["edrpou", "tax_id", "ein"]:
            if self.role in ["promo", "client_basic", "operator", "explorer", "business", "guest"]:
                return "**"  # Суворе маскування для PROMO
            if self.role in ["pro", "client_premium", "analyst", "bank"]:
                return text[:2] + "*" * (len(text) - 2)  # Часткове маскування для PRO
            return text  # VIP - без маскування

        # Назва компанії
        if field_type in ["company_name", "entity_name", "legal_name"]:
            if self.role in ["promo", "client_basic", "operator", "explorer", "business", "guest"]:
                return "ТОВ *"  # Суворе маскування для PROMO
            if self.role in ["pro", "client_premium", "analyst", "bank"]:
                # Часткове маскування - показуємо перші 3 слова
                words = text.split()
                if len(words) > 3:
                    return " ".join(words[:3]) + "..."
                return text
            return text  # VIP - без маскування

        # ПІБ / Ім'я
        if field_type in ["person_name", "full_name", "first_name", "last_name"]:
            if self.role in ["promo", "client_basic", "operator", "explorer", "business", "guest"]:
                return "***"  # Повне маскування для PROMO
            if self.role in ["pro", "client_premium", "analyst", "bank"]:
                # Часткове маскування - тільки ініціали
                parts = text.split()
                if len(parts) >= 2:
                    return f"{parts[0][0]}. {parts[1][0]}."
                return text[0] + "*" * (len(text) - 1)
            return text  # VIP - без маскування

        # Адреса
        if field_type in ["address", "location"]:
            if self.role in ["promo", "client_basic", "operator", "explorer", "business", "guest"]:
                return "м. Київ, вул. ***"  # Загальне маскування
            if self.role in ["pro", "client_premium", "analyst", "bank"]:
                # Часткове маскування - тільки місто
                parts = text.split(",")
                return parts[0] if parts else "***"
            return text  # VIP - без маскування

        # Телефон
        if field_type in ["phone", "mobile", "telephone"]:
            if self.role in ["promo", "client_basic", "operator", "explorer", "business", "guest"]:
                return "+380 ** *** ** **"  # Суворе маскування
            if self.role in ["pro", "client_premium", "analyst", "bank"]:
                # Часткове маскування - тільки код країни
                return text[:4] + " *** ** **"
            return text  # VIP - без маскування

        # Email
        if field_type in ["email", "email_address"]:
            if self.role in ["promo", "client_basic", "operator", "explorer", "business", "guest"]:
                return "***@***.***"  # Суворе маскування
            if self.role in ["pro", "client_premium", "analyst", "bank"]:
                # Часткове маскування - тільки домен
                parts = text.split("@")
                if len(parts) == 2:
                    return f"***@{parts[1]}"
                return "***@***.***"
            return text  # VIP - без маскування

        return text

    def _mask_number(self, value: float, field_type: str) -> Any:
        """Маскує числове значення."""
        # Суми транзакцій / фінансові дані
        if field_type in ["amount", "value", "price", "cost", "revenue", "profit"]:
            if self.role in ["promo", "client_basic", "operator", "explorer", "business", "guest"]:
                # Діапазони для PROMO
                if value >= 1000000:
                    return "$1M+"
                elif value >= 100000:
                    return "$100K-$1M"
                elif value >= 10000:
                    return "$10K-$100K"
                elif value >= 1000:
                    return "$1K-$10K"
                else:
                    return "<$1K"
            if self.role in ["pro", "client_premium", "analyst", "bank"]:
                # Округлення для PRO
                return round(value / 1000) * 1000  # Округлюємо до тисяч
            return value  # VIP - без маскування

        # Кількісні показники
        if field_type in ["count", "quantity", "volume"]:
            if self.role in ["promo", "client_basic", "operator", "explorer", "business", "guest"]:
                # Діапазони для PROMO
                if value >= 1000:
                    return "1000+"
                elif value >= 100:
                    return "100-999"
                elif value >= 10:
                    return "10-99"
                else:
                    return "<10"
            return value  # PRO/VIP - без маскування

        return value

    def _mask_dict(self, data: dict[str, Any]) -> dict[str, Any]:
        """Маскує словник даних."""
        masked = {}
        for key, value in data.items():
            # Визначаємо тип поля на основі назви ключа
            field_type = self._infer_field_type(key)
            sensitivity = self._infer_sensitivity(key, field_type)

            if self.should_mask(sensitivity):
                masked[key] = self.mask_value(value, field_type)
            else:
                masked[key] = value
        return masked

    def _infer_field_type(self, field_name: str) -> str:
        """Визначає тип поля на основі назви."""
        field_name_lower = field_name.lower()

        if any(x in field_name_lower for x in ["edrpou", "tax_id", "ein", "code"]):
            return "edrpou"
        if any(x in field_name_lower for x in ["name", "title", "legal"]):
            return "company_name" if "company" in field_name_lower or "entity" in field_name_lower else "person_name"
        if any(x in field_name_lower for x in ["address", "location", "city"]):
            return "address"
        if any(x in field_name_lower for x in ["phone", "mobile", "tel"]):
            return "phone"
        if any(x in field_name_lower for x in ["email", "mail"]):
            return "email"
        if any(x in field_name_lower for x in ["amount", "value", "price", "cost", "usd", "uah"]):
            return "amount"
        if any(x in field_name_lower for x in ["count", "quantity", "volume", "number"]):
            return "count"

        return "text"

    def _infer_sensitivity(self, field_name: str, field_type: str) -> DataSensitivity:
        """Визначає рівень чутливості поля."""
        field_name_lower = field_name.lower()

        # Публічні дані
        if any(x in field_name_lower for x in ["public", "published", "status", "type"]):
            return DataSensitivity.PUBLIC

        # Чутливі дані (тільки для VIP)
        if any(x in field_name_lower for x in ["edrpou", "tax_id", "ein", "ssn", "passport"]):
            return DataSensitivity.SENSITIVE
        if field_type in ["company_name", "person_name", "address", "phone", "email"]:
            return DataSensitivity.SENSITIVE
        if field_type == "amount" and any(x in field_name_lower for x in ["transaction", "payment", "transfer"]):
            return DataSensitivity.SENSITIVE

        # Дані з маскуванням для PRO
        return DataSensitivity.MASKED_PRO


def get_data_masking_service(role: str) -> DataMaskingService:
    """Фабрика для створення сервісу маскування даних."""
    return DataMaskingService(role)


def mask_response_data(data: Any, role: str) -> Any:
    """Маскує дані у відповіді API залежно від ролі."""
    if data is None:
        return None

    service = get_data_masking_service(role)

    if isinstance(data, dict):
        return service._mask_dict(data)
    if isinstance(data, list):
        return [service._mask_dict(item) if isinstance(item, dict) else item for item in data]

    return data
