"""Data Masking Tests — Тестування маскування чутливих даних згідно з RBAC v61.0

Сценарії тестування:
1. PROMO роль: суворе маскування (ЄДРПОУ → "**", назви → "ТОВ *", суми → діапазони)
2. PRO роль: маскування на рівні API (часткове)
3. VIP роль: без маскування
4. ADMIN роль: жодного доступу до бізнес-даних
"""
from app.core.data_masking import (
    DataMaskingService,
    DataSensitivity,
    get_data_masking_service,
    mask_response_data,
)


class TestDataMaskingService:
    """Тестування сервісу маскування даних."""

    def test_promo_role_strict_masking_edrpou(self):
        """PROMO роль: суворе маскування ЄДРПОУ."""
        service = DataMaskingService("promo")
        assert service.should_mask(DataSensitivity.SENSITIVE) is True
        # PUBLIC дані не маскуються для жодної ролі
        assert service.should_mask(DataSensitivity.PUBLIC) is False

        # ЄДРПОУ → "**"
        result = service.mask_value("12345678", "edrpou")
        assert result == "**"

    def test_promo_role_strict_masking_company_name(self):
        """PROMO роль: суворе маскування назви компанії."""
        service = DataMaskingService("promo")

        # Назва → "ТОВ *"
        result = service.mask_value("ТОВ Еліт Бізнес Брок", "company_name")
        assert result == "ТОВ *"

    def test_promo_role_strict_masking_amount(self):
        """PROMO роль: суворе маскування сум (діапазони)."""
        service = DataMaskingService("promo")

        # Суми → діапазони
        assert service.mask_value(50000, "amount") == "$10K-$100K"
        assert service.mask_value(500000, "amount") == "$100K-$1M"
        assert service.mask_value(1500000, "amount") == "$1M+"
        assert service.mask_value(500, "amount") == "<$1K"

    def test_promo_role_strict_masking_person_name(self):
        """PROMO роль: суворе маскування ПІБ."""
        service = DataMaskingService("promo")

        # ПІБ → "***"
        result = service.mask_value("Іванов Іван Іванович", "person_name")
        assert result == "***"

    def test_pro_role_partial_masking_edrpou(self):
        """PRO роль: часткове маскування ЄДРПОУ."""
        service = DataMaskingService("pro")
        assert service.should_mask(DataSensitivity.SENSITIVE) is True
        assert service.should_mask(DataSensitivity.PUBLIC) is False

        # ЄДРПОУ → часткове маскування
        result = service.mask_value("12345678", "edrpou")
        assert result == "12******"

    def test_pro_role_partial_masking_company_name(self):
        """PRO роль: часткове маскування назви компанії."""
        service = DataMaskingService("pro")

        # Назва → перші 3 слова
        result = service.mask_value("ТОВ Еліт Бізнес Брокер Холдинг", "company_name")
        assert result == "ТОВ Еліт Бізнес..."

    def test_pro_role_partial_masking_amount(self):
        """PRO роль: часткове маскування сум (округлення)."""
        service = DataMaskingService("pro")

        # Суми → округлення до тисяч (round() використовує banker's rounding)
        assert service.mask_value(50499, "amount") == 50000
        assert service.mask_value(50500, "amount") == 50000  # Banker's rounding to even
        assert service.mask_value(50999, "amount") == 51000
        assert service.mask_value(51000, "amount") == 51000

    def test_vip_role_no_masking(self):
        """VIP роль: без маскування."""
        service = DataMaskingService("vip")
        assert service.should_mask(DataSensitivity.SENSITIVE) is False
        assert service.should_mask(DataSensitivity.PUBLIC) is False

        # Дані без маскування
        assert service.mask_value("12345678", "edrpou") == "12345678"
        assert service.mask_value("ТОВ Еліт Бізнес Брок", "company_name") == "ТОВ Еліт Бізнес Брок"
        assert service.mask_value(50500, "amount") == 50500

    def test_admin_role_no_business_data_access(self):
        """ADMIN роль: жодного доступу до бізнес-даних."""
        service = DataMaskingService("admin")
        # Адмін не має доступу до бізнес-даних взагалі
        assert service.should_mask(DataSensitivity.SENSITIVE) is True
        assert service.should_mask(DataSensitivity.PUBLIC) is True

    def test_mask_dict_data(self):
        """Тестування маскування словника даних."""
        service = DataMaskingService("promo")

        data = {
            "edrpou": "12345678",
            "company_name": "ТОВ Еліт Бізнес Брок",
            "amount": 50000,
            "status": "active",
        }

        masked = service._mask_dict(data)

        assert masked["edrpou"] == "**"
        assert masked["company_name"] == "ТОВ *"
        assert masked["amount"] == "$10K-$100K"
        assert masked["status"] == "active"  # Публічні дані не маскуються

    def test_mask_list_of_dicts(self):
        """Тестування маскування списку словників."""
        service = DataMaskingService("promo")

        data = [
            {"edrpou": "12345678", "company_name": "ТОВ Еліт Бізнес Брок"},
            {"edrpou": "87654321", "company_name": "ПП ТехноПром"},
        ]

        masked = mask_response_data(data, "promo")

        assert masked[0]["edrpou"] == "**"
        assert masked[0]["company_name"] == "ТОВ *"
        assert masked[1]["edrpou"] == "**"
        assert masked[1]["company_name"] == "ТОВ *"

    def test_infer_field_type(self):
        """Тестування автоматичного визначення типу поля."""
        service = DataMaskingService("promo")

        assert service._infer_field_type("edrpou") == "edrpou"
        assert service._infer_field_type("company_name") == "company_name"
        assert service._infer_field_type("person_name") == "person_name"
        assert service._infer_field_type("address") == "address"
        assert service._infer_field_type("phone") == "phone"
        assert service._infer_field_type("email") == "email"
        assert service._infer_field_type("amount") == "amount"
        assert service._infer_field_type("count") == "count"

    def test_infer_sensitivity(self):
        """Тестування автоматичного визначення чутливості."""
        service = DataMaskingService("promo")

        # Публічні дані
        assert service._infer_sensitivity("status", "text") == DataSensitivity.PUBLIC
        assert service._infer_sensitivity("type", "text") == DataSensitivity.PUBLIC

        # Чутливі дані
        assert service._infer_sensitivity("edrpou", "edrpou") == DataSensitivity.SENSITIVE
        assert service._infer_sensitivity("company_name", "company_name") == DataSensitivity.SENSITIVE
        assert service._infer_sensitivity("transaction_amount", "amount") == DataSensitivity.SENSITIVE

        # Дані з маскуванням для PRO
        assert service._infer_sensitivity("description", "text") == DataSensitivity.MASKED_PRO


class TestMaskResponseData:
    """Тестування функції маскування відповідей API."""

    def test_mask_null_response(self):
        """Тестування маскування null відповіді."""
        result = mask_response_data(None, "promo")
        assert result is None

    def test_mask_simple_dict(self):
        """Тестування маскування простого словника."""
        data = {"edrpou": "12345678", "company_name": "ТОВ Тест"}
        result = mask_response_data(data, "promo")

        assert result["edrpou"] == "**"
        assert result["company_name"] == "ТОВ *"

    def test_mask_nested_dict(self):
        """Тестування маскування вкладеного словника."""
        data = {
            "company": {
                "edrpou": "12345678",
                "company_name": "ТОВ Тест",
            },
            "amount": 50000,
        }
        result = mask_response_data(data, "promo")

        assert result["company"]["edrpou"] == "**"
        assert result["company"]["company_name"] == "ТОВ *"
        assert result["amount"] == "$10K-$100K"

    def test_mask_list_response(self):
        """Тестування маскування списку відповідей."""
        data = [
            {"edrpou": "12345678", "name": "ТОВ Тест1"},
            {"edrpou": "87654321", "name": "ТОВ Тест2"},
        ]
        result = mask_response_data(data, "promo")

        assert len(result) == 2
        assert result[0]["edrpou"] == "**"
        assert result[1]["edrpou"] == "**"


class TestGetDataMaskingService:
    """Тестування фабрики сервісу маскування."""

    def test_get_service_for_promo(self):
        """Отримання сервісу для PROMO ролі."""
        service = get_data_masking_service("promo")
        assert isinstance(service, DataMaskingService)
        assert service.role == "promo"

    def test_get_service_for_pro(self):
        """Отримання сервісу для PRO ролі."""
        service = get_data_masking_service("pro")
        assert isinstance(service, DataMaskingService)
        assert service.role == "pro"

    def test_get_service_for_vip(self):
        """Отримання сервісу для VIP ролі."""
        service = get_data_masking_service("vip")
        assert isinstance(service, DataMaskingService)
        assert service.role == "vip"

    def test_get_service_for_admin(self):
        """Отримання сервісу для ADMIN ролі."""
        service = get_data_masking_service("admin")
        assert isinstance(service, DataMaskingService)
        assert service.role == "admin"


class TestLegacyRoleAliases:
    """Тестування легасі-аліасів ролей для зворотної сумісності."""

    def test_client_basic_alias(self):
        """Легасі-аліас client_basic → promo."""
        service = DataMaskingService("client_basic")
        assert service.role == "client_basic"
        # Повинен працювати як promo
        assert service.mask_value("12345678", "edrpou") == "**"

    def test_client_premium_alias(self):
        """Легасі-аліас client_premium → pro."""
        service = DataMaskingService("client_premium")
        assert service.role == "client_premium"
        # Повинен працювати як pro
        assert service.mask_value("12345678", "edrpou") == "12******"

    def test_analyst_alias(self):
        """Легасі-аліас analyst → pro."""
        service = DataMaskingService("analyst")
        assert service.role == "analyst"
        # Повинен працювати як pro
        assert service.mask_value("12345678", "edrpou") == "12******"
