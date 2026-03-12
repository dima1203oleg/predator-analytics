"""Predator Core API Services Package.

Сервіси організовані за функціональними доменами:
- ai_service.py — AI сервіси
- aml_scoring.py — AML Scoring модуль
- anomaly_detection.py — Виявлення аномалій
- axiom_verifier.py — Axiom верифікатор
- competitors_analysis.py — Аналіз конкурентів
- dspy_optimizer.py — DSPy оптимізація промптів
- graph_service.py — Графові сервіси
- kafka_service.py — Kafka інтеграція
- maritime_aviation.py — AIS/ADS-B моніторинг
- minio_service.py — MinIO/S3 сервіс
- neo4j_service.py — Neo4j сервіс
- redis_service.py — Redis сервіс
- risk_service.py — Сервіс ризиків
- search_service.py — Пошуковий сервіс
- ukraine_registries.py — Українські реєстри
- warroom_service.py — War Room сервіс
"""

# Експортуємо всі сервіси для зручності імпорту
from .ai_service import AIService
from .aml_scoring import AMLScoringService
from .anomaly_detection import AnomalyDetectionService
from .axiom_verifier import AxiomVerifier
from .competitors_analysis import CompetitorsAnalysisService
from .dspy_optimizer import DSPyOptimizerService
from .graph_service import GraphService
from .kafka_service import close_kafka, init_kafka
from .maritime_aviation import MaritimeAviationService
from .minio_service import close_minio, init_minio
from .neo4j_service import Neo4jService
from .redis_service import close_redis, init_redis
from .risk_service import RiskService
from .search_service import SearchService
from .ukraine_registries import UkraineRegistriesService
from .warroom_service import WarRoomService

__all__ = [
    "AIService",
    "AMLScoringService",
    "AnomalyDetectionService",
    "AxiomVerifier",
    "CompetitorsAnalysisService",
    "DSPyOptimizerService",
    "GraphService",
    "MaritimeAviationService",
    "Neo4jService",
    "RiskService",
    "SearchService",
    "UkraineRegistriesService",
    "WarRoomService",
    "close_kafka",
    "close_minio",
    "close_redis",
    "init_kafka",
    "init_minio",
    "init_redis",
]
