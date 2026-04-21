"""predator_common — спільні бібліотеки PREDATOR Analytics v58.2-WRAITH.

Модулі:
- models: ORM-моделі (канонічні, вирівняні з init.sql)
- ueid: Генератор Universal Entity ID (SHA-256)
- entity_resolution: Entity Resolution Engine (fuzzy matching + UEID)
- event_schemas: Kafka Event Bus Pydantic v2 schemas
- security_utils: JWT, RBAC, tenant extraction
- content_hash: Хеш для дедуплікації записів
- circuit_breaker: Circuit Breaker (3 стани)
- retry: Exponential backoff retry
- logging: Структуроване JSON логування
- cers_score: CERS 5-Layer Risk Scoring
"""

from predator_common.circuit_breaker import CircuitBreaker, CircuitState
from predator_common.content_hash import compute_content_hash
from predator_common.logging import configure_logging, get_logger
from predator_common.retry import retry_async, retry_sync
from predator_common.ueid import generate_company_ueid, generate_person_ueid, generate_ueid

__version__ = "58.2.0"
__all__ = [
    "CircuitBreaker",
    "CircuitState",
    "compute_content_hash",
    "configure_logging",
    "generate_company_ueid",
    "generate_person_ueid",
    "generate_ueid",
    "get_logger",
    "retry_async",
    "retry_sync",
]
