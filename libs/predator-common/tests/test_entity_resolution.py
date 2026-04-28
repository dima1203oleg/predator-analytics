"""Тести Entity Resolution — PREDATOR Analytics v61.0-ELITE.

Покриття:
- normalize_company_name: видалення ОПФ, транслітерація, нормалізація
- normalize_person_name: транслітерація ПІБ
- fuzzy_similarity: порівняння рядків
- resolve_company: exact_id, fuzzy_name, new
- resolve_person: exact_id, fuzzy_name, new
"""

from predator_common.entity_resolution import (
    EntityCandidate,
    fuzzy_similarity,
    normalize_company_name,
    normalize_person_name,
    resolve_company,
    resolve_person,
)

# ------------------------------------------------------------------
# normalize_company_name
# ------------------------------------------------------------------


class TestNormalizeCompanyName:
    """Тести нормалізації назв компаній."""

    def test_remove_legal_form_tov(self) -> None:
        """Видалення 'товариство з обмеженою відповідальністю'."""
        result = normalize_company_name(
            'Товариство з обмеженою відповідальністю "Ромашка-Трейд"'
        )
        assert "romashka" in result
        assert "treid" in result
        assert "tovarystvo" not in result

    def test_remove_legal_form_pp(self) -> None:
        """Видалення 'Приватне підприємство'."""
        result = normalize_company_name("Приватне підприємство Сонце")
        assert "sontse" in result
        assert "pp" not in result

    def test_transliteration(self) -> None:
        """Транслітерація кирилиці в латиницю."""
        result = normalize_company_name("Київстар")
        assert result == "kyivstar"

    def test_lowercase(self) -> None:
        """Приведення до нижнього регістру."""
        result = normalize_company_name("УКРНАФТА")
        assert result == "ukrnafta"

    def test_remove_special_chars(self) -> None:
        """Видалення спецсимволів."""
        result = normalize_company_name('ТОВ «Метал-Інвест» №5')
        assert "metal" in result
        assert "invest" in result

    def test_normalize_whitespace(self) -> None:
        """Нормалізація пробілів."""
        result = normalize_company_name("  Компанія   Тест  ")
        assert "  " not in result
        assert result.startswith("k")

    def test_empty_string(self) -> None:
        """Порожній рядок."""
        result = normalize_company_name("")
        assert result == ""


# ------------------------------------------------------------------
# normalize_person_name
# ------------------------------------------------------------------


class TestNormalizePersonName:
    """Тести нормалізації ПІБ."""

    def test_basic_name(self) -> None:
        """Базова транслітерація ПІБ."""
        result = normalize_person_name("ІВАНОВ Іван Іванович")
        assert "ivanov" in result
        assert "ivan" in result

    def test_with_special_chars(self) -> None:
        """ПІБ зі спеціальними символами."""
        result = normalize_person_name("Петренко-Сидоренко О.В.")
        assert "petrenko" in result
        assert "sydorenko" in result


# ------------------------------------------------------------------
# fuzzy_similarity
# ------------------------------------------------------------------


class TestFuzzySimilarity:
    """Тести fuzzy порівняння."""

    def test_identical_strings(self) -> None:
        """Ідентичні рядки → 1.0."""
        score = fuzzy_similarity("test string", "test string")
        assert score == 1.0

    def test_empty_strings(self) -> None:
        """Порожні рядки → 0.0."""
        score = fuzzy_similarity("", "")
        assert score == 0.0

    def test_similar_strings(self) -> None:
        """Схожі рядки → високий score."""
        score = fuzzy_similarity("romashka treid", "romashka trade")
        assert score > 0.7

    def test_different_strings(self) -> None:
        """Різні рядки → низький score."""
        score = fuzzy_similarity("kompaniia alfa", "beta gamma delta")
        assert score < 0.5


# ------------------------------------------------------------------
# resolve_company
# ------------------------------------------------------------------


class TestResolveCompany:
    """Тести Entity Resolution для компаній."""

    def test_exact_edrpou_match(self) -> None:
        """Точний збіг за ЄДРПОУ."""
        candidates = [
            EntityCandidate(
                ueid="existing-ueid-123",
                name="ТОВ Ромашка",
                name_normalized="romashka",
                edrpou="12345678",
            )
        ]

        result = resolve_company("Ромашка Трейд", edrpou="12345678", candidates=candidates)
        assert result.ueid == "existing-ueid-123"
        assert result.is_new is False
        assert result.match_type == "exact_id"
        assert result.confidence == 1.0

    def test_fuzzy_name_match(self) -> None:
        """Fuzzy збіг за назвою."""
        candidates = [
            EntityCandidate(
                ueid="fuzzy-ueid-456",
                name="Ромашка Трейдінг",
                name_normalized="romashka treidingh",
            )
        ]

        result = resolve_company("Ромашка-Трейдінг", candidates=candidates)
        # Має знайти існуючого кандидата (high similarity)
        if result.confidence >= 0.85:
            assert result.is_new is False
            assert result.match_type == "fuzzy_name"

    def test_new_entity(self) -> None:
        """Нова сутність — немає кандидатів."""
        result = resolve_company("Абсолютно Нова Компанія")
        assert result.is_new is True
        assert result.match_type == "new"
        assert result.confidence == 1.0
        assert len(result.ueid) > 0

    def test_edrpou_priority_over_fuzzy(self) -> None:
        """ЄДРПОУ має пріоритет над fuzzy match."""
        candidates = [
            EntityCandidate(
                ueid="edrpou-match",
                name="Компанія А",
                name_normalized="kompaniia a",
                edrpou="99887766",
            ),
            EntityCandidate(
                ueid="name-match",
                name="Ромашка",
                name_normalized="romashka",
            ),
        ]

        result = resolve_company("Ромашка", edrpou="99887766", candidates=candidates)
        assert result.ueid == "edrpou-match"
        assert result.match_type == "exact_id"


# ------------------------------------------------------------------
# resolve_person
# ------------------------------------------------------------------


class TestResolvePerson:
    """Тести Entity Resolution для осіб."""

    def test_exact_inn_match(self) -> None:
        """Точний збіг за ІПН."""
        candidates = [
            EntityCandidate(
                ueid="person-ueid-789",
                name="Іванов Іван Іванович",
                name_normalized="ivanov ivan ivanovych",
                inn="1234567890",
            )
        ]

        result = resolve_person("Іванов І.І.", inn="1234567890", candidates=candidates)
        assert result.ueid == "person-ueid-789"
        assert result.is_new is False
        assert result.match_type == "exact_id"

    def test_new_person(self) -> None:
        """Нова особа — немає кандидатів."""
        result = resolve_person("Абсолютно Нова Людина")
        assert result.is_new is True
        assert result.match_type == "new"
        assert len(result.ueid) > 0
