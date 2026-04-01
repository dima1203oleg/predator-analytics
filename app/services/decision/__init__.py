"""
🧠 Decision Intelligence Engine — v55.5
Predator Analytics — Модуль для прийняття бізнес-рішень

Експортує основні класи та функції для аналізу рішень:
- DecisionEngine — головний двигун прийняття рішень
- ProcurementAnalyzer — аналіз постачальників та цін
- BatchProcessor — масовий аналіз компаній
- TelegramBot — інтеграція з Telegram для природномовних запитів
- VoiceProcessor — голосові команди через Whisper AI
- AlertManager — система сповіщень та алертів
- ReportGenerator — автоматичні звіти та планування
- MLEngine — машинне навчання для прогнозування
- Dashboard — аналітична панель з візуалізацією
- ConfigManager — управління конфігурацією
- VersionManager — управління версіями та міграціями
- Рекомендації, сценарії та кроки дій

Приклад використання:
    from app.services.decision import DecisionEngine, get_decision_engine
    
    engine = get_decision_engine()
    result = await engine.recommend(
        ueid="12345678",
        product_code="87032310",
        db=session
    )
"""

from __future__ import annotations

# Основні класи
from app.services.decision.decision_engine import (
    DecisionEngine,
    ProcurementAnalyzer,
    DecisionResult,
    DecisionScenario,
    ActionStep,
    ThreatIndicator,
)

# Batch processor для масового аналізу
from app.services.decision.batch_processor import (
    BatchProcessor,
    BatchResult,
)

# Telegram інтеграція
from app.services.decision.telegram_integration import (
    DecisionTelegramBot,
    start_decision_telegram_bot,
    stop_decision_telegram_bot,
    get_decision_telegram_bot,
)

# Voice інтеграція
from app.services.decision.voice_integration import (
    VoiceDecisionProcessor,
    VoiceTelegramBot,
    create_voice_decision_bot,
)

# Система алертів
from app.services.decision.alerts import (
    AlertManager,
    AlertType,
    AlertSeverity,
    NotificationChannel,
    Alert,
    DecisionAlerts,
    get_alert_manager,
    get_decision_alerts,
)

# Система звітів
from app.services.decision.reports import (
    ReportGenerator,
    ReportType,
    ReportFormat,
    ScheduleFrequency,
    ReportConfig,
    GeneratedReport,
    ReportScheduler,
    get_report_generator,
    get_report_scheduler,
)

# ML моделі
from app.services.decision.ml_engine import (
    RiskPredictionModel,
    ProcurementOptimizationModel,
    MarketTrendModel,
    RecommendationEngine,
    PredictionResult,
    get_risk_prediction_model,
    get_procurement_optimization_model,
    get_market_trend_model,
    get_recommendation_engine,
)

# Аналітична панель
from app.services.decision.dashboard import (
    DashboardEngine,
    WidgetManager,
    WidgetType,
    TimeRange,
    WidgetConfig,
    MetricsCollector,
    ChartGenerator,
    get_dashboard_engine,
    get_widget_manager,
)

# Система конфігурації
from app.services.decision.config import (
    ConfigManager,
    Environment,
    ConfigFormat,
    DatabaseConfig,
    RedisConfig,
    TelegramConfig,
    VoiceConfig,
    MLConfig,
    DashboardConfig,
    AlertsConfig,
    ReportsConfig,
    DecisionEngineConfig,
    ConfigValidator,
    get_config_manager,
)

# Управління версіями
from app.services.decision.version_management import (
    VersionManager,
    Version,
    VersionType,
    Migration,
    MigrationStatus,
    MigrationEngine,
    ModelVersioner,
    CompatibilityChecker,
    get_version_manager,
)

# Аудит подій і доступу
from app.services.decision.audit import (
    AuditEventType,
    AuditSeverity as DecisionAuditSeverity,
    AuditContext,
    DecisionAuditService,
    get_decision_audit_service,
    collect_user_roles_for_audit,
    can_access_decision_feature,
)

# Фабричні функції для отримання інстансів
def get_decision_engine() -> DecisionEngine:
    """Отримати інстанс DecisionEngine (singleton pattern)."""
    return DecisionEngine()


def get_procurement_analyzer() -> ProcurementAnalyzer:
    """Отримати інстанс ProcurementAnalyzer (singleton pattern)."""
    return ProcurementAnalyzer()


def get_batch_processor(max_concurrent: int = 10) -> BatchProcessor:
    """Отримати інстанс BatchProcessor."""
    return BatchProcessor(max_concurrent=max_concurrent)


def get_voice_processor(model_name: str = "base") -> VoiceDecisionProcessor:
    """Отримати інстанс VoiceProcessor."""
    return VoiceDecisionProcessor(model_name=model_name)


__all__ = [
    # Класи
    "DecisionEngine",
    "ProcurementAnalyzer", 
    "DecisionResult",
    "DecisionScenario",
    "ActionStep",
    "ThreatIndicator",
    "BatchProcessor",
    "BatchResult",
    "DecisionTelegramBot",
    "VoiceDecisionProcessor",
    "VoiceTelegramBot",
    "AlertManager",
    "AlertType",
    "AlertSeverity",
    "NotificationChannel",
    "Alert",
    "DecisionAlerts",
    "ReportGenerator",
    "ReportType",
    "ReportFormat",
    "ScheduleFrequency",
    "ReportConfig",
    "GeneratedReport",
    "ReportScheduler",
    "RiskPredictionModel",
    "ProcurementOptimizationModel",
    "MarketTrendModel",
    "RecommendationEngine",
    "PredictionResult",
    "DashboardEngine",
    "WidgetManager",
    "WidgetType",
    "TimeRange",
    "WidgetConfig",
    "MetricsCollector",
    "ChartGenerator",
    "ConfigManager",
    "Environment",
    "ConfigFormat",
    "DatabaseConfig",
    "RedisConfig",
    "TelegramConfig",
    "VoiceConfig",
    "MLConfig",
    "DashboardConfig",
    "AlertsConfig",
    "ReportsConfig",
    "DecisionEngineConfig",
    "ConfigValidator",
    "VersionManager",
    "Version",
    "VersionType",
    "Migration",
    "MigrationStatus",
    "MigrationEngine",
    "ModelVersioner",
    "CompatibilityChecker",
    "AuditEventType",
    "DecisionAuditSeverity",
    "AuditContext",
    "DecisionAuditService",
    # Функції
    "get_decision_engine",
    "get_procurement_analyzer",
    "get_batch_processor",
    "get_voice_processor",
    "start_decision_telegram_bot",
    "stop_decision_telegram_bot",
    "get_decision_telegram_bot",
    "create_voice_decision_bot",
    "get_alert_manager",
    "get_decision_alerts",
    "get_report_generator",
    "get_report_scheduler",
    "get_risk_prediction_model",
    "get_procurement_optimization_model",
    "get_market_trend_model",
    "get_recommendation_engine",
    "get_dashboard_engine",
    "get_widget_manager",
    "get_config_manager",
    "get_version_manager",
    "get_decision_audit_service",
    "collect_user_roles_for_audit",
    "can_access_decision_feature",
]
