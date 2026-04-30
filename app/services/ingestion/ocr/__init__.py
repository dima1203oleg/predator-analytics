from functools import lru_cache

from .ocr_worker import OCRWorker


@lru_cache
def get_ocr_worker() -> OCRWorker:
    return OCRWorker()

__all__ = ["OCRWorker", "get_ocr_worker"]
