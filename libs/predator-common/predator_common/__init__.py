"""predator_common — спільні бібліотеки PREDATOR Analytics v55.1.

Модулі:
- ueid: Генератор Universal Entity ID (SHA-256)
- content_hash: Хеш для дедуплікації записів
- circuit_breaker: Circuit Breaker (3 стани)
- retry: Exponential backoff retry
- logging: Структуроване JSON логування
"""

from predator_common.circuit_breaker import CircuitBreaker, CircuitState
from predator_common.content_hash import compute_content_hash
from predator_common.logging import configure_logging, get_logger
from predator_common.retry import retry_async, retry_sync
from predator_common.ueid import generate_company_ueid, generate_person_ueid, generate_ueid

__version__ = "55.1.0"
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
