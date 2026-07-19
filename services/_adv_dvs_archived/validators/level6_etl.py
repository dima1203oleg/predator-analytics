"""
Рівень 6: Перевірка ETL та CDC.
Імпорт CSV/Excel/JSON/XML/PDF/DOCX, очищення, дедуплікація, нормалізація.
"""
import os
from pathlib import Path
from typing import Dict, Any

from .base import BaseValidator, CheckResult
TARGET_HOST = os.getenv("TARGET_HOST", "localhost")


class EtlValidator(BaseValidator):
    def __init__(self):
        super().__init__(
            name="level6_etl",
            description="ETL/CDC: імпорт файлів, трансформації, синхронізація сховищ",
        )

    async def _run_validation(self):
        project_root = Path(os.getenv("PREDATOR_ROOT", Path(__file__).resolve().parent.parent.parent.parent))

        # 1. Перевірка наявності ETL модулів
        await self._check_etl_modules(project_root)
        # 2. Перевірка ingestion worker
        await self._check_ingestion_worker(project_root)
        # 3. Перевірка конфігурацій ETL
        await self._check_etl_configs(project_root)
        # 4. Перевірка тестових даних
        await self._check_test_data(project_root)

    async def _check_etl_modules(self, root: Path):
        """Перевірка наявності ETL модулів."""
        modules = {
            "ingestion_worker": root / "services" / "ingestion-worker",
            "ingestion_init": root / "services" / "ingestion-worker" / "app" / "__init__.py",
            "ingestion_dockerfile": root / "services" / "ingestion-worker" / "Dockerfile",
        }

        for name, path in modules.items():
            exists = path.exists()
            self.add_check(CheckResult(
                name=f"etl_module_{name}",
                passed=exists,
                message=f"{'Знайдено' if exists else 'Відсутній'}: {path.name}",
                severity="warning" if not exists else "info",
                details={"path": str(path)},
            ))

    async def _check_ingestion_worker(self, root: Path):
        """Перевірка ingestion worker коду."""
        worker_dir = root / "services" / "ingestion-worker"
        if not worker_dir.exists():
            self.add_check(CheckResult(
                name="ingestion_worker_dir",
                passed=False,
                message="Директорія ingestion-worker відсутня",
                severity="critical",
            ))
            return

        # Перевіряємо ключові файли
        key_files = ["app/main.py", "app/consumer.py", "app/parsers", "Dockerfile", "requirements.txt"]
        found = []
        missing = []
        for f in key_files:
            p = worker_dir / f
            if p.exists():
                found.append(f)
            else:
                missing.append(f)

        self.add_check(CheckResult(
            name="ingestion_worker_files",
            passed=len(missing) == 0,
            message=f"Знайдено {len(found)}/{len(key_files)} ключових файлів worker",
            severity="warning" if missing else "info",
            details={"found": found, "missing": missing},
        ))

    async def _check_etl_configs(self, root: Path):
        """Перевірка конфігурацій ETL."""
        # Kafka topics конфігурація
        kafka_init = root / "deploy" / "scripts"
        if kafka_init.exists():
            scripts = list(kafka_init.glob("*kafka*")) + list(kafka_init.glob("*topic*"))
            self.add_check(CheckResult(
                name="kafka_topic_scripts",
                passed=len(scripts) > 0,
                message=f"Знайдено {len(scripts)} скриптів Kafka topics",
                severity="info",
                details={"scripts": [s.name for s in scripts]},
            ))

    async def _check_test_data(self, root: Path):
        """Перевірка наявності тестових даних."""
        data_dirs = [
            root / "data",
            root / "tests" / "fixtures",
            root / "tests" / "e2e",
        ]
        for d in data_dirs:
            exists = d.exists()
            if exists:
                files = list(d.rglob("*"))
                file_count = len([f for f in files if f.is_file()])
                self.add_check(CheckResult(
                    name=f"test_data_{d.name}",
                    passed=file_count > 0,
                    message=f"Директорія {d.name}: {file_count} файлів",
                    severity="info",
                    details={"path": str(d), "file_count": file_count},
                ))
