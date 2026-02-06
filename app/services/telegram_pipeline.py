from __future__ import annotations


"""Telegram Intelligence Pipeline.

Повний пайплайн для парсингу Telegram каналів:
- Текстові повідомлення
- Аудіо повідомлення (voice)
- Відео повідомлення
- Документи (PDF, Excel, Word)
- Зображення з текстом (OCR)
- Автоматична класифікація та роутинг до баз даних
"""

import asyncio
from datetime import UTC, datetime, timezone
import hashlib
import json
import logging
import os
from pathlib import Path
import tempfile
from typing import Any, Dict, List, Optional, Union

from .document_processor import get_document_processor
from .media_processor import get_media_processor


logger = logging.getLogger("pipeline.telegram")


class ContentRouter:
    """Роутер контенту до відповідних баз даних."""

    # Категорії та відповідні бази даних
    ROUTING_MAP = {
        "customs_intelligence": {
            "primary_db": "opensearch",
            "index": "customs_intel",
            "vector_db": "qdrant",
            "collection": "customs_embeddings"
        },
        "business_intelligence": {
            "primary_db": "opensearch",
            "index": "business_intel",
            "vector_db": "qdrant",
            "collection": "business_embeddings"
        },
        "general_intelligence": {
            "primary_db": "opensearch",
            "index": "general_intel",
            "vector_db": None
        },
        "documents": {
            "primary_db": "postgresql",
            "table": "documents",
            "storage": "minio",
            "bucket": "documents"
        },
        "media_transcripts": {
            "primary_db": "opensearch",
            "index": "media_transcripts",
            "vector_db": "qdrant",
            "collection": "transcript_embeddings"
        },
        "noise": {
            "primary_db": None,  # Не зберігаємо
            "archive": True
        }
    }

    @classmethod
    def get_destination(cls, category: str) -> dict[str, Any]:
        """Отримати призначення для категорії контенту."""
        return cls.ROUTING_MAP.get(category, cls.ROUTING_MAP["general_intelligence"])


class TelegramIntelligencePipeline:
    """Інтелектуальний пайплайн обробки Telegram контенту."""

    def __init__(self):
        self.doc_processor = get_document_processor()
        self.media_processor = get_media_processor()
        self.temp_dir = os.getenv("TELEGRAM_TEMP_DIR", "/tmp/telegram_pipeline")
        os.makedirs(self.temp_dir, exist_ok=True)

        # Статистика
        self.stats = {
            "processed": 0,
            "valuable": 0,
            "noise": 0,
            "errors": 0
        }

    async def process_message(
        self,
        message: dict[str, Any],
        channel_info: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        """Обробка одного повідомлення з Telegram."""
        result = {
            "message_id": message.get("id"),
            "channel": channel_info.get("name") if channel_info else "unknown",
            "timestamp": message.get("date"),
            "processed_at": datetime.now(UTC).isoformat(),
            "content_type": "unknown",
            "extracted_data": {},
            "classification": {},
            "routing": {},
            "status": "pending"
        }

        try:
            # Визначення типу контенту
            content_type = self._detect_content_type(message)
            result["content_type"] = content_type

            # Обробка відповідно до типу
            if content_type == "text":
                extracted = await self._process_text_message(message)
            elif content_type == "voice":
                extracted = await self._process_voice_message(message)
            elif content_type == "video":
                extracted = await self._process_video_message(message)
            elif content_type == "video_note":
                extracted = await self._process_video_note(message)
            elif content_type == "document":
                extracted = await self._process_document(message)
            elif content_type == "photo":
                extracted = await self._process_photo(message)
            elif content_type == "audio":
                extracted = await self._process_audio_file(message)
            else:
                extracted = {"text": "", "warning": f"Невідомий тип: {content_type}"}

            result["extracted_data"] = extracted

            # Класифікація контенту
            text_content = extracted.get("text", "") or extracted.get("transcript", "")
            classification = await self._classify_and_enrich(text_content, content_type, message)
            result["classification"] = classification

            # Роутинг до баз даних
            routing = ContentRouter.get_destination(classification.get("category", "general_intelligence"))
            result["routing"] = routing

            # Оновлення статистики
            self.stats["processed"] += 1
            if classification.get("is_valuable"):
                self.stats["valuable"] += 1
            else:
                self.stats["noise"] += 1

            result["status"] = "completed"

        except Exception as e:
            logger.exception(f"Помилка обробки повідомлення {message.get('id')}: {e}")
            result["status"] = "error"
            result["error"] = str(e)
            self.stats["errors"] += 1

        return result

    def _detect_content_type(self, message: dict[str, Any]) -> str:
        """Визначення типу контенту повідомлення."""
        if message.get("voice"):
            return "voice"
        if message.get("video_note"):
            return "video_note"
        if message.get("video"):
            return "video"
        if message.get("audio"):
            return "audio"
        if message.get("document"):
            return "document"
        if message.get("photo"):
            return "photo"
        if message.get("text") or message.get("caption"):
            return "text"
        return "unknown"

    async def _process_text_message(self, message: dict[str, Any]) -> dict[str, Any]:
        """Обробка текстового повідомлення."""
        text = message.get("text", "") or message.get("caption", "")

        # Витягнення сутностей (mentions, hashtags, urls)
        entities = []
        for entity in message.get("entities", []):
            entity_type = entity.get("type")
            offset = entity.get("offset", 0)
            length = entity.get("length", 0)
            entity_text = text[offset:offset + length]

            entities.append({
                "type": entity_type,
                "text": entity_text,
                "offset": offset
            })

        return {
            "text": text,
            "entities": entities,
            "has_urls": any(e["type"] == "url" for e in entities),
            "has_mentions": any(e["type"] == "mention" for e in entities),
            "char_count": len(text),
            "word_count": len(text.split())
        }

    async def _process_voice_message(self, message: dict[str, Any]) -> dict[str, Any]:
        """Обробка голосового повідомлення."""
        voice = message.get("voice", {})

        # Тут буде логіка завантаження файлу через Telethon
        # Поки що заглушка
        file_path = voice.get("file_path")

        if file_path and os.path.exists(file_path):
            result = await self.media_processor.process_audio(file_path)
            return {
                "transcript": result.get("transcript", {}).get("text", ""),
                "duration": voice.get("duration", 0),
                "file_size": voice.get("file_size", 0),
                "language": result.get("transcript", {}).get("language", "uk"),
                "confidence": result.get("classification", {}).get("confidence", 0),
                "segments": result.get("transcript", {}).get("segments", [])
            }

        return {
            "duration": voice.get("duration", 0),
            "file_size": voice.get("file_size", 0),
            "pending_download": True,
            "mime_type": voice.get("mime_type", "audio/ogg")
        }

    async def _process_video_message(self, message: dict[str, Any]) -> dict[str, Any]:
        """Обробка відео повідомлення."""
        video = message.get("video", {})
        caption = message.get("caption", "")

        file_path = video.get("file_path")

        if file_path and os.path.exists(file_path):
            result = await self.media_processor.process_video(file_path)
            return {
                "transcript": result.get("transcript", {}).get("text", ""),
                "caption": caption,
                "duration": video.get("duration", 0),
                "width": video.get("width", 0),
                "height": video.get("height", 0),
                "file_size": video.get("file_size", 0),
                "frame_texts": result.get("frame_texts", []),
                "has_audio": result.get("metadata", {}).get("has_audio", False)
            }

        return {
            "caption": caption,
            "duration": video.get("duration", 0),
            "file_size": video.get("file_size", 0),
            "pending_download": True
        }

    async def _process_video_note(self, message: dict[str, Any]) -> dict[str, Any]:
        """Обробка відео-кружечка (video note)."""
        video_note = message.get("video_note", {})

        file_path = video_note.get("file_path")

        if file_path and os.path.exists(file_path):
            result = await self.media_processor.process_video(file_path)
            return {
                "transcript": result.get("transcript", {}).get("text", ""),
                "duration": video_note.get("duration", 0),
                "length": video_note.get("length", 0),  # діаметр
                "file_size": video_note.get("file_size", 0)
            }

        return {
            "duration": video_note.get("duration", 0),
            "pending_download": True
        }

    async def _process_document(self, message: dict[str, Any]) -> dict[str, Any]:
        """Обробка документів (PDF, Excel, Word, тощо)."""
        document = message.get("document", {})
        caption = message.get("caption", "")
        file_name = document.get("file_name", "")
        mime_type = document.get("mime_type", "")

        file_path = document.get("file_path")

        # Визначення типу документа
        ext = Path(file_name).suffix.lower() if file_name else ""

        if file_path and os.path.exists(file_path):
            # Роутинг до відповідного процесора
            if ext in [".xlsx", ".xls", ".csv"]:
                result = await self.doc_processor.process_file(file_path, "excel")
            elif ext == ".pdf":
                result = await self.doc_processor.process_file(file_path, "pdf")
            elif ext in [".docx", ".doc"]:
                result = await self.doc_processor.process_file(file_path, "word")
            else:
                result = {"status": "unsupported", "extension": ext}

            return {
                "text": result.get("records", [{}])[0].get("full_text", "")[:10000] if result.get("records") else "",
                "file_name": file_name,
                "mime_type": mime_type,
                "file_size": document.get("file_size", 0),
                "caption": caption,
                "processing_result": result.get("status"),
                "metadata": result.get("metadata", {})
            }

        return {
            "file_name": file_name,
            "mime_type": mime_type,
            "file_size": document.get("file_size", 0),
            "caption": caption,
            "pending_download": True
        }

    async def _process_photo(self, message: dict[str, Any]) -> dict[str, Any]:
        """Обробка фото з OCR."""
        photos = message.get("photo", [])
        caption = message.get("caption", "")

        if not photos:
            return {"caption": caption, "text": ""}

        # Беремо найбільше фото
        largest_photo = max(photos, key=lambda p: p.get("file_size", 0))
        file_path = largest_photo.get("file_path")

        if file_path and os.path.exists(file_path):
            result = await self.doc_processor.process_file(file_path, "image")
            extracted_text = ""
            if result.get("records"):
                extracted_text = result["records"][0].get("extracted_text", "")

            return {
                "caption": caption,
                "text": extracted_text,
                "width": largest_photo.get("width", 0),
                "height": largest_photo.get("height", 0),
                "file_size": largest_photo.get("file_size", 0),
                "ocr_confidence": result.get("metadata", {}).get("avg_confidence", 0)
            }

        return {
            "caption": caption,
            "pending_download": True
        }

    async def _process_audio_file(self, message: dict[str, Any]) -> dict[str, Any]:
        """Обробка аудіо файлу (музика, подкаст)."""
        audio = message.get("audio", {})
        caption = message.get("caption", "")

        file_path = audio.get("file_path")

        if file_path and os.path.exists(file_path):
            result = await self.media_processor.process_audio(file_path)
            return {
                "transcript": result.get("transcript", {}).get("text", ""),
                "title": audio.get("title", ""),
                "performer": audio.get("performer", ""),
                "duration": audio.get("duration", 0),
                "caption": caption
            }

        return {
            "title": audio.get("title", ""),
            "performer": audio.get("performer", ""),
            "duration": audio.get("duration", 0),
            "caption": caption,
            "pending_download": True
        }

    async def _classify_and_enrich(
        self,
        text: str,
        content_type: str,
        message: dict[str, Any]
    ) -> dict[str, Any]:
        """Класифікація та збагачення контенту."""
        # Базова класифікація від media_processor
        base_classification = await self.media_processor._classify_content(text)

        # Додаткові фактори
        boost_factors = []

        # Джерело (якщо відомий канал)
        channel = message.get("_channel", {})
        if channel.get("is_priority"):
            base_classification["confidence"] = min(base_classification["confidence"] + 0.1, 0.99)
            boost_factors.append("priority_channel")

        # Тип контенту
        if content_type in ["document", "voice"] and base_classification["is_valuable"]:
            base_classification["confidence"] = min(base_classification["confidence"] + 0.05, 0.99)
            boost_factors.append("high_value_content_type")

        # Довжина контенту
        if len(text) > 500 and base_classification["is_valuable"]:
            base_classification["confidence"] = min(base_classification["confidence"] + 0.05, 0.99)
            boost_factors.append("substantial_content")

        base_classification["boost_factors"] = boost_factors
        base_classification["content_type"] = content_type

        return base_classification

    async def process_channel_batch(
        self,
        messages: list[dict[str, Any]],
        channel_info: dict[str, Any]
    ) -> dict[str, Any]:
        """Обробка пакету повідомлень з каналу."""
        results = []
        valuable_items = []
        noise_items = []

        for message in messages:
            result = await self.process_message(message, channel_info)
            results.append(result)

            if result.get("classification", {}).get("is_valuable"):
                valuable_items.append(result)
            else:
                noise_items.append(result)

        return {
            "channel": channel_info.get("name"),
            "total_processed": len(results),
            "valuable_count": len(valuable_items),
            "noise_count": len(noise_items),
            "valuable_items": valuable_items,
            "noise_items": noise_items,
            "stats": self.stats.copy()
        }

    def get_stats(self) -> dict[str, Any]:
        """Отримати статистику пайплайну."""
        return {
            **self.stats,
            "value_rate": self.stats["valuable"] / max(self.stats["processed"], 1) * 100,
            "error_rate": self.stats["errors"] / max(self.stats["processed"], 1) * 100
        }


# Factory
def get_telegram_pipeline() -> TelegramIntelligencePipeline:
    """Створити новий екземпляр пайплайну."""
    return TelegramIntelligencePipeline()
