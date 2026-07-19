import os
"""
Рівень 9: Перевірка генерації датасетів.
Формування, очищення, feature engineering, версіонування, Parquet, MinIO.
"""
from pathlib import Path
from .base import BaseValidator, CheckResult
from .. import config
TARGET_HOST = os.getenv("TARGET_HOST", "localhost")


class DatasetsValidator(BaseValidator):
    def __init__(self):
        super().__init__(
            name="level9_datasets",
            description="Генерація датасетів: очищення, features, версіонування, Parquet",
        )

    async def _run_validation(self):
        root = Path(os.getenv("PREDATOR_ROOT", Path(__file__).resolve().parent.parent.parent.parent))

        # 1. Перевірка модуля datasets
        await self._check_dataset_module(root)
        # 2. Перевірка MinIO для зберігання
        await self.http_check(
            "minio_for_datasets",
            f"{config.MINIO_URL}{config.MINIO_HEALTH_PATH}",
            severity="warning",
        )
        # 3. Pandas / PyArrow для Parquet
        await self._check_parquet_support()

    async def _check_dataset_module(self, root: Path):
        """Перевірка наявності модуля генерації датасетів."""
        possible_paths = [
            root / "services" / "core-api" / "datasets",
            root / "services" / "core-api" / "ml",
            root / "libs" / "predator-common" / "datasets",
            root / "services" / "ingestion-worker" / "datasets",
        ]
        found_any = False
        for p in possible_paths:
            if p.exists():
                files = list(p.rglob("*.py"))
                found_any = True
                self.add_check(CheckResult(
                    name=f"dataset_module_{p.parent.name}_{p.name}",
                    passed=len(files) > 0,
                    message=f"Модуль {p.name}: {len(files)} файлів",
                    severity="info",
                ))
        if not found_any:
            self.add_check(CheckResult(
                name="dataset_module",
                passed=False,
                message="Модуль генерації датасетів не знайдено (буде створено при розгортанні)",
                severity="warning",
            ))

    async def _check_parquet_support(self):
        """Перевірка бібліотек для Parquet."""
        try:
            import pandas as pd
            self.add_check(CheckResult(
                name="pandas_available",
                passed=True,
                message=f"Pandas v{pd.__version__} (Parquet підтримка)",
                severity="info",
            ))
        except ImportError:
            self.add_check(CheckResult(
                name="pandas_available",
                passed=False,
                message="Pandas не встановлений",
                severity="warning",
            ))

        try:
            import pyarrow
            self.add_check(CheckResult(
                name="pyarrow_available",
                passed=True,
                message=f"PyArrow v{pyarrow.__version__} (Parquet engine)",
                severity="info",
            ))
        except ImportError:
            self.add_check(CheckResult(
                name="pyarrow_available",
                passed=False,
                message="PyArrow не встановлений (потрібен у Docker)",
                severity="info",
            ))
