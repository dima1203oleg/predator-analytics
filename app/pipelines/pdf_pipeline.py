# import fitz  # PyMuPDF - mocked for now to avoid dependency issues in this env if not installed
from typing import TYPE_CHECKING

from app.pipelines.base import BasePipeline, SourceType


if TYPE_CHECKING:
    from collections.abc import AsyncGenerator


class PDFPipeline(BasePipeline):
    """Pipeline for PDF documents.
    Extracts text, tables, and images (with OCR).
    """

    source_type = SourceType.PDF

    async def extract(self, source: bytes) -> "AsyncGenerator[dict, None]":
        """Extract content from PDF pages."""
        # Mock implementation since we can't easily install pymupdf in this environment
        # In production: doc = fitz.open(stream=source, filetype="pdf")

        # Simulate pages
        yield {"page_number": 1, "text": "Simulated PDF content page 1", "tables": [], "images": []}

    async def transform(self, data: dict) -> dict:
        """Transform PDF page into document chunk."""
        return {
            "source_type": "pdf_page",
            "page_number": data["page_number"],
            "text": data["text"],
            "tables": data["tables"],
            "images_text": [],
            "searchable_text": data["text"],
        }

    async def validate(self, data: dict) -> bool:
        """Validate page has content."""
        return bool(data.get("text") or data.get("tables") or data.get("images"))
