from typing import AsyncGenerator, Dict, Any, List
import re

from app.pipelines.base import BasePipeline, SourceType

class TelegramPipeline(BasePipeline):
    """
    Pipeline for Telegram channels.
    Processes text, photos, documents, audio, video.
    """

    source_type = SourceType.TELEGRAM

    async def extract(self, source: Dict) -> AsyncGenerator[Dict, None]:
        """
        source = {
            "channel": "@channel_name",
            "messages": [...]
        }
        """
        messages = source.get("messages", [])
        for msg in messages:
            yield msg

    async def transform(self, data: Dict) -> Dict:
        """
        Transform Telegram message.
        """
        doc = {
            "source_type": "telegram",
            "channel": data.get("channel", ""),
            "message_id": data.get("id"),
            "date": data.get("date"),
            "raw_text": data.get("text", ""),
            "media": [],
            "extracted_text": "",
            "entities": []
        }

        # Text Processing
        if doc["raw_text"]:
            doc["extracted_text"] = doc["raw_text"]
            doc["entities"] = self._extract_entities(doc["raw_text"])

        # Searchable text
        doc["searchable_text"] = doc["extracted_text"]

        return doc

    def _extract_entities(self, text: str) -> List[Dict]:
        """Extract entities using regex"""
        entities = []
        if not text:
            return entities

        # EDRPOU (8 digits)
        edrpou_matches = re.findall(r'\b\d{8}\b', text)
        for match in edrpou_matches:
            entities.append({"type": "edrpou", "value": match})

        return entities

    async def validate(self, data: Dict) -> bool:
        """Validate message has content"""
        # Must have text or media
        return bool(data.get("text") or data.get("photo") or data.get("document"))
