import os
"""
Рівень 16: Перевірка резервного копіювання.
Бекапи PostgreSQL, Neo4j, MinIO, конфігурації, відновлення.
"""
from pathlib import Path
from .base import BaseValidator, CheckResult
TARGET_HOST = os.getenv("TARGET_HOST", "localhost")


class BackupValidator(BaseValidator):
    def __init__(self):
        super().__init__(
            name="level16_backup",
            description="Резервне копіювання: бекапи БД, конфігурації, відновлення",
        )

    async def _run_validation(self):
        root = Path(os.getenv("PREDATOR_ROOT", Path(__file__).resolve().parent.parent.parent.parent))

        # 1. Перевірка скриптів бекапу
        await self._check_backup_scripts(root)
        # 2. Перевірка docker volumes
        await self._check_volume_persistence(root)
        # 3. Перевірка конфігурацій
        await self._check_configs_backed(root)

    async def _check_backup_scripts(self, root: Path):
        """Перевірка наявності скриптів бекапу."""
        backup_paths = [
            root / "deploy" / "scripts",
            root / "scripts",
            root / "deploy" / "backup",
        ]
        backup_files = []
        for p in backup_paths:
            if p.exists():
                backup_files.extend([
                    f for f in p.rglob("*")
                    if f.is_file() and any(kw in f.name.lower() for kw in ("backup", "restore", "dump", "snapshot"))
                ])

        self.add_check(CheckResult(
            name="backup_scripts",
            passed=len(backup_files) > 0,
            message=f"Знайдено {len(backup_files)} скриптів бекапу" if backup_files
                    else "Скрипти бекапу не знайдені",
            severity="warning" if not backup_files else "info",
            details={"files": [f.name for f in backup_files[:10]]},
        ))

    async def _check_volume_persistence(self, root: Path):
        """Перевірка docker-compose volumes (persistent data)."""
        compose = root / "deploy" / "docker-compose.yml"
        if compose.exists():
            content = compose.read_text()
            volumes_section = "volumes:" in content
            named_volumes = content.count("data:") + content.count("data\n")
            self.add_check(CheckResult(
                name="docker_volumes_defined",
                passed=volumes_section,
                message=f"Docker volumes визначені у docker-compose.yml" if volumes_section
                        else "Volumes не визначені",
                severity="info",
            ))
        else:
            self.add_check(CheckResult(
                name="docker_volumes_defined",
                passed=False,
                message="docker-compose.yml не знайдено",
                severity="warning",
            ))

    async def _check_configs_backed(self, root: Path):
        """Перевірка що критичні конфігурації збережені."""
        critical_configs = {
            "docker-compose.yml": root / "deploy" / "docker-compose.yml",
            "init.sql": root / "db" / "postgres" / "init.sql",
            ".env.example": root / ".env.example",
        }
        for name, path in critical_configs.items():
            self.add_check(CheckResult(
                name=f"config_{name.replace('.', '_').replace('-', '_')}",
                passed=path.exists(),
                message=f"Конфігурація {name}: {'✓' if path.exists() else '✗'}",
                severity="info",
            ))
