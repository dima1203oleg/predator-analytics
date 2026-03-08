from __future__ import annotations


"""Named Entity Recognition (NER) Service (COMP-043)

Розпізнавання іменованих сутностей в українських текстах.

Entities:
- PERSON: ПІБ (Прізвище Ім'я По-батькові)
- ORG: Організація (ТОВ, ПрАТ, КП, ФОП, etc.)
- LOC: Місцезнаходження (місто, область, країна)
- EDRPOU: 8-digit code
- MONEY: Грошові суми (UAH, USD, EUR)
- DATE: Дати
- PRODUCT: Товар / код УКТЗЕД

Strategy:
1. Primary: Hugging Face UKR NER model (if available)
2. Fallback: Rule-based regex patterns
"""
import logging
import re
from dataclasses import dataclass, field
from typing import Any


logger = logging.getLogger("service.ner")


@dataclass
class NamedEntity:
    """A recognized named entity."""
    text: str
    label: str           # PERSON, ORG, LOC, EDRPOU, MONEY, DATE, PRODUCT
    start: int = 0       # Character position
    end: int = 0
    confidence: float = 1.0
    normalized: str = ""

    def to_dict(self) -> dict[str, Any]:
        return {
            "text": self.text,
            "label": self.label,
            "start": self.start,
            "end": self.end,
            "confidence": self.confidence,
            "normalized": self.normalized or self.text,
        }


@dataclass
class NERResult:
    """NER analysis result."""
    text: str
    entities: list[NamedEntity] = field(default_factory=list)
    method: str = "regex"

    def to_dict(self) -> dict[str, Any]:
        return {
            "text": self.text[:200],
            "entities": [e.to_dict() for e in self.entities],
            "counts": self._counts(),
            "method": self.method,
        }

    def _counts(self) -> dict[str, int]:
        counts: dict[str, int] = {}
        for e in self.entities:
            counts[e.label] = counts.get(e.label, 0) + 1
        return counts


# Regex patterns for Ukrainian NER
PATTERNS = {
    "EDRPOU": re.compile(r"\b(\d{8})\b"),
    "MONEY_UAH": re.compile(
        r"(\d[\d\s,.]*\d)\s*(?:грн|гривень|гривні|грн\.|UAH|₴)", re.IGNORECASE
    ),
    "MONEY_USD": re.compile(
        r"(?:\$|USD)\s*(\d[\d\s,.]*\d)|(\d[\d\s,.]*\d)\s*(?:долар|дол\.|USD|\$)", re.IGNORECASE
    ),
    "MONEY_EUR": re.compile(
        r"(?:€|EUR)\s*(\d[\d\s,.]*\d)|(\d[\d\s,.]*\d)\s*(?:євро|EUR|€)", re.IGNORECASE
    ),
    "ORG": re.compile(
        r'(?:ТОВ|ПрАТ|ПАТ|АТ|ТДВ|КП|ДП|НП|ГП|ВП|ПП|ФОП|LLC|Ltd|Inc)\s*[«"]?([^»",.;]{3,60})[»"]?',
        re.IGNORECASE,
    ),
    "DATE_UA": re.compile(
        r"\b(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})\b"
    ),
    "UKTZED": re.compile(r"\b(\d{4}\s?\d{2}\s?\d{2}\s?\d{2})\b"),
    "PERSON_PATTERN": re.compile(
        r"\b([А-ЯІЇЄҐ][а-яіїєґ']+)\s+([А-ЯІЇЄҐ][а-яіїєґ']+)(?:\s+([А-ЯІЇЄҐ][а-яіїєґ']+))?\b"
    ),
}

# Ukrainian city names for LOC detection
UA_CITIES = {
    "київ", "харків", "одеса", "дніпро", "львів", "запоріжжя",
    "кривий ріг", "миколаїв", "маріуполь", "вінниця", "полтава",
    "чернігів", "черкаси", "хмельницький", "житомир", "суми",
    "рівне", "тернопіль", "івано-франківськ", "луцьк", "ужгород",
    "кропивницький", "чернівці", "херсон",
}

UA_OBLASTS = {
    "київська", "харківська", "одеська", "дніпропетровська", "львівська",
    "запорізька", "миколаївська", "вінницька", "полтавська", "чернігівська",
    "черкаська", "хмельницька", "житомирська", "сумська", "рівненська",
    "тернопільська", "івано-франківська", "волинська", "закарпатська",
    "кіровоградська", "чернівецька", "херсонська", "донецька", "луганська",
}

COUNTRIES = {
    "україна", "сша", "китай", "німеччина", "польща", "туреччина",
    "великобританія", "франція", "італія", "іспанія", "нідерланди",
    "бельгія", "австрія", "швейцарія", "чехія", "словаччина",
    "румунія", "угорщина", "болгарія", "молдова", "білорусь",
    "росія", "грузія", "азербайджан", "казахстан", "узбекистан",
}

# Ukrainian last name endings
UA_SURNAME_ENDINGS = (
    "ський", "зький", "ський", "цький", "ський",
    "енко", "ейко", "інко", "оненко",
    "чук", "щук", "нюк", "люк",
    "ович", "евич", "ієвич",
    "ський", "зька", "цька",
    "ко", "юк", "ак", "ик",
)


class NERService:
    """Named Entity Recognition for Ukrainian text."""

    def __init__(self):
        self._model = None
        self._model_loaded = False
        logger.info("NERService initialized")

    def extract(self, text: str) -> NERResult:
        """Extract named entities from Ukrainian text.

        Args:
            text: Input text

        Returns:
            NERResult with extracted entities
        """
        if not text or not text.strip():
            return NERResult(text="")

        # Try transformer model first
        if self._try_load_model() and self._model is not None:
            return self._extract_transformer(text)

        # Fallback to regex-based extraction
        return self._extract_regex(text)

    def extract_batch(self, texts: list[str]) -> list[NERResult]:
        """Extract entities from multiple texts."""
        return [self.extract(t) for t in texts]

    def _try_load_model(self) -> bool:
        """Try loading transformer NER model."""
        if self._model_loaded:
            return self._model is not None
        try:
            from transformers import pipeline
            self._model = pipeline(
                "ner",
                model="ukr-models/uk-ner",
                device=-1,
                aggregation_strategy="simple",
            )
            self._model_loaded = True
            return True
        except Exception:
            self._model_loaded = True
            return False

    def _extract_transformer(self, text: str) -> NERResult:
        """Use transformer model for NER."""
        try:
            results = self._model(text[:512])
            entities = []
            for r in results:
                entities.append(NamedEntity(
                    text=r["word"],
                    label=r["entity_group"],
                    start=r.get("start", 0),
                    end=r.get("end", 0),
                    confidence=round(r["score"], 3),
                ))
            return NERResult(text=text[:200], entities=entities, method="transformer")
        except Exception:
            return self._extract_regex(text)

    def _extract_regex(self, text: str) -> NERResult:
        """Rule-based NER using regex patterns."""
        entities: list[NamedEntity] = []

        # EDRPOU codes
        for m in PATTERNS["EDRPOU"].finditer(text):
            entities.append(NamedEntity(
                text=m.group(1), label="EDRPOU",
                start=m.start(), end=m.end(), confidence=0.95,
            ))

        # Organizations
        for m in PATTERNS["ORG"].finditer(text):
            org_name = m.group(0).strip().rstrip(".,;")
            entities.append(NamedEntity(
                text=org_name, label="ORG",
                start=m.start(), end=m.end(), confidence=0.85,
            ))

        # Money (UAH)
        for m in PATTERNS["MONEY_UAH"].finditer(text):
            amount = m.group(1).replace(" ", "").replace(",", ".")
            entities.append(NamedEntity(
                text=m.group(0), label="MONEY",
                start=m.start(), end=m.end(), confidence=0.9,
                normalized=f"{amount} UAH",
            ))

        # Money (USD)
        for m in PATTERNS["MONEY_USD"].finditer(text):
            amount = (m.group(1) or m.group(2)).replace(" ", "").replace(",", ".")
            entities.append(NamedEntity(
                text=m.group(0), label="MONEY",
                start=m.start(), end=m.end(), confidence=0.9,
                normalized=f"{amount} USD",
            ))

        # Money (EUR)
        for m in PATTERNS["MONEY_EUR"].finditer(text):
            amount = (m.group(1) or m.group(2)).replace(" ", "").replace(",", ".")
            entities.append(NamedEntity(
                text=m.group(0), label="MONEY",
                start=m.start(), end=m.end(), confidence=0.9,
                normalized=f"{amount} EUR",
            ))

        # Dates
        for m in PATTERNS["DATE_UA"].finditer(text):
            entities.append(NamedEntity(
                text=m.group(0), label="DATE",
                start=m.start(), end=m.end(), confidence=0.85,
            ))

        # UKTZED product codes
        for m in PATTERNS["UKTZED"].finditer(text):
            code = m.group(1).replace(" ", "")
            if len(code) == 10:
                entities.append(NamedEntity(
                    text=code, label="PRODUCT",
                    start=m.start(), end=m.end(), confidence=0.8,
                    normalized=code,
                ))

        # Locations (cities, oblasts, countries)
        text_lower = text.lower()
        for city in UA_CITIES:
            idx = text_lower.find(city)
            if idx >= 0:
                entities.append(NamedEntity(
                    text=text[idx:idx + len(city)], label="LOC",
                    start=idx, end=idx + len(city), confidence=0.85,
                ))

        for oblast in UA_OBLASTS:
            term = f"{oblast} область"
            idx = text_lower.find(term)
            if idx >= 0:
                entities.append(NamedEntity(
                    text=text[idx:idx + len(term)], label="LOC",
                    start=idx, end=idx + len(term), confidence=0.85,
                ))

        # Persons (Ukrainian names pattern)
        for m in PATTERNS["PERSON_PATTERN"].finditer(text):
            surname = m.group(1)
            # Check if surname has typical Ukrainian ending
            if any(surname.lower().endswith(end) for end in UA_SURNAME_ENDINGS):
                name = m.group(0).strip()
                entities.append(NamedEntity(
                    text=name, label="PERSON",
                    start=m.start(), end=m.end(), confidence=0.7,
                ))

        # Deduplicate and sort by position
        seen: set[tuple[str, int]] = set()
        unique: list[NamedEntity] = []
        for e in entities:
            key = (e.text, e.start)
            if key not in seen:
                seen.add(key)
                unique.append(e)

        unique.sort(key=lambda e: e.start)
        return NERResult(text=text[:200], entities=unique, method="regex")


# Singleton
_ner_service: NERService | None = None


def get_ner_service() -> NERService:
    global _ner_service
    if _ner_service is None:
        _ner_service = NERService()
    return _ner_service
