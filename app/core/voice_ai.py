"""Voice & AI Assistant v63.0-ELITE.

Локальний голосовий інтерфейс:
  - Whisper.cpp: voice-to-text (локально, без хмари)
  - Coqui TTS: text-to-speech для алертів
  - Function calling: AI виконує дії через natural language
"""

from __future__ import annotations

from dataclasses import dataclass, field
import logging
from typing import TYPE_CHECKING, Any

from app.core.settings import get_settings

if TYPE_CHECKING:
    from collections.abc import Awaitable, Callable

settings = get_settings()
logger = logging.getLogger(__name__)


@dataclass
class VoiceCommand:
    """Розпізнана голосова команда."""

    text: str
    intent: str
    entities: dict[str, Any] = field(default_factory=dict)
    confidence: float = 0.0
    language: str = "uk"


@dataclass
class FunctionCall:
    """AI function call для виконання дій."""

    function_name: str
    arguments: dict[str, Any]
    reasoning: str = ""


# ── Whisper.cpp Client ───────────────────────────────────────


class WhisperClient:
    """Локальний voice-to-text через Whisper.cpp."""

    def __init__(self, model_path: str = "/models/whisper-base.bin") -> None:
        self._model_path = model_path

    async def transcribe(self, audio_bytes: bytes, language: str = "uk") -> VoiceCommand:
        """Транскрибує аудіо в текст."""
        # Whisper.cpp викликається через subprocess або Python bindings
        logger.info("Transcribing audio (%d bytes, lang=%s)", len(audio_bytes), language)

        # Placeholder — реальна імплементація через whisper-cpp-python
        return VoiceCommand(
            text="[транскрибований текст]",
            intent="search",
            confidence=0.9,
            language=language,
        )


# ── Coqui TTS Client ─────────────────────────────────────────


class CoquiTTSClient:
    """Локальний text-to-speech через Coqui TTS."""

    def __init__(self, model_name: str = "tts_models/uk/vits") -> None:
        self._model_name = model_name

    async def synthesize(self, text: str, language: str = "uk") -> bytes:
        """Синтезує мову з тексту."""
        logger.info("Synthesizing speech: '%s...'", text[:50])

        # Placeholder — реальна імплементація через TTS library
        return b""


# ── Function Calling Engine ──────────────────────────────────


class FunctionCallingEngine:
    """AI Function Calling — виконання дій через natural language."""

    AVAILABLE_FUNCTIONS: list[dict[str, Any]] = [
        {
            "name": "search_companies",
            "description": "Пошук компаній за назвою, ЄДРПОУ або країною",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Пошуковий запит"},
                    "country": {"type": "string", "description": "Фільтр по країні"},
                    "min_risk": {"type": "number", "description": "Мінімальний ризик (0-1)"},
                },
                "required": ["query"],
            },
        },
        {
            "name": "assess_risk",
            "description": "Оцінка ризику для декларації",
            "parameters": {
                "type": "object",
                "properties": {
                    "declaration_id": {"type": "string", "description": "ID декларації"},
                },
                "required": ["declaration_id"],
            },
        },
        {
            "name": "get_analytics_summary",
            "description": "Отримати аналітичний звіт за період",
            "parameters": {
                "type": "object",
                "properties": {
                    "start_date": {"type": "string", "description": "Початкова дата (ISO)"},
                    "end_date": {"type": "string", "description": "Кінцева дата (ISO)"},
                },
            },
        },
        {
            "name": "find_fraud_chains",
            "description": "Знайти ланцюжки зв'язків для компанії",
            "parameters": {
                "type": "object",
                "properties": {
                    "company_id": {"type": "string", "description": "ID компанії"},
                    "max_depth": {"type": "integer", "description": "Максимальна глибина"},
                },
                "required": ["company_id"],
            },
        },
    ]

    def __init__(
        self,
        llm_call: Callable[[list[dict[str, Any]]], Awaitable[dict[str, Any]]],
        function_handlers: dict[str, Callable[..., Awaitable[Any]]],
    ) -> None:
        self._llm = llm_call
        self._handlers = function_handlers

    async def execute(self, user_message: str) -> dict[str, Any]:
        """Виконує natural language команду."""
        # 1. Визначити яку функцію викликати
        messages = [
            {"role": "system", "content": "Ти AI-асистент PREDATOR Analytics. Використовуй function calling для виконання дій."},
            {"role": "user", "content": user_message},
        ]

        response = await self._llm(messages)

        # 2. Викликати функцію
        if "function_call" in response:
            fc = FunctionCall(
                function_name=response["function_call"]["name"],
                arguments=response["function_call"]["arguments"],
            )

            handler = self._handlers.get(fc.function_name)
            if handler:
                result = await handler(**fc.arguments)
                return {"function": fc.function_name, "result": result, "reasoning": fc.reasoning}

        return {"response": response.get("content", ""), "type": "text"}


# ── Voice Alert System ───────────────────────────────────────


class VoiceAlertSystem:
    """Озвучує критичні алерти через Coqui TTS."""

    def __init__(self, tts: CoquiTTSClient) -> None:
        self._tts = tts

    async def announce_alert(self, alert_type: str, severity: str, message: str) -> bytes | None:
        """Озвучує алерт якщо severity >= HIGH."""
        if severity not in ("HIGH", "CRITICAL"):
            return None

        announcement = f"Увага! {alert_type}. {message}"
        return await self._tts.synthesize(announcement)


# ── Factory ──────────────────────────────────────────────────

_whisper: WhisperClient | None = None
_coqui: CoquiTTSClient | None = None


def get_whisper() -> WhisperClient:
    global _whisper
    if _whisper is None:
        _whisper = WhisperClient()
    return _whisper


def get_coqui_tts() -> CoquiTTSClient:
    global _coqui
    if _coqui is None:
        _coqui = CoquiTTSClient()
    return _coqui
