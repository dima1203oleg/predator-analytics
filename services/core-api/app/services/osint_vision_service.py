import json
import logging
from typing import Any
from app.services.gemini_agent_service import gemini_service

logger = logging.getLogger(__name__)

class OSINTVisionService:
    """Сервіс для інтелектуального аналізу документів (OSINT + Vision)."""

    @staticmethod
    async def parse_customs_declaration(image_bytes: bytes, mime_type: str = "image/jpeg") -> dict[str, Any]:
        """Використовує Gemini Vision для парсингу митних декларацій."""
        
        prompt = """
        Ти — експерт з митної аналітики України. Проаналізуй цей документ (митна декларація) та витягни наступні дані у форматі JSON:
        {
          "declaration_id": "номер декларації",
          "exporter": "відправник",
          "importer": "отримувач",
          "goods_description": "опис товарів",
          "total_weight": "вага",
          "currency": "валюта",
          "total_value": number,
          "risk_assessment": "короткий опис ризиків (аномальна ціна, санкційні товари тощо)",
          "is_suspicious": boolean
        }
        Відповідай ТІЛЬКИ чистим JSON.
        """
        
        try:
            result = await gemini_service.analyze_vision(prompt, image_bytes, mime_type)
            # Спроба парсингу JSON з тексту
            content = result.get("content", "{}")
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
                
            return json.loads(content)
        except Exception as e:
            logger.error(f"Failed to parse declaration via Gemini Vision: {e}")
            return {"error": str(e), "is_suspicious": True}

osint_vision_service = OSINTVisionService()
