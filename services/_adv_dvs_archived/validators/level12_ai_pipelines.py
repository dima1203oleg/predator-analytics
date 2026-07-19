import os
"""
Рівень 12: Перевірка AI-пайплайнів.
Embeddings, векторний пошук, RAG, ранжування, Risk Engine.
"""
from pathlib import Path
from .base import BaseValidator, CheckResult
from .. import config
TARGET_HOST = os.getenv("TARGET_HOST", "localhost")


class AiPipelinesValidator(BaseValidator):
    def __init__(self):
        super().__init__(
            name="level12_ai_pipelines",
            description="AI пайплайни: embeddings, RAG, векторний пошук, Risk Engine",
        )

    async def _run_validation(self):
        # 1. Qdrant для векторного пошуку
        await self.http_check("qdrant_for_ai", f"{config.QDRANT_URL}/healthz", severity="warning")

        # 2. Ollama для embeddings
        await self.http_check("ollama_for_embeddings", config.OLLAMA_URL, severity="warning")

        # 3. Перевірка AI модулів у кодовій базі
        await self._check_ai_modules()

        # 4. LiteLLM як AI proxy
        await self.http_check("litellm_for_ai", f"{config.LITELLM_URL}/health", severity="warning")

    async def _check_ai_modules(self):
        """Перевірка AI модулів."""
        root = Path(os.getenv("PREDATOR_ROOT", Path(__file__).resolve().parent.parent.parent.parent))
        ai_paths = {
            "risk_engine": root / "services" / "core-api" / "risk",
            "ai_module": root / "services" / "core-api" / "ai",
            "insight_engine": root / "services" / "core-api" / "insights",
            "rag_module": root / "services" / "core-api" / "rag",
            "embeddings": root / "libs" / "predator-common" / "embeddings",
        }
        found_any = False
        for name, path in ai_paths.items():
            if path.exists():
                found_any = True
                py_files = list(path.rglob("*.py"))
                self.add_check(CheckResult(
                    name=f"ai_{name}",
                    passed=len(py_files) > 0,
                    message=f"AI модуль {name}: {len(py_files)} файлів",
                    severity="info",
                ))

        if not found_any:
            # Пошук AI-пов'язаних файлів ширше
            core_api = root / "services" / "core-api"
            if core_api.exists():
                ai_files = [
                    f for f in core_api.rglob("*.py")
                    if any(kw in f.name.lower() for kw in ("risk", "ai", "rag", "embed", "insight", "predict"))
                ]
                self.add_check(CheckResult(
                    name="ai_related_files",
                    passed=len(ai_files) > 0,
                    message=f"Знайдено {len(ai_files)} AI-пов'язаних файлів у core-api",
                    severity="warning" if not ai_files else "info",
                    details={"files": [f.name for f in ai_files[:10]]},
                ))
