from __future__ import annotations

"""
MinIO Distribution Adapter

Handles distribution of data and files to MinIO object storage using canonical service.
"""

import asyncio
from datetime import datetime
import logging
import os
from typing import Any

from app.modules.etl_engine.distribution.data_distributor import DistributionResult
from app.services.minio_service import minio_service

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MinIOAdapter:
    """MinIO distribution adapter.

    This adapter handles uploading processed data and files to MinIO.
    It uses the canonical MinioService for all operations.
    """

    def __init__(self, enabled: bool = True, bucket_name: str = "etl-data"):
        """Initialize the MinIO adapter.

        Args:
            enabled: Whether this adapter is enabled
            bucket_name: MinIO bucket name for storing data

        """
        self.enabled = enabled
        self.bucket_name = bucket_name

        if enabled:
            logger.info(f"MinIO adapter initialized with bucket: {bucket_name}")
        else:
            logger.info("MinIO adapter disabled")

    def distribute(self, data: Any) -> DistributionResult:
        """Distribute data to MinIO.

        Args:
            data: Data to distribute (usually a list of records or a file path)

        Returns:
            DistributionResult with status and metadata

        """
        if not self.enabled:
            return DistributionResult(True, "minio", data={"status": "disabled"})

        try:
            # Prepare records
            records = []
            if isinstance(data, list):
                records = data
            elif isinstance(data, dict):
                # Check if it's the wrapper dict from distributor
                if "records" in data and isinstance(data["records"], list):
                    records = data["records"]
                else:
                    records = [data]
            else:
                # If it's a string, maybe it's a file path?
                # For now, if it's not list/dict, we return error or handle as file if possible
                if isinstance(data, str) and os.path.exists(data):
                    return self.upload_file(data)
                return DistributionResult(False, "minio", error="Unsupported data format for MinIO distribution")

            if not records:
                return DistributionResult(True, "minio", data={"records_uploaded": 0})

            # In a real scenario, we might convert records to JSON/CSV and upload
            # For this adapter, we'll simulate the upload of the batch as a JSON file
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            object_name = f"batch_{timestamp}_{len(records)}.json"

            # Since distribute in adapter is sync, but minio_service is async
            loop = asyncio.get_event_loop()
            if loop.is_running():
                future = asyncio.run_coroutine_threadsafe(
                    minio_service.upload_object(self.bucket_name, object_name, records),
                    loop
                )
                future.result()
            else:
                asyncio.run(minio_service.upload_object(self.bucket_name, object_name, records))

            logger.info(f"Successfully distributed {len(records)} records to MinIO: {object_name}")

            return DistributionResult(
                True,
                "minio",
                data={
                    "bucket": self.bucket_name,
                    "object_name": object_name,
                    "records_uploaded": len(records),
                    "timestamp": datetime.now().isoformat(),
                },
            )

        except Exception as e:
            error_msg = f"MinIO distribution failed: {e!s}"
            logger.exception(error_msg)
            return DistributionResult(False, "minio", error=error_msg)

    def upload_file(self, file_path: str, object_name: str | None = None) -> DistributionResult:
        """Upload a file to MinIO.

        Args:
            file_path: Path to the local file
            object_name: Optional name for the object in MinIO

        Returns:
            DistributionResult with status and metadata

        """
        if not self.enabled:
            return DistributionResult(False, "minio", error="MinIO adapter is disabled")

        if not os.path.exists(file_path):
            return DistributionResult(False, "minio", error=f"File not found: {file_path}")

        name = object_name or os.path.basename(file_path)

        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                future = asyncio.run_coroutine_threadsafe(
                    minio_service.upload_file(self.bucket_name, name, file_path),
                    loop
                )
                future.result()
            else:
                asyncio.run(minio_service.upload_file(self.bucket_name, name, file_path))

            logger.info(f"Successfully uploaded file to MinIO: {name}")

            return DistributionResult(
                True,
                "minio",
                data={
                    "bucket": self.bucket_name,
                    "object_name": name,
                    "file_path": file_path,
                    "timestamp": datetime.now().isoformat(),
                },
            )

        except Exception as e:
            error_msg = f"MinIO file upload failed: {e!s}"
            logger.exception(error_msg)
            return DistributionResult(False, "minio", error=error_msg)
