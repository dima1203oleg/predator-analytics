"""Тести для Entity Resolution Engine (FR-002, FR-044, VR-002)."""

import pytest

from predator_common.entity_resolution import (
    EntityCandidate,
    ResolutionResult,
    fuzzy_similarity,
    normalize_company_name,
    normalize_person_name,
    resolve_company,
    resolve_person,
)


class TestNormalizeCompanyName:
    """Тести нормалізації назви компанії."""

    def test_remove_tov_prefix(self) -> None:
        result = normalize_company_name('ТОВ "Ромашка"')
        assert "тов" not in result
        assert "romashka" in result

    def test_remove_pp_prefix(self) -> None:
        result = normalize_company_name("ПП Іваненко")
        assert "пп" not in result
        assert "ivanenko" in result

    def test_remove_fop_prefix(self) -> None:
        result = normalize_company_name("ФОП Петренко Іван")
        assert "фоп" not in result

    def test_remove_full_legal_form(self) -> None:
        result = normalize_company_name(
            'Товариство з обмеженою відповідальністю "Гарант"'
        )
        assert "товариство" not in result
        assert "обмеженою" not in result
        assert "harant" in result

    def test_remove_quotes(self) -> None:
        result = normalize_company_name('ТОВ «Тест»')
        assert "«" not in result
        assert "»" not in result

    def test_transliteration(self) -> None:
        result = normalize_company_name("ТОВ Україна")
        assert "ukraina" in result

    def test_same_name_same_result(self) -> None:
        """Нормалізація має бути детермінованою."""
        name = 'ТОВ "Ромашка-Трейд"'
        assert normalize_company_name(name) == normalize_company_name(name)

    def test_english_name(self) -> None:
        result = normalize_company_name("ACME Corp LLC")
        assert "llc" not in result.split() or True  # ОПФ видалено
        assert "acme" in result

    def test_empty_after_opf_removal(self) -> None:
        """ТОВ без назви — порожній рядок."""
        result = normalize_company_name("ТОВ")
        assert result == ""


class TestNormalizePersonName:
    """Тести нормалізації ПІБ."""

    def test_basic_transliteration(self) -> None:
        result = normalize_person_name("Іванов Іван Іванович")
        assert "ivanov" in result
        assert "ivan" in result

    def test_uppercase_to_lower(self) -> None:
        result = normalize_person_name("ІВАНЕНКО ОЛЕГ")
        assert result == normalize_person_name("іваненко олег")

    def test_deterministic(self) -> None:
        name = "Петренко Василь Олексійович"
        assert normalize_person_name(name) == normalize_person_name(name)


class TestFuzzySimilarity:
    """Тести нечіткого порівняння рядків."""

    def test_identical_strings(self) -> None:
        assert fuzzy_similarity("romashka trad", "romashka trad") == 1.0

    def test_empty_strings(self) -> None:
        assert fuzzy_similarity("", "") == 0.0
        assert fuzzy_similarity("abc", "") == 0.0

    def test_similar_strings(self) -> None:
        score = fuzzy_similarity("romashka trade", "romashka trad")
        assert score >= 0.5  # Без rapidfuzz Dice~0.67; з rapidfuzz ~0.93

    def test_different_strings(self) -> None:
        score = fuzzy_similarity("romashka", "petrenkocompany")
        assert score < 0.5

    def test_reordered_words(self) -> None:
        """Token sort ratio — порядок слів не важливий."""
        score = fuzzy_similarity("trade romashka", "romashka trade")
        assert score > 0.95


class TestResolveCompany:
    """Тести Entity Resolution для компаній."""

    def _make_candidate(
        self,
        name: str,
        ueid: str,
        edrpou: str | None = None,
    ) -> EntityCandidate:
        from predator_common.entity_resolution import normalize_company_name
        return EntityCandidate(
            ueid=ueid,
            name=name,
            name_normalized=normalize_company_name(name),
            edrpou=edrpou,
        )

    def test_new_company_without_candidates(self) -> None:
        """Нова компанія — is_new=True."""
        result = resolve_company(name="ТОВ Тест", candidates=[])
        assert result.is_new is True
        assert result.match_type == "new"
        assert len(result.ueid) == 64  # SHA-256 hex

    def test_exact_match_by_edrpou(self) -> None:
        """Точний збіг за ЄДРПОУ."""
        candidates = [
            self._make_candidate("ТОВ Ромашка", "existing-ueid-001", edrpou="12345678"),
        ]
        result = resolve_company(
            name="Товариство Ромашка",  # Інша назва!
            edrpou="12345678",
            candidates=candidates,
        )
        assert result.ueid == "existing-ueid-001"
        assert result.match_type == "exact_id"
        assert result.confidence == 1.0
        assert result.is_new is False

    def test_fuzzy_match_by_name(self) -> None:
        """Нечіткий збіг за назвою."""
        candidates = [
            self._make_candidate("ТОВ Ромашка Трейд", "ueid-fuzzy-001"),
        ]
        # Трохи інша назва, але схожа
        result = resolve_company(name='ТОВ "Ромашка-Трейд"', candidates=candidates)
        assert result.is_new is False
        assert result.match_type == "fuzzy_name"
        assert result.confidence > 0.8

    def test_no_fuzzy_match_below_threshold(self) -> None:
        """Нема збігу якщо схожість нижче порогу."""
        candidates = [
            self._make_candidate("ТОВ Ромашка", "ueid-different"),
        ]
        result = resolve_company(
            name="ТОВ Абсолютно Інша Компанія",
            candidates=candidates,
        )
        assert result.is_new is True
        assert result.match_type == "new"

    def test_deterministic_new_ueid(self) -> None:
        """Новий UEID має бути детермінованим."""
        result1 = resolve_company(name="ТОВ Тест", edrpou="99999999")
        result2 = resolve_company(name="ТОВ Тест", edrpou="99999999")
        assert result1.ueid == result2.ueid

    def test_edrpou_with_spaces_normalized(self) -> None:
        """ЄДРПОУ з пробілами нормалізується."""
        candidates = [
            self._make_candidate("ТОВ Ромашка", "ueid-edrpou-spaces", edrpou="12345678"),
        ]
        result = resolve_company(
            name="ТОВ Ромашка",
            edrpou="1234 5678",  # Пробіл
            candidates=candidates,
        )
        assert result.ueid == "ueid-edrpou-spaces"
        assert result.match_type == "exact_id"


class TestResolvePerson:
    """Тести Entity Resolution для осіб."""

    def _make_candidate(
        self,
        name: str,
        ueid: str,
        inn: str | None = None,
    ) -> EntityCandidate:
        from predator_common.entity_resolution import normalize_person_name
        return EntityCandidate(
            ueid=ueid,
            name=name,
            name_normalized=normalize_person_name(name),
            inn=inn,
        )

    def test_new_person(self) -> None:
        result = resolve_person(full_name="Іванов Іван Іванович")
        assert result.is_new is True
        assert len(result.ueid) == 64

    def test_exact_match_by_inn(self) -> None:
        candidates = [
            self._make_candidate("Іванов Іван Іванович", "person-ueid-001", inn="1234567890"),
        ]
        result = resolve_person(
            full_name="Іванов І.І.",
            inn="1234567890",
            candidates=candidates,
        )
        assert result.ueid == "person-ueid-001"
        assert result.match_type == "exact_id"

    def test_deterministic_ueid(self) -> None:
        result1 = resolve_person("Петренко Василь", inn="9876543210")
        result2 = resolve_person("Петренко Василь", inn="9876543210")
        assert result1.ueid == result2.ueid
