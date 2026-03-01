from __future__ import annotations


"""
Main Data Distributor

Provides a unified interface for distributing data to multiple storage backends.
"""

from datetime import datetime
from enum import Enum
import logging
from typing import Any

from pydantic import BaseModel, Field


# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DistributionTarget(Enum):
    """Supported distribution targets."""

    MINIO = "minio"
    POSTGRESQL = "postgresql"
    QUADRANT = "quadrant"
    OPENSEARCH = "opensearch"
    ALL = "all"


class DistributionResult:
    """Result container for distribution operations."""

    def __init__(self, success: bool, target: str, data: Any | None = None, error: str | None = None):
        self.success = success
        self.target = target
        self.data = data
        self.error = error
        self.timestamp = datetime.now()
        self.metadata = {}

    def __repr__(self) -> str:
        if self.success:
            return f"DistributionResult(success=True, target={self.target}, timestamp={self.timestamp})"
        return f"DistributionResult(success=False, target={self.target}, error={self.error})"


class DistributionConfig(BaseModel):
    """Configuration for distribution operations."""

    minio_enabled: bool = Field(default=True, description="Enable MinIO distribution")
    postgresql_enabled: bool = Field(default=True, description="Enable PostgreSQL distribution")
    quadrant_enabled: bool = Field(default=True, description="Enable Quadrant distribution")
    opensearch_enabled: bool = Field(default=True, description="Enable OpenSearch distribution")

    minio_bucket: str = Field(default="etl-data", description="MinIO bucket name")
    postgresql_table: str = Field(default="people_data", description="PostgreSQL table name")
    quadrant_collection: str = Field(default="people_embeddings", description="Quadrant collection name")
    opensearch_index: str = Field(default="people_index", description="OpenSearch index name")

    batch_size: int = Field(default=100, description="Batch size for distribution operations")

    class Config:
        json_schema_extra = {
            "examples": [
                {
                    "minio_enabled": True,
                    "postgresql_enabled": True,
                    "quadrant_enabled": True,
                    "opensearch_enabled": True,
                    "minio_bucket": "etl-data",
                    "postgresql_table": "people_data",
                    "quadrant_collection": "people_embeddings",
                    "opensearch_index": "people_index",
                    "batch_size": 100,
                }
            ]
        }


class DataDistributor:
    """Main data distributor class.

    This class coordinates distribution of transformed data to multiple storage backends.
    It provides a unified interface and handles error management across different targets.
    """

    def __init__(self, config: dict[str, Any | None] | None = None):
        """Initialize the data distributor.

        Args:
            config: Optional configuration dictionary
        """
        self.config = self._load_config(config)
        self.adapters = {}
        self._initialize_adapters()

    def _load_config(self, config: dict[str, Any | None] | None = None) -> DistributionConfig:
        """Load and validate configuration."""
        if config is None:
            config = {}
        return DistributionConfig(**config)

    def _initialize_adapters(self) -> None:
        """Initialize all distribution adapters."""
        try:
            # Import and initialize adapters with relative imports
            # Assumed structure: app.modules.etl_engine.distribution.xxx
            # But here we are in app.modules.etl_engine.distribution.data_distributor
            # So .minio_adapter works
            from .minio_adapter import MinIOAdapter
            from .opensearch_adapter import OpenSearchAdapter
            from .postgresql_adapter import PostgreSQLAdapter
            from .quadrant_adapter import QuadrantAdapter

            # Initialize adapters with configuration
            self.adapters[DistributionTarget.MINIO.value] = MinIOAdapter(
                enabled=self.config.minio_enabled, bucket_name=self.config.minio_bucket
            )

            self.adapters[DistributionTarget.POSTGRESQL.value] = PostgreSQLAdapter(
                enabled=self.config.postgresql_enabled, table_name=self.config.postgresql_table
            )

            self.adapters[DistributionTarget.QUADRANT.value] = QuadrantAdapter(
                enabled=self.config.quadrant_enabled, collection_name=self.config.quadrant_collection
            )

            self.adapters[DistributionTarget.OPENSEARCH.value] = OpenSearchAdapter(
                enabled=self.config.opensearch_enabled, index_name=self.config.opensearch_index
            )

            logger.info("All distribution adapters initialized successfully")

        except ImportError as e:
            logger.exception(f"Failed to import adapter modules: {e}")
            raise
        except Exception as e:
            logger.exception(f"Failed to initialize adapters: {e}")
            raise

    def distribute(
        self,
        data: dict[str | Any, list[dict[str, Any]]],
        targets: DistributionTarget | list[DistributionTarget] = DistributionTarget.ALL,
    ) -> list[DistributionResult]:
        """Distribute data to specified targets.

        Args:
            data: Data to distribute (single record or list of records)
            targets: Target(s) to distribute to (default: all enabled targets)

        Returns:
            List of DistributionResult objects for each target
        """
        results = []

        # Convert single target to list
        if isinstance(targets, DistributionTarget):
            targets = [targets]

        # Handle DistributionTarget.ALL
        if DistributionTarget.ALL in targets:
            targets = [
                target
                for target in DistributionTarget
                if target != DistributionTarget.ALL and self._is_target_enabled(target)
            ]

        # Distribute to each target
        for target in targets:
            if not self._is_target_enabled(target):
                logger.warning(f"Target {target.value} is disabled in configuration")
                continue

            try:
                adapter = self.adapters.get(target.value)
                if adapter is None:
                    error_msg = f"No adapter available for target: {target.value}"
                    logger.error(error_msg)
                    results.append(DistributionResult(False, target.value, error=error_msg))
                    continue

                # Distribute the data
                result = adapter.distribute(data)
                results.append(result)

                if result.success:
                    logger.info(f"Successfully distributed data to {target.value}")
                else:
                    logger.error(f"Failed to distribute data to {target.value}: {result.error}")

            except Exception as e:
                error_msg = f"Distribution to {target.value} failed: {e!s}"
                logger.exception(error_msg)
                results.append(DistributionResult(False, target.value, error=error_msg))

        return results

    def _is_target_enabled(self, target: DistributionTarget) -> bool:
        """Check if a target is enabled in configuration."""
        if target == DistributionTarget.MINIO:
            return self.config.minio_enabled
        if target == DistributionTarget.POSTGRESQL:
            return self.config.postgresql_enabled
        if target == DistributionTarget.QUADRANT:
            return self.config.quadrant_enabled
        if target == DistributionTarget.OPENSEARCH:
            return self.config.opensearch_enabled
        return False

    def get_enabled_targets(self) -> list[DistributionTarget]:
        """Get list of enabled distribution targets."""
        enabled_targets = []

        for target in DistributionTarget:
            if target != DistributionTarget.ALL and self._is_target_enabled(target):
                enabled_targets.append(target)

        return enabled_targets

    def get_adapter(self, target: DistributionTarget) -> Any | None:
        """Get the adapter for a specific target."""
        return self.adapters.get(target.value)

    def validate_data_for_distribution(self, data: dict[str | Any, list[dict[str, Any]]]) -> DistributionResult:
        """Validate that data is suitable for distribution.

        Args:
            data: Data to validate

        Returns:
            DistributionResult with validation status
        """
        try:
            # Basic validation
            if not data:
                return DistributionResult(False, "validation", error="Empty data provided")

            if isinstance(data, list):
                if len(data) == 0:
                    return DistributionResult(False, "validation", error="Empty data list")

                # Check that all items are dictionaries
                for i, item in enumerate(data):
                    if not isinstance(item, dict):
                        return DistributionResult(
                            False, "validation", error=f"Item {i} is not a dictionary: {type(item)}"
                        )
            elif isinstance(data, dict):
                # Single record validation
                pass
            else:
                return DistributionResult(False, "validation", error=f"Unsupported data type: {type(data)}")

            return DistributionResult(True, "validation", data={"message": "Data validation passed"})

        except Exception as e:
            error_msg = f"Data validation failed: {e!s}"
            logger.exception(error_msg)
            return DistributionResult(False, "validation", error=error_msg)

    def distribute_batch(
        self,
        data: list[dict[str, Any]],
        targets: DistributionTarget | list[DistributionTarget] = DistributionTarget.ALL,
        batch_size: int | None = None,
    ) -> list[DistributionResult]:
        """Distribute data in batches.

        Args:
            data: List of data records to distribute
            targets: Target(s) to distribute to
            batch_size: Batch size (uses config default if None)

        Returns:
            List of DistributionResult objects
        """
        if batch_size is None:
            batch_size = self.config.batch_size

        results = []

        try:
            # Validate batch size
            if batch_size <= 0:
                raise ValueError("Batch size must be positive")

            # Process in batches
            for i in range(0, len(data), batch_size):
                batch = data[i : i + batch_size]
                logger.info(f"Processing batch {i // batch_size + 1}: {len(batch)} records")

                batch_results = self.distribute(batch, targets)
                results.extend(batch_results)

            return results

        except Exception as e:
            error_msg = f"Batch distribution failed: {e!s}"
            logger.exception(error_msg)
            return [DistributionResult(False, "batch", error=error_msg)]

    def get_distribution_stats(self) -> dict[str, Any]:
        """Get statistics about distribution operations."""
        return {
            "enabled_targets": [target.value for target in self.get_enabled_targets()],
            "config": self.config.dict(),
            "adapters_initialized": list(self.adapters.keys()),
        }


def create_data_distributor(config: dict[str, Any | None] | None = None) -> DataDistributor:
    """Factory function to create a DataDistributor instance.

    Args:
        config: Optional configuration dictionary

    Returns:
        DataDistributor instance
    """
    return DataDistributor(config)
