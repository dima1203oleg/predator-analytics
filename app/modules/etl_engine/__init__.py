from __future__ import annotations

"""
ETL Engine - Core Package (v4.2.0)
"""

from .engine import ETLEngine, create_etl_engine
from .parsing.data_parser import DataParser, DataFormat
from .transformation.data_transformer import DataTransformer
from .deduplication.data_deduplicator import DataDeduplicator
from .distribution.data_distributor import DataDistributor, DistributionTarget

__all__ = [
    "ETLEngine",
    "create_etl_engine",
    "DataParser",
    "DataFormat",
    "DataTransformer",
    "DataDeduplicator",
    "DataDistributor",
    "DistributionTarget",
]
