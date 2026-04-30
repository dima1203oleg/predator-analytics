"""Apache Tika Tool — витягування тексту та метаданих з документів."""
import base64
import logging
from datetime import UTC, datetime
from typing import Any

import httpx

from app.tools.base import BaseTool, ToolResult, ToolStatus

logger = logging.getLogger(__name__)


class TikaTool(BaseTool):
    """Адаптер для Apache Tika.

    Apache Tika — бібліотека для витягування тексту та метаданих
    з 1000+ форматів файлів (PDF, DOCX, XLSX, images, etc.).

    Можливості:
    - Витягування тексту
    - Метадані документів
    - Визначення типу файлу
    - OCR для зображень
    - Аналіз структури

    GitHub: https://github.com/apache/tika
    """

    name = "tika"
    description = "Apache Tika — витягування тексту та метаданих з документів"
    version = "2.9"
    categories = ["documents", "metadata", "text_extraction"]
    supported_targets = ["file", "url"]

    # Підтримувані формати
    SUPPORTED_FORMATS = {
        "pdf": "application/pdf",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "doc": "application/msword",
        "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "xls": "application/vnd.ms-excel",
        "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "txt": "text/plain",
        "html": "text/html",
        "xml": "application/xml",
        "json": "application/json",
        "csv": "text/csv",
        "rtf": "application/rtf",
        "odt": "application/vnd.oasis.opendocument.text",
        "jpg": "image/jpeg",
        "png": "image/png",
        "gif": "image/gif",
        "tiff": "image/tiff",
        "bmp": "image/bmp",
    }

    def __init__(self, tika_url: str = "http://localhost:9998", timeout: int = 60):
        """Ініціалізація."""
        super().__init__(timeout)
        self.tika_url = tika_url

    async def is_available(self) -> bool:
        """Перевірка доступності Tika сервера."""
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                response = await client.get(f"{self.tika_url}/tika")
                return response.status_code == 200
        except Exception:
            return False

    async def run(self, target: str, options: dict[str, Any] | None = None) -> ToolResult:
        """Аналіз документа.

        Args:
            target: Шлях до файлу або base64-encoded content
            options: Додаткові опції:
                - extract_text: витягувати текст (default: True)
                - extract_metadata: витягувати метадані (default: True)
                - ocr: використовувати OCR (default: False)
                - language: мова для OCR (default: "ukr+eng")

        Returns:
            ToolResult з текстом та метаданими
        """
        start_time = datetime.now(UTC)
        options = options or {}

        extract_text = options.get("extract_text", True)
        extract_metadata = options.get("extract_metadata", True)
        use_ocr = options.get("ocr", False)

        findings = []
        text_content = ""
        metadata = {}

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # Визначаємо тип контенту
                if target.startswith("data:") or len(target) > 1000:
                    # Base64 encoded
                    content = base64.b64decode(target.split(",")[1]) if "," in target else base64.b64decode(target)
                    content_type = "application/octet-stream"
                else:
                    # Файл або URL
                    if target.startswith("http"):
                        # URL — завантажуємо
                        file_response = await client.get(target)
                        content = file_response.content
                        content_type = file_response.headers.get("content-type", "application/octet-stream")
                    else:
                        # Локальний файл
                        with open(target, "rb") as f:
                            content = f.read()
                        # Визначаємо тип за розширенням
                        ext = target.split(".")[-1].lower()
                        content_type = self.SUPPORTED_FORMATS.get(ext, "application/octet-stream")

                headers = {
                    "Content-Type": content_type,
                    "Accept": "application/json",
                }

                if use_ocr:
                    headers["X-Tika-OCRLanguage"] = options.get("language", "ukr+eng")
                    headers["X-Tika-PDFextractInlineImages"] = "true"

                # Витягуємо метадані
                if extract_metadata:
                    meta_response = await client.put(
                        f"{self.tika_url}/meta",
                        content=content,
                        headers=headers,
                    )
                    if meta_response.status_code == 200:
                        metadata = meta_response.json()

                        # Аналізуємо метадані для findings
                        if metadata.get("Author"):
                            findings.append({
                                "type": "author",
                                "value": metadata["Author"],
                                "confidence": 0.95,
                                "source": "tika",
                            })

                        if metadata.get("creator"):
                            findings.append({
                                "type": "creator_software",
                                "value": metadata["creator"],
                                "confidence": 0.9,
                                "source": "tika",
                            })

                        if metadata.get("Last-Modified"):
                            findings.append({
                                "type": "last_modified",
                                "value": metadata["Last-Modified"],
                                "confidence": 0.95,
                                "source": "tika",
                            })

                        # GPS координати (для зображень)
                        if metadata.get("geo:lat") and metadata.get("geo:long"):
                            findings.append({
                                "type": "geolocation",
                                "value": f"{metadata['geo:lat']}, {metadata['geo:long']}",
                                "confidence": 0.95,
                                "source": "tika",
                                "metadata": {
                                    "lat": metadata["geo:lat"],
                                    "lon": metadata["geo:long"],
                                },
                            })

                # Витягуємо текст
                if extract_text:
                    text_response = await client.put(
                        f"{self.tika_url}/tika",
                        content=content,
                        headers={**headers, "Accept": "text/plain"},
                    )
                    if text_response.status_code == 200:
                        text_content = text_response.text.strip()

        except httpx.TimeoutException:
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.TIMEOUT,
                errors=["Таймаут запиту до Tika"],
                duration_seconds=(datetime.now(UTC) - start_time).total_seconds(),
            )
        except FileNotFoundError:
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.ERROR,
                errors=[f"Файл не знайдено: {target}"],
                duration_seconds=(datetime.now(UTC) - start_time).total_seconds(),
            )
        except Exception as e:
            logger.error(f"Tika error: {e}")
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.ERROR,
                errors=[str(e)],
                duration_seconds=(datetime.now(UTC) - start_time).total_seconds(),
            )

        duration = (datetime.now(UTC) - start_time).total_seconds()

        return ToolResult(
            tool_name=self.name,
            status=ToolStatus.SUCCESS,
            data={
                "text": text_content[:50000] if text_content else "",  # Обмежуємо
                "text_length": len(text_content),
                "metadata": metadata,
                "content_type": metadata.get("Content-Type", "unknown"),
                "page_count": metadata.get("xmpTPg:NPages"),
                "word_count": len(text_content.split()) if text_content else 0,
            },
            findings=findings,
            duration_seconds=duration,
        )

    async def detect_type(self, content: bytes) -> str:
        """Визначення типу файлу."""
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.put(
                    f"{self.tika_url}/detect/stream",
                    content=content,
                )
                if response.status_code == 200:
                    return response.text.strip()
        except Exception as e:
            logger.error(f"Tika detect error: {e}")
        return "application/octet-stream"
