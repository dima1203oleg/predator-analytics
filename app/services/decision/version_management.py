"""
🔄 Decision Intelligence Version Management

Система управління версіями та міграціями для Decision Intelligence Engine.
Підтримує:
- Версіонування моделей та конфігурацій
- Автоматичні міграції даних
- Rollback можливості
- Аудит змін версій
- Сумісність версій

Компоненти:
- VersionManager — менеджер версій
- MigrationEngine — двигун міграцій
- ModelVersioner — версіонування моделей
- CompatibilityChecker — перевірка сумісності
"""

import asyncio
import hashlib
import json
import logging
from dataclasses import dataclass
from datetime import UTC, datetime
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

logger = logging.getLogger("predator.decision.version")


class VersionType(str, Enum):
    """Тип версії"""
    MAJOR = "major"
    MINOR = "minor"
    PATCH = "patch"
    HOTFIX = "hotfix"


class MigrationStatus(str, Enum):
    """Статус міграції"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    ROLLED_BACK = "rolled_back"


@dataclass
class Version:
    """Версія системи"""
    major: int
    minor: int
    patch: int
    hotfix: int = 0
    build: Optional[str] = None
    created_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now(UTC)
    
    def __str__(self) -> str:
        version = f"{self.major}.{self.minor}.{self.patch}"
        if self.hotfix > 0:
            version += f".{self.hotfix}"
        if self.build:
            version += f"+{self.build}"
        return version
    
    @classmethod
    def from_string(cls, version_str: str) -> "Version":
        """Створити версію з рядка"""
        parts = version_str.split("+")
        main_part = parts[0]
        build = parts[1] if len(parts) > 1 else None
        
        version_parts = main_part.split(".")
        major = int(version_parts[0])
        minor = int(version_parts[1]) if len(version_parts) > 1 else 0
        patch = int(version_parts[2]) if len(version_parts) > 2 else 0
        hotfix = int(version_parts[3]) if len(version_parts) > 3 else 0
        
        return cls(major, minor, patch, hotfix, build)
    
    def bump(self, version_type: VersionType) -> "Version":
        """Збільшити версію"""
        if version_type == VersionType.MAJOR:
            return Version(self.major + 1, 0, 0, 0)
        elif version_type == VersionType.MINOR:
            return Version(self.major, self.minor + 1, 0, 0)
        elif version_type == VersionType.PATCH:
            return Version(self.major, self.minor, self.patch + 1, 0)
        elif version_type == VersionType.HOTFIX:
            return Version(self.major, self.minor, self.patch, self.hotfix + 1)
        else:
            return self
    
    def is_compatible_with(self, other: "Version") -> bool:
        """Перевірити сумісність версій"""
        # Major версії не сумісні
        if self.major != other.major:
            return False
        
        # Minor версії сумісні в межах одного major
        if self.minor == other.minor:
            return True
        
        # Новіша minor версія може бути несумісною зі старішою
        if self.minor > other.minor:
            return False
        
        return True


@dataclass
class Migration:
    """Міграція"""
    id: str
    version_from: Version
    version_to: Version
    description: str
    sql_up: Optional[str] = None
    sql_down: Optional[str] = None
    python_up: Optional[str] = None
    python_down: Optional[str] = None
    dependencies: List[str] = None
    created_at: datetime = None
    
    def __post_init__(self):
        if self.dependencies is None:
            self.dependencies = []
        if self.created_at is None:
            self.created_at = datetime.now(UTC)


@dataclass
class MigrationRecord:
    """Запис про виконання міграції"""
    migration_id: str
    version_from: str
    version_to: str
    status: MigrationStatus
    started_at: datetime
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    checksum: Optional[str] = None


class ModelVersioner:
    """Версіонування ML моделей"""
    
    def __init__(self, models_dir: str = "/tmp/models"):
        self.models_dir = Path(models_dir)
        self.models_dir.mkdir(parents=True, exist_ok=True)
        self.version_file = self.models_dir / "model_versions.json"
        self.versions: Dict[str, Dict[str, Any]] = {}
        self._load_versions()
    
    def _load_versions(self):
        """Завантажити версії моделей"""
        try:
            if self.version_file.exists():
                with open(self.version_file, 'r') as f:
                    self.versions = json.load(f)
        except Exception as e:
            logger.error("Error loading model versions: %s", e)
            self.versions = {}
    
    def _save_versions(self):
        """Зберегти версії моделей"""
        try:
            with open(self.version_file, 'w') as f:
                json.dump(self.versions, f, indent=2, default=str)
        except Exception as e:
            logger.error("Error saving model versions: %s", e)
    
    def register_model(self, model_name: str, version: Version, metadata: Dict[str, Any] = None):
        """Зареєструвати версію моделі"""
        self.versions[model_name] = {
            "version": str(version),
            "created_at": version.created_at.isoformat(),
            "metadata": metadata or {}
        }
        self._save_versions()
        logger.info("Registered model %s version %s", model_name, version)
    
    def get_model_version(self, model_name: str) -> Optional[Version]:
        """Отримати версію моделі"""
        if model_name in self.versions:
            version_str = self.versions[model_name]["version"]
            return Version.from_string(version_str)
        return None
    
    def list_models(self) -> List[str]:
        """Список всіх моделей"""
        return list(self.versions.keys())
    
    def get_model_metadata(self, model_name: str) -> Dict[str, Any]:
        """Отримати метадані моделі"""
        return self.versions.get(model_name, {}).get("metadata", {})


class CompatibilityChecker:
    """Перевірка сумісності версій"""
    
    def __init__(self):
        self.compatibility_matrix: Dict[str, List[str]] = {
            "55.0": ["55.1", "55.2", "55.3", "55.4"],
            "55.1": ["55.2", "55.3", "55.4"],
            "55.2": ["55.3", "55.4"],
            "55.3": ["55.4"],
            "55.4": []
        }
    
    def check_compatibility(self, from_version: str, to_version: str) -> bool:
        """Перевірити сумісність версій"""
        # Пряма сумісність
        if to_version in self.compatibility_matrix.get(from_version, []):
            return True
        
        # Зворотна сумісність
        if from_version in self.compatibility_matrix.get(to_version, []):
            return True
        
        # Ті ж версії
        if from_version == to_version:
            return True
        
        return False
    
    def get_migration_path(self, from_version: str, to_version: str) -> List[str]:
        """Отримати шлях міграції"""
        from_parts = from_version.split(".")
        to_parts = to_version.split(".")
        
        if len(from_parts) != 3 or len(to_parts) != 3:
            return []
        
        from_major, from_minor, from_patch = map(int, from_parts)
        to_major, to_minor, to_patch = map(int, to_parts)
        
        path = []
        
        # Major міграція
        if from_major != to_major:
            for major in range(from_major + 1, to_major + 1):
                path.append(f"{major}.0.0")
        
        # Minor міграція
        if from_minor != to_minor:
            start_minor = from_minor + 1 if from_major == to_major else 0
            for minor in range(start_minor, to_minor + 1):
                path.append(f"{to_major}.{minor}.0")
        
        # Patch міграція
        if from_patch != to_patch:
            start_patch = from_patch + 1 if from_minor == to_minor else 0
            for patch in range(start_patch, to_patch + 1):
                path.append(f"{to_major}.{to_minor}.{patch}")
        
        return path


class MigrationEngine:
    """Двигун міграцій"""
    
    def __init__(self, migrations_dir: str = "/tmp/migrations"):
        self.migrations_dir = Path(migrations_dir)
        self.migrations_dir.mkdir(parents=True, exist_ok=True)
        self.migrations: Dict[str, Migration] = {}
        self.records: List[MigrationRecord] = []
        self._load_migrations()
        self._load_records()
    
    def _load_migrations(self):
        """Завантажити міграції"""
        for migration_file in self.migrations_dir.glob("*.json"):
            try:
                with open(migration_file, 'r') as f:
                    data = json.load(f)
                
                migration = Migration(
                    id=data["id"],
                    version_from=Version.from_string(data["version_from"]),
                    version_to=Version.from_string(data["version_to"]),
                    description=data["description"],
                    sql_up=data.get("sql_up"),
                    sql_down=data.get("sql_down"),
                    python_up=data.get("python_up"),
                    python_down=data.get("python_down"),
                    dependencies=data.get("dependencies", [])
                )
                
                self.migrations[migration.id] = migration
                
            except Exception as e:
                logger.error("Error loading migration %s: %s", migration_file, e)
    
    def _load_records(self):
        """Завантажити записи про міграції"""
        records_file = self.migrations_dir / "migration_records.json"
        
        try:
            if records_file.exists():
                with open(records_file, 'r') as f:
                    data = json.load(f)
                
                for record_data in data:
                    record = MigrationRecord(
                        migration_id=record_data["migration_id"],
                        version_from=record_data["version_from"],
                        version_to=record_data["version_to"],
                        status=MigrationStatus(record_data["status"]),
                        started_at=datetime.fromisoformat(record_data["started_at"]),
                        completed_at=datetime.fromisoformat(record_data["completed_at"]) if record_data.get("completed_at") else None,
                        error_message=record_data.get("error_message"),
                        checksum=record_data.get("checksum")
                    )
                    self.records.append(record)
                    
        except Exception as e:
            logger.error("Error loading migration records: %s", e)
    
    def _save_records(self):
        """Зберегти записи про міграції"""
        records_file = self.migrations_dir / "migration_records.json"
        
        try:
            data = []
            for record in self.records:
                record_data = {
                    "migration_id": record.migration_id,
                    "version_from": record.version_from,
                    "version_to": record.version_to,
                    "status": record.status.value,
                    "started_at": record.started_at.isoformat(),
                    "completed_at": record.completed_at.isoformat() if record.completed_at else None,
                    "error_message": record.error_message,
                    "checksum": record.checksum
                }
                data.append(record_data)
            
            with open(records_file, 'w') as f:
                json.dump(data, f, indent=2)
                
        except Exception as e:
            logger.error("Error saving migration records: %s", e)
    
    async def migrate(self, target_version: str) -> bool:
        """
        Виконати міграцію до цільової версії
        
        Args:
            target_version: Цільова версія
            
        Returns:
            Успішність міграції
        """
        try:
            current_version = self.get_current_version()
            
            if current_version == target_version:
                logger.info("Already at target version %s", target_version)
                return True
            
            # Отримати шлях міграції
            checker = CompatibilityChecker()
            migration_path = checker.get_migration_path(current_version, target_version)
            
            if not migration_path:
                logger.error("No migration path from %s to %s", current_version, target_version)
                return False
            
            # Виконати міграції
            for version in migration_path:
                success = await self._migrate_to_version(version)
                if not success:
                    logger.error("Migration failed at version %s", version)
                    return False
            
            logger.info("Successfully migrated to version %s", target_version)
            return True
            
        except Exception as e:
            logger.error("Error during migration: %s", e)
            return False
    
    async def _migrate_to_version(self, version: str) -> bool:
        """Мігрувати до конкретної версії"""
        # Знайти міграцію для цієї версії
        migration = None
        for m in self.migrations.values():
            if str(m.version_to) == version:
                migration = m
                break
        
        if not migration:
            logger.warning("No migration found for version %s", version)
            return True
        
        # Перевірити чи міграція вже виконана
        if self._is_migration_completed(migration.id):
            logger.info("Migration %s already completed", migration.id)
            return True
        
        # Перевірити залежності
        for dep_id in migration.dependencies:
            if not self._is_migration_completed(dep_id):
                logger.error("Migration dependency %s not completed", dep_id)
                return False
        
        # Створити запис про міграцію
        record = MigrationRecord(
            migration_id=migration.id,
            version_from=str(migration.version_from),
            version_to=str(migration.version_to),
            status=MigrationStatus.RUNNING,
            started_at=datetime.now(UTC)
        )
        
        try:
            # Виконати SQL міграцію
            if migration.sql_up:
                await self._execute_sql(migration.sql_up)
            
            # Виконати Python міграцію
            if migration.python_up:
                await self._execute_python(migration.python_up)
            
            # Завершити міграцію
            record.status = MigrationStatus.COMPLETED
            record.completed_at = datetime.now(UTC)
            record.checksum = self._calculate_checksum(migration)
            
            self.records.append(record)
            self._save_records()
            
            logger.info("Migration %s completed successfully", migration.id)
            return True
            
        except Exception as e:
            record.status = MigrationStatus.FAILED
            record.error_message = str(e)
            record.completed_at = datetime.now(UTC)
            
            self.records.append(record)
            self._save_records()
            
            logger.error("Migration %s failed: %s", migration.id, e)
            return False
    
    async def rollback(self, target_version: str) -> bool:
        """Відкотити міграцію"""
        try:
            # Знайти останню міграцію до цільової версії
            last_migration = None
            for record in reversed(self.records):
                if record.status == MigrationStatus.COMPLETED and record.version_from == target_version:
                    migration_id = record.migration_id
                    if migration_id in self.migrations:
                        last_migration = self.migrations[migration_id]
                        break
            
            if not last_migration:
                logger.error("No migration found to rollback to version %s", target_version)
                return False
            
            # Виконати rollback
            if last_migration.sql_down:
                await self._execute_sql(last_migration.sql_down)
            
            if last_migration.python_down:
                await self._execute_python(last_migration.python_down)
            
            # Оновити запис
            for record in self.records:
                if record.migration_id == last_migration.id:
                    record.status = MigrationStatus.ROLLED_BACK
                    record.completed_at = datetime.now(UTC)
                    break
            
            self._save_records()
            
            logger.info("Rollback to version %s completed", target_version)
            return True
            
        except Exception as e:
            logger.error("Error during rollback: %s", e)
            return False
    
    def _is_migration_completed(self, migration_id: str) -> bool:
        """Перевірити чи міграція завершена"""
        for record in self.records:
            if record.migration_id == migration_id and record.status == MigrationStatus.COMPLETED:
                return True
        return False
    
    def _calculate_checksum(self, migration: Migration) -> str:
        """Розрахувати контрольну суму міграції"""
        content = f"{migration.id}{migration.version_from}{migration.version_to}"
        if migration.sql_up:
            content += migration.sql_up
        if migration.python_up:
            content += migration.python_up
        
        return hashlib.md5(content.encode()).hexdigest()
    
    async def _execute_sql(self, sql: str):
        """Виконати SQL міграцію"""
        # Імітація виконання SQL
        logger.info("Executing SQL migration")
        await asyncio.sleep(0.1)  # Імітація затримки
    
    async def _execute_python(self, python_code: str):
        """Виконати Python міграцію"""
        # Імітація виконання Python коду
        logger.info("Executing Python migration")
        await asyncio.sleep(0.1)  # Імітація затримки
    
    def get_current_version(self) -> str:
        """Отримати поточну версію"""
        if not self.records:
            return "55.0.0"
        
        # Знайти останню успішну міграцію
        last_completed = None
        for record in reversed(self.records):
            if record.status == MigrationStatus.COMPLETED:
                last_completed = record
                break
        
        if last_completed:
            return last_completed.version_to
        
        return "55.0.0"
    
    def get_migration_history(self) -> List[MigrationRecord]:
        """Отримати історію міграцій"""
        return self.records.copy()


class VersionManager:
    """Менеджер версій"""
    
    def __init__(self, current_version: str = "55.4.0"):
        self.current_version = Version.from_string(current_version)
        self.model_versioner = ModelVersioner()
        self.migration_engine = MigrationEngine()
        self.compatibility_checker = CompatibilityChecker()
    
    def get_version(self) -> Version:
        """Отримати поточну версію"""
        return self.current_version
    
    def bump_version(self, version_type: VersionType) -> Version:
        """Збільшити версію"""
        self.current_version = self.current_version.bump(version_type)
        logger.info("Version bumped to %s", self.current_version)
        return self.current_version
    
    def check_compatibility(self, required_version: str) -> bool:
        """Перевірити сумісність з версією"""
        required = Version.from_string(required_version)
        return self.current_version.is_compatible_with(required)
    
    async def migrate_to_version(self, target_version: str) -> bool:
        """Мігрувати до версії"""
        success = await self.migration_engine.migrate(target_version)
        if success:
            self.current_version = Version.from_string(target_version)
        return success
    
    def register_model_version(self, model_name: str, version: Version, metadata: Dict[str, Any] = None):
        """Зареєструвати версію моделі"""
        self.model_versioner.register_model(model_name, version, metadata)
    
    def get_model_version(self, model_name: str) -> Optional[Version]:
        """Отримати версію моделі"""
        return self.model_versioner.get_model_version(model_name)
    
    def get_version_info(self) -> Dict[str, Any]:
        """Отримати інформацію про версію"""
        return {
            "current_version": str(self.current_version),
            "models": {
                name: {
                    "version": str(self.model_versioner.get_model_version(name) or "unknown"),
                    "metadata": self.model_versioner.get_model_metadata(name)
                }
                for name in self.model_versioner.list_models()
            },
            "migration_history": [
                {
                    "migration_id": record.migration_id,
                    "version_from": record.version_from,
                    "version_to": record.version_to,
                    "status": record.status.value,
                    "started_at": record.started_at.isoformat(),
                    "completed_at": record.completed_at.isoformat() if record.completed_at else None
                }
                for record in self.migration_engine.get_migration_history()
            ]
        }


# Глобальний інстанс
_version_manager: Optional[VersionManager] = None


def get_version_manager(current_version: str = "55.4.0") -> VersionManager:
    """Отримати інстанс менеджера версій"""
    global _version_manager
    
    if _version_manager is None:
        _version_manager = VersionManager(current_version)
    
    return _version_manager


# Приклади використання
async def example_version_usage():
    """Приклади використання системи версій"""
    
    # Створення менеджера версій
    manager = get_version_manager()
    
    # Отримання поточної версії
    current_version = manager.get_version()
    print(f"Current version: {current_version}")
    
    # Збільшення версії
    new_version = manager.bump_version(VersionType.MINOR)
    print(f"New version: {new_version}")
    
    # Реєстрація версії моделі
    manager.register_model_version(
        "risk_prediction_model",
        new_version,
        {"model_type": "RandomForest", "accuracy": 0.95}
    )
    
    # Перевірка сумісності
    is_compatible = manager.check_compatibility("55.3.0")
    print(f"Compatible with 55.3.0: {is_compatible}")
    
    # Міграція версії
    success = await manager.migrate_to_version("55.5.0")
    print(f"Migration successful: {success}")
    
    # Отримання інформації про версію
    version_info = manager.get_version_info()
    print(f"Version info: {json.dumps(version_info, indent=2, default=str)}")
    
    print("Version management example completed!")


if __name__ == "__main__":
    asyncio.run(example_version_usage())
