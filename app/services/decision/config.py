"""
⚙️ Decision Intelligence Configuration Management

Система управління конфігурацією для Decision Intelligence Engine.
Підтримує:
- Динамічне налаштування параметрів
- Environment-specific конфігурації
- Валідацію конфігурації
- Hot-reload змін
- Аудит змін конфігурації

Компоненти:
- ConfigManager — основний менеджер конфігурації
- ConfigValidator — валідатор конфігурації
- ConfigWatcher — спостерігач за змінами
- ConfigSchema — схема конфігурації
"""

import asyncio
import json
import logging
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import yaml
from pydantic import BaseModel, ValidationError

logger = logging.getLogger("predator.decision.config")


class Environment(str, Enum):
    """Оточення"""
    DEVELOPMENT = "development"
    TESTING = "testing"
    STAGING = "staging"
    PRODUCTION = "production"


class ConfigFormat(str, Enum):
    """Формат конфігурації"""
    YAML = "yaml"
    JSON = "json"
    TOML = "toml"


@dataclass
class DatabaseConfig:
    """Конфігурація бази даних"""
    url: str = "postgresql+asyncpg://user:pass@localhost/predator"
    pool_size: int = 10
    max_overflow: int = 20
    pool_timeout: int = 30
    pool_recycle: int = 3600
    echo: bool = False


@dataclass
class RedisConfig:
    """Конфігурація Redis"""
    url: str = "redis://localhost:6379/0"
    max_connections: int = 10
    retry_on_timeout: bool = True
    socket_timeout: int = 5
    socket_connect_timeout: int = 5


@dataclass
class TelegramConfig:
    """Конфігурація Telegram"""
    token: Optional[str] = None
    admin_id: Optional[int] = None
    webhook_url: Optional[str] = None
    max_message_length: int = 4096
    parse_mode: str = "HTML"


@dataclass
class VoiceConfig:
    """Конфігурація Voice інтеграції"""
    whisper_model: str = "base"
    sample_rate: int = 16000
    language: str = "uk"
    max_audio_duration: int = 60
    temp_dir: str = "/tmp/voice"


@dataclass
class MLConfig:
    """Конфігурація ML моделей"""
    models_dir: str = "/tmp/models"
    auto_retrain: bool = True
    retrain_interval_days: int = 7
    min_samples_for_training: int = 1000
    model_backup_count: int = 3


@dataclass
class DashboardConfig:
    """Конфігурація Dashboard"""
    auto_refresh_interval: int = 300
    max_widgets: int = 20
    export_formats: List[str] = field(default_factory=lambda: ["json", "csv"])
    theme: str = "light"
    timezone: str = "UTC"


@dataclass
class AlertsConfig:
    """Конфігурація алертів"""
    enabled: bool = True
    default_channels: List[str] = field(default_factory=lambda: ["email"])
    email_smtp_server: str = "localhost"
    email_smtp_port: int = 587
    email_username: Optional[str] = None
    email_password: Optional[str] = None
    webhook_timeout: int = 10
    max_alerts_per_hour: int = 100


@dataclass
class ReportsConfig:
    """Конфігурація звітів"""
    output_dir: str = "/tmp/reports"
    default_format: str = "pdf"
    max_file_size_mb: int = 50
    cleanup_days: int = 30
    email_reports: bool = True
    schedule_timezone: str = "UTC"


@dataclass
class DecisionEngineConfig:
    """Основна конфігурація Decision Intelligence Engine"""
    environment: Environment = Environment.DEVELOPMENT
    debug: bool = True
    log_level: str = "INFO"
    
    # Сервісні конфігурації
    database: DatabaseConfig = field(default_factory=DatabaseConfig)
    redis: RedisConfig = field(default_factory=RedisConfig)
    telegram: TelegramConfig = field(default_factory=TelegramConfig)
    voice: VoiceConfig = field(default_factory=VoiceConfig)
    ml: MLConfig = field(default_factory=MLConfig)
    dashboard: DashboardConfig = field(default_factory=DashboardConfig)
    alerts: AlertsConfig = field(default_factory=AlertsConfig)
    reports: ReportsConfig = field(default_factory=ReportsConfig)
    
    # Налаштування продуктивності
    batch_max_concurrent: int = 10
    cache_ttl_short: int = 300
    cache_ttl_long: int = 600
    request_timeout: int = 30
    
    # Налаштування безпеки
    secret_key: Optional[str] = None
    allowed_hosts: List[str] = field(default_factory=lambda: ["localhost", "127.0.0.1"])
    cors_origins: List[str] = field(default_factory=lambda: ["http://localhost:3030"])
    
    # Налаштування моніторингу
    metrics_enabled: bool = True
    prometheus_port: int = 9090
    health_check_interval: int = 60


class ConfigValidator:
    """Валідатор конфігурації"""
    
    def __init__(self):
        self.errors: List[str] = []
        self.warnings: List[str] = []
    
    def validate(self, config: DecisionEngineConfig) -> tuple[bool, List[str], List[str]]:
        """Валідація конфігурації"""
        self.errors.clear()
        self.warnings.clear()
        
        # Валідація основних параметрів
        self._validate_environment(config)
        self._validate_database(config.database)
        self._validate_redis(config.redis)
        self._validate_telegram(config.telegram)
        self._validate_ml(config.ml)
        self._validate_security(config)
        self._validate_performance(config)
        
        return len(self.errors) == 0, self.errors, self.warnings
    
    def _validate_environment(self, config: DecisionEngineConfig):
        """Валідація оточення"""
        if config.environment == Environment.PRODUCTION and config.debug:
            self.errors.append("Debug mode should not be enabled in production")
        
        if config.environment == Environment.PRODUCTION and config.log_level == "DEBUG":
            self.warnings.append("DEBUG log level is not recommended for production")
    
    def _validate_database(self, db_config: DatabaseConfig):
        """Валідація конфігурації бази даних"""
        if not db_config.url:
            self.errors.append("Database URL is required")
        elif not db_config.url.startswith(("postgresql", "mysql", "sqlite")):
            self.errors.append("Unsupported database type in URL")
        
        if db_config.pool_size <= 0:
            self.errors.append("Database pool size must be positive")
        
        if db_config.max_overflow < 0:
            self.errors.append("Database max overflow cannot be negative")
    
    def _validate_redis(self, redis_config: RedisConfig):
        """Валідація конфігурації Redis"""
        if not redis_config.url:
            self.errors.append("Redis URL is required")
        elif not redis_config.url.startswith(("redis://", "rediss://")):
            self.errors.append("Invalid Redis URL format")
        
        if redis_config.max_connections <= 0:
            self.errors.append("Redis max connections must be positive")
    
    def _validate_telegram(self, telegram_config: TelegramConfig):
        """Валідація конфігурації Telegram"""
        if telegram_config.token and len(telegram_config.token) < 20:
            self.errors.append("Telegram token appears to be invalid")
        
        if telegram_config.admin_id and telegram_config.admin_id <= 0:
            self.errors.append("Telegram admin ID must be positive")
        
        if telegram_config.webhook_url and not telegram_config.webhook_url.startswith(("http://", "https://")):
            self.errors.append("Telegram webhook URL must start with http:// or https://")
    
    def _validate_ml(self, ml_config: MLConfig):
        """Валідація ML конфігурації"""
        if ml_config.retrain_interval_days <= 0:
            self.errors.append("ML retrain interval must be positive")
        
        if ml_config.min_samples_for_training < 100:
            self.warnings.append("ML minimum samples for training is quite low")
        
        if ml_config.model_backup_count < 1:
            self.errors.append("ML model backup count must be at least 1")
    
    def _validate_security(self, config: DecisionEngineConfig):
        """Валідація безпеки"""
        if config.environment == Environment.PRODUCTION and not config.secret_key:
            self.errors.append("Secret key is required in production")
        
        if config.secret_key and len(config.secret_key) < 32:
            self.errors.append("Secret key should be at least 32 characters")
        
        if not config.allowed_hosts:
            self.errors.append("At least one allowed host must be specified")
    
    def _validate_performance(self, config: DecisionEngineConfig):
        """Валідація продуктивності"""
        if config.batch_max_concurrent <= 0:
            self.errors.append("Batch max concurrent must be positive")
        
        if config.batch_max_concurrent > 50:
            self.warnings.append("High batch concurrency may impact performance")
        
        if config.cache_ttl_short <= 0 or config.cache_ttl_long <= 0:
            self.errors.append("Cache TTL values must be positive")
        
        if config.request_timeout <= 0:
            self.errors.append("Request timeout must be positive")


class ConfigWatcher:
    """Спостерігач за змінами конфігурації"""
    
    def __init__(self, config_path: Path):
        self.config_path = config_path
        self.last_modified = None
        self.callbacks: List[callable] = []
    
    def add_callback(self, callback: callable):
        """Додати callback для змін"""
        self.callbacks.append(callback)
    
    async def watch(self):
        """Спостерігати за змінами"""
        if not self.config_path.exists():
            return
        
        self.last_modified = self.config_path.stat().st_mtime
        
        while True:
            try:
                current_modified = self.config_path.stat().st_mtime
                if current_modified != self.last_modified:
                    self.last_modified = current_modified
                    await self._notify_callbacks()
                
                await asyncio.sleep(5)  # Перевірка кожні 5 секунд
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("Error watching config file: %s", e)
                await asyncio.sleep(30)
    
    async def _notify_callbacks(self):
        """Повідомити callbacks про зміни"""
        for callback in self.callbacks:
            try:
                if asyncio.iscoroutinefunction(callback):
                    await callback()
                else:
                    callback()
            except Exception as e:
                logger.error("Error in config change callback: %s", e)


class ConfigManager:
    """Основний менеджер конфігурації"""
    
    def __init__(self, config_path: Optional[str] = None):
        self.config_path = Path(config_path) if config_path else Path("config/decision_engine.yaml")
        self.config: DecisionEngineConfig = DecisionEngineConfig()
        self.validator = ConfigValidator()
        self.watcher: Optional[ConfigWatcher] = None
        self.watch_task: Optional[asyncio.Task] = None
        self._loaded_at: Optional[datetime] = None
    
    async def load(self, environment: Optional[str] = None) -> DecisionEngineConfig:
        """
        Завантажити конфігурацію
        
        Args:
            environment: Оточення (development, testing, staging, production)
            
        Returns:
            Завантажена конфігурація
        """
        try:
            # Визначення оточення
            if environment:
                env = Environment(environment.lower())
            else:
                env = self._detect_environment()
            
            # Завантаження базової конфігурації
            base_config = await self._load_base_config()
            
            # Завантаження оточення-специфічної конфігурації
            env_config = await self._load_environment_config(env)
            
            # Завантаження локальної конфігурації
            local_config = await self._load_local_config()
            
            # Злиття конфігурацій
            self.config = self._merge_configs(base_config, env_config, local_config)
            self.config.environment = env
            
            # Валідація
            is_valid, errors, warnings = self.validator.validate(self.config)
            
            if not is_valid:
                raise ValueError(f"Configuration validation failed: {errors}")
            
            if warnings:
                logger.warning("Configuration warnings: %s", warnings)
            
            self._loaded_at = datetime.now(UTC)
            logger.info("Configuration loaded for environment: %s", env.value)
            
            return self.config
            
        except Exception as e:
            logger.error("Error loading configuration: %s", e)
            raise
    
    async def save(self, config: Optional[DecisionEngineConfig] = None):
        """
        Зберегти конфігурацію
        
        Args:
            config: Конфігурація для збереження
        """
        try:
            config_to_save = config or self.config
            
            # Валідація перед збереженням
            is_valid, errors, warnings = self.validator.validate(config_to_save)
            
            if not is_valid:
                raise ValueError(f"Cannot save invalid configuration: {errors}")
            
            # Створення директорії
            self.config_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Конвертація в словник
            config_dict = self._config_to_dict(config_to_save)
            
            # Збереження у YAML форматі
            with open(self.config_path, 'w', encoding='utf-8') as f:
                yaml.dump(config_dict, f, default_flow_style=False, allow_unicode=True)
            
            logger.info("Configuration saved to %s", self.config_path)
            
        except Exception as e:
            logger.error("Error saving configuration: %s", e)
            raise
    
    async def start_watching(self):
        """Запустити спостереження за змінами"""
        if self.watcher is None:
            self.watcher = ConfigWatcher(self.config_path)
            self.watcher.add_callback(self._on_config_changed)
            
        self.watch_task = asyncio.create_task(self.watcher.watch())
        logger.info("Started watching configuration file")
    
    async def stop_watching(self):
        """Зупинити спостереження за змінами"""
        if self.watch_task:
            self.watch_task.cancel()
            try:
                await self.watch_task
            except asyncio.CancelledError:
                pass
            self.watch_task = None
        
        logger.info("Stopped watching configuration file")
    
    def get(self, key: str, default: Any = None) -> Any:
        """Отримати значення конфігурації"""
        keys = key.split('.')
        value = self.config
        
        for k in keys:
            if hasattr(value, k):
                value = getattr(value, k)
            elif isinstance(value, dict) and k in value:
                value = value[k]
            else:
                return default
        
        return value
    
    def set(self, key: str, value: Any):
        """Встановити значення конфігурації"""
        keys = key.split('.')
        obj = self.config
        
        for k in keys[:-1]:
            if hasattr(obj, k):
                obj = getattr(obj, k)
            elif isinstance(obj, dict):
                obj = obj.setdefault(k, {})
            else:
                raise ValueError(f"Cannot set nested key: {key}")
        
        last_key = keys[-1]
        if hasattr(obj, last_key):
            setattr(obj, last_key, value)
        elif isinstance(obj, dict):
            obj[last_key] = value
        else:
            raise ValueError(f"Cannot set key: {key}")
    
    async def _load_base_config(self) -> DecisionEngineConfig:
        """Завантажити базову конфігурацію"""
        base_path = self.config_path.parent / "base.yaml"
        
        if base_path.exists():
            return await self._load_from_file(base_path)
        else:
            return DecisionEngineConfig()
    
    async def _load_environment_config(self, environment: Environment) -> DecisionEngineConfig:
        """Завантажити конфігурацію оточення"""
        env_path = self.config_path.parent / f"{environment.value}.yaml"
        
        if env_path.exists():
            return await self._load_from_file(env_path)
        else:
            return DecisionEngineConfig()
    
    async def _load_local_config(self) -> DecisionEngineConfig:
        """Завантажити локальну конфігурацію"""
        local_path = self.config_path.parent / "local.yaml"
        
        if local_path.exists():
            return await self._load_from_file(local_path)
        else:
            return DecisionEngineConfig()
    
    async def _load_from_file(self, file_path: Path) -> DecisionEngineConfig:
        """Завантажити конфігурацію з файлу"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
            
            return self._dict_to_config(data)
            
        except Exception as e:
            logger.error("Error loading config from %s: %s", file_path, e)
            return DecisionEngineConfig()
    
    def _dict_to_config(self, data: Dict[str, Any]) -> DecisionEngineConfig:
        """Конвертувати словник в конфігурацію"""
        # Конвертація основних параметрів
        config = DecisionEngineConfig()
        
        if "environment" in data:
            config.environment = Environment(data["environment"])
        
        if "debug" in data:
            config.debug = data["debug"]
        
        if "log_level" in data:
            config.log_level = data["log_level"]
        
        # Конвертація вкладених конфігурацій
        if "database" in data:
            db_data = data["database"]
            config.database = DatabaseConfig(**db_data)
        
        if "redis" in data:
            redis_data = data["redis"]
            config.redis = RedisConfig(**redis_data)
        
        if "telegram" in data:
            telegram_data = data["telegram"]
            config.telegram = TelegramConfig(**telegram_data)
        
        if "voice" in data:
            voice_data = data["voice"]
            config.voice = VoiceConfig(**voice_data)
        
        if "ml" in data:
            ml_data = data["ml"]
            config.ml = MLConfig(**ml_data)
        
        if "dashboard" in data:
            dashboard_data = data["dashboard"]
            config.dashboard = DashboardConfig(**dashboard_data)
        
        if "alerts" in data:
            alerts_data = data["alerts"]
            config.alerts = AlertsConfig(**alerts_data)
        
        if "reports" in data:
            reports_data = data["reports"]
            config.reports = ReportsConfig(**reports_data)
        
        # Інші параметри
        for key, value in data.items():
            if hasattr(config, key) and key not in ["environment", "debug", "log_level"]:
                setattr(config, key, value)
        
        return config
    
    def _config_to_dict(self, config: DecisionEngineConfig) -> Dict[str, Any]:
        """Конвертувати конфігурацію в словник"""
        return {
            "environment": config.environment.value,
            "debug": config.debug,
            "log_level": config.log_level,
            "database": {
                "url": config.database.url,
                "pool_size": config.database.pool_size,
                "max_overflow": config.database.max_overflow,
                "pool_timeout": config.database.pool_timeout,
                "pool_recycle": config.database.pool_recycle,
                "echo": config.database.echo,
            },
            "redis": {
                "url": config.redis.url,
                "max_connections": config.redis.max_connections,
                "retry_on_timeout": config.redis.retry_on_timeout,
                "socket_timeout": config.redis.socket_timeout,
                "socket_connect_timeout": config.redis.socket_connect_timeout,
            },
            "telegram": {
                "token": config.telegram.token,
                "admin_id": config.telegram.admin_id,
                "webhook_url": config.telegram.webhook_url,
                "max_message_length": config.telegram.max_message_length,
                "parse_mode": config.telegram.parse_mode,
            },
            "voice": {
                "whisper_model": config.voice.whisper_model,
                "sample_rate": config.voice.sample_rate,
                "language": config.voice.language,
                "max_audio_duration": config.voice.max_audio_duration,
                "temp_dir": config.voice.temp_dir,
            },
            "ml": {
                "models_dir": config.ml.models_dir,
                "auto_retrain": config.ml.auto_retrain,
                "retrain_interval_days": config.ml.retrain_interval_days,
                "min_samples_for_training": config.ml.min_samples_for_training,
                "model_backup_count": config.ml.model_backup_count,
            },
            "dashboard": {
                "auto_refresh_interval": config.dashboard.auto_refresh_interval,
                "max_widgets": config.dashboard.max_widgets,
                "export_formats": config.dashboard.export_formats,
                "theme": config.dashboard.theme,
                "timezone": config.dashboard.timezone,
            },
            "alerts": {
                "enabled": config.alerts.enabled,
                "default_channels": config.alerts.default_channels,
                "email_smtp_server": config.alerts.email_smtp_server,
                "email_smtp_port": config.alerts.email_smtp_port,
                "email_username": config.alerts.email_username,
                "email_password": config.alerts.email_password,
                "webhook_timeout": config.alerts.webhook_timeout,
                "max_alerts_per_hour": config.alerts.max_alerts_per_hour,
            },
            "reports": {
                "output_dir": config.reports.output_dir,
                "default_format": config.reports.default_format,
                "max_file_size_mb": config.reports.max_file_size_mb,
                "cleanup_days": config.reports.cleanup_days,
                "email_reports": config.reports.email_reports,
                "schedule_timezone": config.reports.schedule_timezone,
            },
            "batch_max_concurrent": config.batch_max_concurrent,
            "cache_ttl_short": config.cache_ttl_short,
            "cache_ttl_long": config.cache_ttl_long,
            "request_timeout": config.request_timeout,
            "secret_key": config.secret_key,
            "allowed_hosts": config.allowed_hosts,
            "cors_origins": config.cors_origins,
            "metrics_enabled": config.metrics_enabled,
            "prometheus_port": config.prometheus_port,
            "health_check_interval": config.health_check_interval,
        }
    
    def _merge_configs(self, *configs: DecisionEngineConfig) -> DecisionEngineConfig:
        """Злити конфігурації"""
        merged = DecisionEngineConfig()
        
        for config in configs:
            # Оновлення основних параметрів
            if config.environment != Environment.DEVELOPMENT:
                merged.environment = config.environment
            if config.debug is not None:
                merged.debug = config.debug
            if config.log_level != "INFO":
                merged.log_level = config.log_level
            
            # Оновлення вкладених конфігурацій
            if hasattr(config, 'database') and config.database:
                merged.database = config.database
            if hasattr(config, 'redis') and config.redis:
                merged.redis = config.redis
            if hasattr(config, 'telegram') and config.telegram:
                merged.telegram = config.telegram
            if hasattr(config, 'voice') and config.voice:
                merged.voice = config.voice
            if hasattr(config, 'ml') and config.ml:
                merged.ml = config.ml
            if hasattr(config, 'dashboard') and config.dashboard:
                merged.dashboard = config.dashboard
            if hasattr(config, 'alerts') and config.alerts:
                merged.alerts = config.alerts
            if hasattr(config, 'reports') and config.reports:
                merged.reports = config.reports
        
        return merged
    
    def _detect_environment(self) -> Environment:
        """Автоматично визначити оточення"""
        import os
        
        env_var = os.getenv("DECISION_ENV", "").lower()
        
        if env_var == "production":
            return Environment.PRODUCTION
        elif env_var == "staging":
            return Environment.STAGING
        elif env_var == "testing":
            return Environment.TESTING
        else:
            return Environment.DEVELOPMENT
    
    async def _on_config_changed(self):
        """Обробник зміни конфігурації"""
        logger.info("Configuration file changed, reloading...")
        
        try:
            await self.load()
            logger.info("Configuration reloaded successfully")
        except Exception as e:
            logger.error("Error reloading configuration: %s", e)


# Глобальний інстанс
_config_manager: Optional[ConfigManager] = None


def get_config_manager(config_path: Optional[str] = None) -> ConfigManager:
    """Отримати інстанс менеджера конфігурації"""
    global _config_manager
    
    if _config_manager is None:
        _config_manager = ConfigManager(config_path)
    
    return _config_manager


# Приклади використання
async def example_config_usage():
    """Приклади використання системи конфігурації"""
    
    # Створення менеджера конфігурації
    manager = get_config_manager("config/decision_engine.yaml")
    
    # Завантаження конфігурації
    config = await manager.load(environment="development")
    print(f"Loaded config for environment: {config.environment.value}")
    
    # Отримання значень
    db_url = manager.get("database.url")
    print(f"Database URL: {db_url}")
    
    # Встановлення значення
    manager.set("debug", False)
    manager.set("batch_max_concurrent", 20)
    
    # Збереження конфігурації
    await manager.save()
    
    # Запуск спостереження за змінами
    await manager.start_watching()
    
    # Зупинка спостереження
    await manager.stop_watching()
    
    print("Configuration example completed!")


if __name__ == "__main__":
    asyncio.run(example_config_usage())
