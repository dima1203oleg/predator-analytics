"""Document Analysis Tools — аналіз документів та метаданих."""
from .tika_client import TikaTool
from .lexnlp_client import LexNLPTool
from .openrefine_client import OpenRefineTool

__all__ = [
    "TikaTool",
    "LexNLPTool",
    "OpenRefineTool",
]
