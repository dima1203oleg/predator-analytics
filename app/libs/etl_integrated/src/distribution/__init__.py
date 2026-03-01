from __future__ import annotations


"""
Data Distribution Layer

Provides interfaces and implementations for distributing transformed data
to various storage backends including MinIO, PostgreSQL, Quadrant, and OpenSearch.
"""

from .data_distributor import DataDistributor, DistributionResult
from .minio_adapter import MinIOAdapter
from .opensearch_adapter import OpenSearchAdapter
from .postgresql_adapter import PostgreSQLAdapter
from .quadrant_adapter import QuadrantAdapter


__all__ = [
    "DataDistributor",
    "DistributionResult",
    "MinIOAdapter",
    "OpenSearchAdapter",
    "PostgreSQLAdapter",
    "QuadrantAdapter",
]
