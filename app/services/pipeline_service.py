from __future__ import annotations

"""Predator Analytics v45 - Pipeline Service
Orchestrates ETL, Indexing, ML Training, and Synthetic Data pipelines.
"""
import asyncio
from dataclasses import dataclass
from datetime import datetime
import logging
from typing import TYPE_CHECKING, Any

from app.core.db import async_session_maker
from app.models.entities import Dataset, Job, JobStatus, JobType
from app.services.embedding_service import EmbeddingService
from app.services.etl_ingestion import ETLIngestionService
from app.services.minio_service import MinIOService
from app.services.opensearch_indexer import OpenSearchIndexer
from app.services.qdrant_service import QdrantService

if TYPE_CHECKING:
    from collections.abc import Callable
    from uuid import UUID


logger = logging.getLogger(__name__)


@dataclass
class PipelineStep:
    """Single step in a pipeline."""

    name: str
    function: Callable
    depends_on: list[str] = None
    retry_count: int = 3
    timeout_seconds: int = 3600
    critical: bool = True  # If False, pipeline continues on failure


class PipelineService:
    """Orchestrates data processing pipelines."""

    def __init__(self):
        self.etl_service = ETLIngestionService()
        self.opensearch_indexer = OpenSearchIndexer()
        self.qdrant_service = QdrantService()
        self.embedding_service = EmbeddingService()
        self.minio_service = MinIOService()

        # Pipeline definitions
        self.pipelines = {
            JobType.INGESTION: self._define_ingestion_pipeline(),
            JobType.ETL: self._define_etl_pipeline(),
            JobType.INDEXING: self._define_indexing_pipeline(),
            JobType.TRAINING: self._define_training_pipeline(),
            JobType.SYNTHETIC: self._define_synthetic_pipeline(),
            JobType.OPTIMIZATION: self._define_optimization_pipeline(),
        }

    def _define_ingestion_pipeline(self) -> list[PipelineStep]:
        """Define data ingestion pipeline steps."""
        return [
            PipelineStep(
                name="validate_file",
                function=self._validate_file_step,
                retry_count=1,
                timeout_seconds=60,
            ),
            PipelineStep(
                name="parse_file",
                function=self._parse_file_step,
                depends_on=["validate_file"],
                retry_count=2,
                timeout_seconds=1800,
            ),
            PipelineStep(
                name="extract_schema",
                function=self._extract_schema_step,
                depends_on=["parse_file"],
                retry_count=1,
                timeout_seconds=300,
            ),
            PipelineStep(
                name="calculate_quality",
                function=self._calculate_quality_step,
                depends_on=["extract_schema"],
                retry_count=1,
                timeout_seconds=600,
            ),
            PipelineStep(
                name="save_to_gold",
                function=self._save_to_gold_step,
                depends_on=["parse_file", "extract_schema"],
                retry_count=2,
                timeout_seconds=1200,
            ),
        ]

    def _define_etl_pipeline(self) -> list[PipelineStep]:
        """Define ETL pipeline steps."""
        return [
            PipelineStep(
                name="load_raw_data",
                function=self._load_raw_data_step,
                retry_count=2,
                timeout_seconds=1800,
            ),
            PipelineStep(
                name="clean_data",
                function=self._clean_data_step,
                depends_on=["load_raw_data"],
                retry_count=1,
                timeout_seconds=3600,
            ),
            PipelineStep(
                name="transform_data",
                function=self._transform_data_step,
                depends_on=["clean_data"],
                retry_count=1,
                timeout_seconds=2400,
            ),
            PipelineStep(
                name="validate_output",
                function=self._validate_output_step,
                depends_on=["transform_data"],
                retry_count=1,
                timeout_seconds=600,
            ),
            PipelineStep(
                name="save_processed",
                function=self._save_processed_step,
                depends_on=["validate_output"],
                retry_count=2,
                timeout_seconds=1200,
            ),
        ]

    def _define_indexing_pipeline(self) -> list[PipelineStep]:
        """Define indexing pipeline steps."""
        return [
            PipelineStep(
                name="prepare_documents",
                function=self._prepare_documents_step,
                retry_count=1,
                timeout_seconds=600,
            ),
            PipelineStep(
                name="generate_embeddings",
                function=self._generate_embeddings_step,
                depends_on=["prepare_documents"],
                retry_count=2,
                timeout_seconds=3600,
            ),
            PipelineStep(
                name="index_opensearch",
                function=self._index_opensearch_step,
                depends_on=["prepare_documents"],
                retry_count=2,
                timeout_seconds=1800,
            ),
            PipelineStep(
                name="index_qdrant",
                function=self._index_qdrant_step,
                depends_on=["generate_embeddings"],
                retry_count=2,
                timeout_seconds=2400,
            ),
            PipelineStep(
                name="update_indices",
                function=self._update_indices_step,
                depends_on=["index_opensearch", "index_qdrant"],
                retry_count=1,
                timeout_seconds=300,
            ),
        ]

    def _define_training_pipeline(self) -> list[PipelineStep]:
        """Define ML training pipeline steps."""
        return [
            PipelineStep(
                name="prepare_training_data",
                function=self._prepare_training_data_step,
                retry_count=1,
                timeout_seconds=1800,
            ),
            PipelineStep(
                name="train_model",
                function=self._train_model_step,
                depends_on=["prepare_training_data"],
                retry_count=1,
                timeout_seconds=7200,
            ),
            PipelineStep(
                name="evaluate_model",
                function=self._evaluate_model_step,
                depends_on=["train_model"],
                retry_count=1,
                timeout_seconds=1800,
            ),
            PipelineStep(
                name="save_model",
                function=self._save_model_step,
                depends_on=["evaluate_model"],
                retry_count=2,
                timeout_seconds=600,
            ),
        ]

    def _define_synthetic_pipeline(self) -> list[PipelineStep]:
        """Define synthetic data generation pipeline."""
        return [
            PipelineStep(
                name="analyze_source_data",
                function=self._analyze_source_data_step,
                retry_count=1,
                timeout_seconds=600,
            ),
            PipelineStep(
                name="generate_synthetic",
                function=self._generate_synthetic_step,
                depends_on=["analyze_source_data"],
                retry_count=2,
                timeout_seconds=3600,
            ),
            PipelineStep(
                name="validate_synthetic",
                function=self._validate_synthetic_step,
                depends_on=["generate_synthetic"],
                retry_count=1,
                timeout_seconds=600,
            ),
            PipelineStep(
                name="save_synthetic",
                function=self._save_synthetic_step,
                depends_on=["validate_synthetic"],
                retry_count=2,
                timeout_seconds=1200,
            ),
        ]

    def _define_optimization_pipeline(self) -> list[PipelineStep]:
        """Define self-improvement optimization pipeline."""
        return [
            PipelineStep(
                name="analyze_performance",
                function=self._analyze_performance_step,
                retry_count=1,
                timeout_seconds=600,
            ),
            PipelineStep(
                name="identify_improvements",
                function=self._identify_improvements_step,
                depends_on=["analyze_performance"],
                retry_count=1,
                timeout_seconds=1800,
            ),
            PipelineStep(
                name="apply_optimizations",
                function=self._apply_optimizations_step,
                depends_on=["identify_improvements"],
                retry_count=1,
                timeout_seconds=3600,
            ),
            PipelineStep(
                name="validate_improvements",
                function=self._validate_improvements_step,
                depends_on=["apply_optimizations"],
                retry_count=1,
                timeout_seconds=600,
            ),
        ]

    async def execute_pipeline(
        self,
        job_id: UUID,
        pipeline_type: JobType,
        dataset_id: UUID | None = None,
        config: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Execute a pipeline with proper error handling and status updates."""
        if pipeline_type not in self.pipelines:
            raise ValueError(f"Unknown pipeline type: {pipeline_type}")

        pipeline = self.pipelines[pipeline_type]
        context = {
            "job_id": job_id,
            "dataset_id": dataset_id,
            "config": config or {},
            "results": {},
            "errors": {},
            "start_time": datetime.utcnow(),
        }

        # Update job status to running
        await self._update_job_status(job_id, JobStatus.RUNNING, 0.0)

        completed_steps = 0
        total_steps = len(pipeline)

        try:
            for step in pipeline:
                # Check dependencies
                if step.depends_on:
                    for dep in step.depends_on:
                        if dep not in context["results"]:
                            raise ValueError(f"Dependency {dep} not found in results")

                # Execute step with retry logic
                step_result = await self._execute_step_with_retry(
                    step, context, max_retries=step.retry_count
                )

                if step_result["success"]:
                    context["results"][step.name] = step_result["data"]
                    logger.info(f"Pipeline step {step.name} completed successfully")
                else:
                    context["errors"][step.name] = step_result["error"]

                    if step.critical:
                        # Mark job as failed
                        await self._update_job_status(
                            job_id,
                            JobStatus.FAILED,
                            (completed_steps / total_steps) * 100,
                            error_message=f"Step {step.name} failed: {step_result['error']}",
                        )
                        raise Exception(f"Critical step {step.name} failed: {step_result['error']}")
                    logger.warning(f"Non-critical step {step.name} failed, continuing")

                completed_steps += 1
                progress = (completed_steps / total_steps) * 100
                await self._update_job_status(job_id, JobStatus.RUNNING, progress)

            # Pipeline completed successfully
            await self._update_job_status(
                job_id, JobStatus.COMPLETED, 100.0, result=context["results"]
            )

            return {
                "success": True,
                "job_id": job_id,
                "pipeline_type": pipeline_type,
                "results": context["results"],
                "duration": (datetime.utcnow() - context["start_time"]).total_seconds(),
            }

        except Exception as e:
            # Mark job as failed
            await self._update_job_status(
                job_id,
                JobStatus.FAILED,
                (completed_steps / total_steps) * 100,
                error_message=str(e),
                logs={"errors": context["errors"], "results": context["results"]},
            )

            logger.exception(f"Pipeline {pipeline_type} failed for job {job_id}: {e}")
            return {
                "success": False,
                "job_id": job_id,
                "pipeline_type": pipeline_type,
                "error": str(e),
                "errors": context["errors"],
            }

    async def _execute_step_with_retry(
        self, step: PipelineStep, context: dict[str, Any], max_retries: int = 3
    ) -> dict[str, Any]:
        """Execute a pipeline step with retry logic."""
        last_error = None

        for attempt in range(max_retries + 1):
            try:
                # Execute with timeout
                result = await asyncio.wait_for(
                    step.function(context), timeout=step.timeout_seconds
                )

                return {"success": True, "data": result, "attempt": attempt + 1}

            except TimeoutError:
                last_error = f"Step {step.name} timed out after {step.timeout_seconds}s"
                logger.warning(f"{last_error} (attempt {attempt + 1}/{max_retries + 1})")

            except Exception as e:
                last_error = str(e)
                logger.warning(
                    f"Step {step.name} failed: {last_error} (attempt {attempt + 1}/{max_retries + 1})"
                )

            if attempt < max_retries:
                # Exponential backoff
                await asyncio.sleep(2**attempt)

        return {"success": False, "error": last_error, "attempts": max_retries + 1}

    async def _update_job_status(
        self,
        job_id: UUID,
        status: JobStatus,
        progress: float,
        error_message: str | None = None,
        result: dict[str, Any] | None = None,
        logs: dict[str, Any] | None = None,
    ):
        """Update job status in database."""
        async with async_session_maker() as session:
            update_data = {
                "status": status.value,
                "progress": progress,
                "updated_at": datetime.utcnow(),
            }

            if status == JobStatus.RUNNING and not update_data.get("started_at"):
                update_data["started_at"] = datetime.utcnow()

            if status == JobStatus.COMPLETED:
                update_data["completed_at"] = datetime.utcnow()

            if error_message:
                update_data["error_message"] = error_message

            if result:
                update_data["result"] = result

            if logs:
                update_data["logs"] = logs

            stmt = update(Job).where(Job.id == job_id).values(**update_data)
            await session.execute(stmt)
            await session.commit()

    # ========================================================================
    # PIPELINE STEP IMPLEMENTATIONS
    # ========================================================================

    async def _validate_file_step(self, context: dict[str, Any]) -> dict[str, Any]:
        """Validate uploaded file format and structure."""
        dataset_id = context["dataset_id"]

        async with async_session_maker() as session:
            dataset = await session.get(Dataset, dataset_id)
            if not dataset:
                raise ValueError("Dataset not found")

            # Basic validation
            if not dataset.file_path:
                raise ValueError("No file path specified")

            # Check file exists in MinIO
            try:
                file_info = await self.minio_service.get_file_info("raw-data", dataset.file_path)
                return {
                    "valid": True,
                    "file_size": file_info.size,
                    "content_type": file_info.content_type,
                }
            except Exception as e:
                raise ValueError(f"File not found in MinIO: {e}")

    async def _parse_file_step(self, context: dict[str, Any]) -> dict[str, Any]:
        """Parse file and extract data."""
        dataset_id = context["dataset_id"]

        async with async_session_maker() as session:
            dataset = await session.get(Dataset, dataset_id)

            # Use ETL service to parse file
            result = await self.etl_service.process_file(dataset.file_path, dataset.file_type)

            if result["status"] != "success":
                raise ValueError(f"ETL processing failed: {result.get('error')}")

            return result

    async def _extract_schema_step(self, context: dict[str, Any]) -> dict[str, Any]:
        """Extract and analyze data schema."""
        parse_result = context["results"]["parse_file"]
        documents = parse_result.get("documents", [])

        if not documents:
            return {"schema": {}, "columns": []}

        # Analyze schema from first document
        sample_doc = documents[0]
        schema = {}

        for key, value in sample_doc.items():
            schema[key] = {
                "type": type(value).__name__,
                "nullable": value is None,
                "sample": str(value)[:100] if value else None,
            }

        return {"schema": schema, "columns": list(schema.keys()), "row_count": len(documents)}

    async def _calculate_quality_step(self, context: dict[str, Any]) -> dict[str, Any]:
        """Calculate data quality metrics."""
        parse_result = context["results"]["parse_file"]
        documents = parse_result.get("documents", [])

        if not documents:
            return {"quality_score": 0.0, "metrics": {}}

        # Basic quality metrics
        total_rows = len(documents)
        empty_fields = 0
        total_fields = 0

        for doc in documents:
            for value in doc.values():
                total_fields += 1
                if value is None or (isinstance(value, str) and not value.strip()):
                    empty_fields += 1

        completeness = 1.0 - (empty_fields / total_fields) if total_fields > 0 else 0.0

        # Simple quality score (0-100)
        quality_score = completeness * 100

        return {
            "quality_score": quality_score,
            "metrics": {
                "total_rows": total_rows,
                "total_fields": total_fields,
                "empty_fields": empty_fields,
                "completeness": completeness,
            },
        }

    async def _save_to_gold_step(self, context: dict[str, Any]) -> dict[str, Any]:
        """Save processed data to gold layer."""
        dataset_id = context["dataset_id"]
        context["results"]["parse_file"]
        schema_result = context["results"]["extract_schema"]
        quality_result = context["results"]["calculate_quality"]

        async with async_session_maker() as session:
            dataset = await session.get(Dataset, dataset_id)

            # Update dataset with processing results
            dataset.schema_info = schema_result["schema"]
            dataset.processing_log = {"quality": quality_result["metrics"]}
            dataset.quality_score = quality_result["quality_score"]
            dataset.row_count = quality_result["metrics"]["total_rows"]
            dataset.status = "indexed"  # Mark as processed

            await session.commit()

        return {"saved": True, "dataset_id": str(dataset_id)}

    # Placeholder implementations for other pipeline steps
    async def _load_raw_data_step(self, context: dict[str, Any]) -> dict[str, Any]:
        return {"loaded": True}

    async def _clean_data_step(self, context: dict[str, Any]) -> dict[str, Any]:
        return {"cleaned": True}

    async def _transform_data_step(self, context: dict[str, Any]) -> dict[str, Any]:
        return {"transformed": True}

    async def _validate_output_step(self, context: dict[str, Any]) -> dict[str, Any]:
        return {"validated": True}

    async def _save_processed_step(self, context: dict[str, Any]) -> dict[str, Any]:
        return {"saved": True}

    async def _prepare_documents_step(self, context: dict[str, Any]) -> dict[str, Any]:
        return {"prepared": True}

    async def _generate_embeddings_step(self, context: dict[str, Any]) -> dict[str, Any]:
        return {"embeddings_generated": True}

    async def _index_opensearch_step(self, context: dict[str, Any]) -> dict[str, Any]:
        return {"opensearch_indexed": True}

    async def _index_qdrant_step(self, context: dict[str, Any]) -> dict[str, Any]:
        return {"qdrant_indexed": True}

    async def _update_indices_step(self, context: dict[str, Any]) -> dict[str, Any]:
        return {"indices_updated": True}

    async def _prepare_training_data_step(self, context: dict[str, Any]) -> dict[str, Any]:
        return {"training_data_prepared": True}

    async def _train_model_step(self, context: dict[str, Any]) -> dict[str, Any]:
        return {"model_trained": True}

    async def _evaluate_model_step(self, context: dict[str, Any]) -> dict[str, Any]:
        return {"model_evaluated": True}

    async def _save_model_step(self, context: dict[str, Any]) -> dict[str, Any]:
        return {"model_saved": True}

    async def _analyze_source_data_step(self, context: dict[str, Any]) -> dict[str, Any]:
        return {"source_analyzed": True}

    async def _generate_synthetic_step(self, context: dict[str, Any]) -> dict[str, Any]:
        return {"synthetic_generated": True}

    async def _validate_synthetic_step(self, context: dict[str, Any]) -> dict[str, Any]:
        return {"synthetic_validated": True}

    async def _save_synthetic_step(self, context: dict[str, Any]) -> dict[str, Any]:
        return {"synthetic_saved": True}

    async def _analyze_performance_step(self, context: dict[str, Any]) -> dict[str, Any]:
        return {"performance_analyzed": True}

    async def _identify_improvements_step(self, context: dict[str, Any]) -> dict[str, Any]:
        return {"improvements_identified": True}

    async def _apply_optimizations_step(self, context: dict[str, Any]) -> dict[str, Any]:
        return {"optimizations_applied": True}

    async def _validate_improvements_step(self, context: dict[str, Any]) -> dict[str, Any]:
        return {"improvements_validated": True}


# Singleton instance
pipeline_service = PipelineService()
