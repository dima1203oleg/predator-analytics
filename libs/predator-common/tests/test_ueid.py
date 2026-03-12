"""Тести для генератора UEID."""

from predator_common.ueid import (
    generate_company_ueid,
    generate_person_ueid,
    generate_ueid,
)


class TestGenerateUeid:
    """Тести базової функції generate_ueid."""

    def test_returns_64_char_hex(self) -> None:
        """UEID має бути 64-символьний hex рядок (SHA-256)."""
        result = generate_ueid("company:12345678:тов ромашка")
        assert len(result) == 64
        assert all(c in "0123456789abcdef" for c in result)

    def test_deterministic(self) -> None:
        """Однаковий вхід → однаковий вихід."""
        canonical = "company:12345678:тов ромашка трейд"
        assert generate_ueid(canonical) == generate_ueid(canonical)

    def test_different_inputs_give_different_ueid(self) -> None:
        """Різний вхід → різний UUID."""
        ueid1 = generate_ueid("company:12345678:тов ромашка")
        ueid2 = generate_ueid("company:87654321:пат укрімпекс")
        assert ueid1 != ueid2


class TestGenerateCompanyUeid:
    """Тести для generate_company_ueid."""

    def test_with_edrpou(self) -> None:
        """Компанія з ЄДРПОУ."""
        ueid = generate_company_ueid("ТОВ Ромашка-Трейд", edrpou="12345678")
        assert len(ueid) == 64

    def test_edrpou_is_anchor(self) -> None:
        """Різні форми запису назви + той самий ЄДРПОУ → однаковий UEID."""
        ueid1 = generate_company_ueid(
            'Товариство з обмеженою відповідальністю "Ромашка-Трейд"',
            edrpou="12345678",
        )
        ueid2 = generate_company_ueid("ТОВ РОМАШКА ТРЕЙД", edrpou="12345678")
        assert ueid1 == ueid2

    def test_different_edrpou_gives_different_ueid(self) -> None:
        """Різний ЄДРПОУ → різний UEID навіть з однаковою назвою."""
        ueid1 = generate_company_ueid("ТОВ Тест", edrpou="11111111")
        ueid2 = generate_company_ueid("ТОВ Тест", edrpou="22222222")
        assert ueid1 != ueid2

    def test_without_edrpou_no_address(self) -> None:
        """Fallback без ЄДРПОУ та адреси."""
        ueid = generate_company_ueid("ТОВ Тест")
        assert len(ueid) == 64

    def test_without_edrpou_with_address(self) -> None:
        """Fallback без ЄДРПОУ але з адресою."""
        ueid = generate_company_ueid("ТОВ Тест", address="м. Київ, вул. Хрещатик, 1")
        assert len(ueid) == 64


class TestGeneratePersonUeid:
    """Тести для generate_person_ueid."""

    def test_with_inn_and_dob(self) -> None:
        """Особа з ІПН та датою народження."""
        ueid = generate_person_ueid(
            "Іванов Іван Іванович",
            inn="1234567890",
            date_of_birth="1980-05-15",
        )
        assert len(ueid) == 64

    def test_inn_is_anchor(self) -> None:
        """Різні форми запису імені + той самий ІПН → однаковий UEID."""
        ueid1 = generate_person_ueid("іванов іван іванович", inn="1234567890")
        ueid2 = generate_person_ueid("ІВАНОВ ІВАН ІВАНОВИЧ", inn="1234567890")
        assert ueid1 == ueid2

    def test_without_inn(self) -> None:
        """Fallback без ІПН — ім'я + дата народження."""
        ueid = generate_person_ueid("Петренко Петро", date_of_birth="1975-01-01")
        assert len(ueid) == 64

    def test_pure_fallback(self) -> None:
        """Fallback тільки на ім'я."""
        ueid = generate_person_ueid("Петренко Петро")
        assert len(ueid) == 64
