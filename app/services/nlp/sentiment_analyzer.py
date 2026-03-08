from __future__ import annotations


"""Ukrainian Sentiment Analyzer (COMP-048)

Аналіз тональності тексту українською мовою.

Стратегія:
1. Primary: ukr-roberta (Hugging Face) — якщо GPU/RAM доступно
2. Fallback: Rule-based lexicon analyzer (завжди працює)

Use cases:
- Telegram channel monitoring (COMP-027)
- News aggregation sentiment
- Customs declarations context
- Court decision sentiment
"""
import logging
import re
from dataclasses import dataclass, field
from typing import Any


logger = logging.getLogger("service.sentiment")


@dataclass
class SentimentResult:
    """Sentiment analysis result."""
    text: str
    label: str              # positive, negative, neutral, mixed
    score: float            # -1.0 (negative) to +1.0 (positive)
    confidence: float       # 0.0 to 1.0
    emotions: dict[str, float] = field(default_factory=dict)
    language: str = "uk"
    method: str = "lexicon"

    def to_dict(self) -> dict[str, Any]:
        return {
            "text": self.text[:200],
            "label": self.label,
            "score": self.score,
            "confidence": self.confidence,
            "emotions": self.emotions,
            "language": self.language,
            "method": self.method,
        }


# Ukrainian sentiment lexicon (curated)
POSITIVE_WORDS = {
    "добре", "чудово", "відмінно", "прекрасно", "успіх", "перемога",
    "зростання", "покращення", "збільшення", "ефективний", "якісний",
    "надійний", "стабільний", "позитивний", "корисний", "вигідний",
    "рекомендую", "задоволений", "дякую", "чесний", "прозорий",
    "інновація", "модернізація", "розвиток", "прогрес", "досягнення",
    "лідер", "найкращий", "оптимальний", "вчасно", "професійний",
    "гарантія", "довіра", "партнерство", "співпраця", "відповідальний",
    "вдячний", "щасливий", "радість", "любов", "мир",
    "впевнений", "підтримка", "захист", "благодійність", "волонтер",
}

NEGATIVE_WORDS = {
    "погано", "жахливо", "катастрофа", "провал", "збитки", "втрати",
    "падіння", "погіршення", "зменшення", "неефективний", "неякісний",
    "ненадійний", "нестабільний", "негативний", "шкідливий", "збитковий",
    "скарга", "незадоволений", "обман", "корупція", "шахрайство",
    "банкрутство", "борг", "штраф", "санкції", "порушення",
    "кримінальний", "арешт", "конфіскація", "зловживання", "маніпуляція",
    "відмивання", "контрабанда", "ухилення", "фальсифікація", "підробка",
    "загроза", "ризик", "небезпека", "криза", "дефолт",
    "затримка", "блокування", "заборона", "відмова", "скасування",
    "конфлікт", "суперечка", "позов", "стягнення", "пеня",
}

INTENSIFIERS = {
    "дуже", "надзвичайно", "вкрай", "особливо", "абсолютно",
    "цілком", "повністю", "значно", "суттєво", "критично",
}

NEGATORS = {
    "не", "ні", "ніколи", "ніяк", "жодний", "без", "проти",
}

# Emotion keywords
EMOTION_KEYWORDS = {
    "anger": {"гнів", "лють", "обурення", "скандал", "агресія", "злість"},
    "fear": {"страх", "тривога", "побоювання", "паніка", "загроза", "небезпека"},
    "joy": {"радість", "щастя", "захват", "ентузіазм", "натхнення", "веселощі"},
    "sadness": {"сум", "жаль", "розчарування", "втрата", "горе", "біль"},
    "surprise": {"здивування", "несподіванка", "шок", "сенсація", "раптово"},
    "trust": {"довіра", "впевненість", "надійність", "гарантія", "стабільність"},
}


class SentimentAnalyzer:
    """Ukrainian text sentiment analyzer.

    Uses a hybrid approach:
    1. Try Hugging Face transformer model (if available)
    2. Fall back to rule-based lexicon analysis
    """

    def __init__(self):
        self._model = None
        self._tokenizer = None
        self._model_loaded = False
        logger.info("SentimentAnalyzer initialized")

    def _try_load_model(self) -> bool:
        """Attempt to load transformer model."""
        if self._model_loaded:
            return self._model is not None

        try:
            from transformers import pipeline

            self._model = pipeline(
                "sentiment-analysis",
                model="ukr-models/uk-sentiment",
                tokenizer="ukr-models/uk-sentiment",
                device=-1,  # CPU
            )
            self._model_loaded = True
            logger.info("Transformer sentiment model loaded")
            return True
        except Exception:
            self._model_loaded = True  # Don't retry
            logger.info("Transformer model not available, using lexicon fallback")
            return False

    def analyze(self, text: str) -> SentimentResult:
        """Analyze sentiment of Ukrainian text.

        Args:
            text: Input text in Ukrainian

        Returns:
            SentimentResult
        """
        if not text or not text.strip():
            return SentimentResult(
                text="",
                label="neutral",
                score=0.0,
                confidence=0.0,
            )

        # Try transformer model first
        if self._try_load_model() and self._model is not None:
            return self._analyze_transformer(text)

        # Fallback to lexicon-based
        return self._analyze_lexicon(text)

    def analyze_batch(self, texts: list[str]) -> list[SentimentResult]:
        """Analyze sentiment for multiple texts."""
        return [self.analyze(t) for t in texts]

    def _analyze_transformer(self, text: str) -> SentimentResult:
        """Use transformer model for analysis."""
        try:
            result = self._model(text[:512])  # Limit input length
            label_map = {"POSITIVE": "positive", "NEGATIVE": "negative", "NEUTRAL": "neutral"}

            raw_label = result[0]["label"]
            score_val = result[0]["score"]

            label = label_map.get(raw_label, raw_label.lower())
            score = score_val if label == "positive" else -score_val if label == "negative" else 0.0

            return SentimentResult(
                text=text[:200],
                label=label,
                score=round(score, 3),
                confidence=round(score_val, 3),
                emotions=self._detect_emotions(text),
                method="transformer",
            )
        except Exception as e:
            logger.warning(f"Transformer analysis failed: {e}")
            return self._analyze_lexicon(text)

    def _analyze_lexicon(self, text: str) -> SentimentResult:
        """Rule-based lexicon sentiment analysis."""
        # Tokenize
        words = re.findall(r"[а-яіїєґА-ЯІЇЄҐa-zA-Z']+", text.lower())

        if not words:
            return SentimentResult(
                text=text[:200],
                label="neutral",
                score=0.0,
                confidence=0.3,
            )

        positive_count = 0
        negative_count = 0
        intensifier_active = False
        negator_active = False

        for word in words:
            # Check intensifiers
            if word in INTENSIFIERS:
                intensifier_active = True
                continue

            # Check negators
            if word in NEGATORS:
                negator_active = True
                continue

            multiplier = 1.5 if intensifier_active else 1.0

            if word in POSITIVE_WORDS:
                if negator_active:
                    negative_count += multiplier
                else:
                    positive_count += multiplier
            elif word in NEGATIVE_WORDS:
                if negator_active:
                    positive_count += multiplier * 0.5  # Negated negative is weakly positive
                else:
                    negative_count += multiplier

            intensifier_active = False
            negator_active = False

        total = positive_count + negative_count
        if total == 0:
            score = 0.0
            label = "neutral"
            confidence = 0.4
        else:
            score = (positive_count - negative_count) / total
            confidence = min(0.9, total / len(words) * 3)

            if score > 0.2:
                label = "positive"
            elif score < -0.2:
                label = "negative"
            elif positive_count > 0 and negative_count > 0:
                label = "mixed"
            else:
                label = "neutral"

        return SentimentResult(
            text=text[:200],
            label=label,
            score=round(score, 3),
            confidence=round(confidence, 3),
            emotions=self._detect_emotions(text),
            method="lexicon",
        )

    def _detect_emotions(self, text: str) -> dict[str, float]:
        """Detect emotions in text."""
        words = set(re.findall(r"[а-яіїєґА-ЯІЇЄҐa-zA-Z']+", text.lower()))
        emotions = {}

        for emotion, keywords in EMOTION_KEYWORDS.items():
            overlap = words & keywords
            if overlap:
                emotions[emotion] = round(len(overlap) / len(keywords), 2)

        return emotions


# Singleton
_sentiment_analyzer: SentimentAnalyzer | None = None


def get_sentiment_analyzer() -> SentimentAnalyzer:
    """Get sentiment analyzer singleton."""
    global _sentiment_analyzer
    if _sentiment_analyzer is None:
        _sentiment_analyzer = SentimentAnalyzer()
    return _sentiment_analyzer
