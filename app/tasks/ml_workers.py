from __future__ import annotations


"""ML Workers - Background tasks for AI/ML processing
Handles embeddings generation, classification, and analysis Jobs.
"""
import asyncio

import asyncpg
from celery import shared_task

from app.libs.core.config import settings
from app.libs.core.database import get_db_ctx
from app.libs.core.models.entities import MLDataset, MLJob
from app.libs.core.structured_logger import get_logger


logger = get_logger("tasks.ml_workers")


@shared_task(name="tasks.ml.process_job", queue="analytics")
def process_ml_job(job_id: str):
    """Process a queued MLJob.
    1. Fetch Job & Dataset info
    2. Load Data from Staging
    3. Run AI Model (Embedding/Analysis)
    4. Update Job Status & Metrics.
    """
    logger.info("ml_job_started", job_id=job_id)

    async def run_job():
        try:
            async with get_db_ctx() as sess:
                # 1. Fetch Job
                # We interpret job_id as UUID string
                import uuid

                try:
                    j_uuid = uuid.UUID(job_id)
                except ValueError:
                    logger.exception("ml_job_invalid_uuid", job_id=job_id)
                    return {"status": "failed", "error": "Invalid UUID"}

                job = await sess.get(MLJob, j_uuid)
                if not job:
                    logger.error("ml_job_not_found", job_id=job_id)
                    return {"status": "failed", "error": "Job not found"}

                # Update status to running
                job.status = "running"
                await sess.flush()

                dataset = await sess.get(MLDataset, job.dataset_id)
                if not dataset:
                    logger.error("ml_dataset_not_found", job_id=job_id, dataset_id=job.dataset_id)
                    job.status = "failed"
                    await sess.commit()
                    return {"status": "failed", "error": "Dataset not found"}

                # 2. Extract Data Source
                # dvc_path is like "pg://staging_customs"
                if not dataset.dvc_path.startswith("pg://"):
                    logger.error("ml_unsupported_dvc_path", path=dataset.dvc_path)
                    job.status = "failed"
                    await sess.commit()
                    return {"status": "failed", "error": "Unsupported scheme"}

                table_name = dataset.dvc_path.replace("pg://", "")

                # Fetch data from staging
                # We need a separate connection for raw SQL on staging schema if strictly separated,
                # but let's assume same DB for simplicity or use the asyncpg conn

                records = []
                # Use raw asyncpg for efficiency reading staging
                raw_conn = await asyncpg.connect(
                    settings.CLEAN_DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
                )
                try:
                    # Limit to recent/unprocessed or just all for now (POC)
                    # Ideally we track what is processed. For now, take last 1000 for demo.
                    rows = await raw_conn.fetch(
                        f"SELECT * FROM {table_name} ORDER BY id DESC LIMIT 1000"
                    )
                    # Convert to list of dicts/strings
                    for r in rows:
                        # Construct a text representation for embedding
                        # Naive approach: join all text values
                        text_parts = [
                            str(v) for k, v in r.items() if k not in ["id", "created_at"] and v
                        ]
                        records.append(" ".join(text_parts))
                except Exception as e:
                    logger.exception("ml_staging_read_failed", error=str(e))
                    job.status = "failed"
                    job.metrics = {"error": str(e)}
                    await sess.commit()
                    return {"status": "failed", "error": str(e)}
                finally:
                    await raw_conn.close()

                if not records:
                    logger.warning("ml_job_empty_dataset", job_id=job_id)
                    job.status = "succeeded"
                    job.metrics = {"processed": 0, "msg": "Empty dataset"}
                    await sess.commit()
                    return {"status": "succeeded", "processed": 0}

                # 3. AI Обробка (Ембеддінги та Індексація)
                from app.services.embedding_service import get_embedding_service
                from app.services.opensearch_indexer import opensearch_indexer
                from app.services.qdrant_service import get_qdrant_service

                embedder = get_embedding_service()
                qdrant = get_qdrant_service()

                index_name = f"idx_{table_name}"
                await opensearch_indexer.create_index(index_name)
                await qdrant.create_collection(index_name)

                docs_to_index = []
                for _i, row in enumerate(rows):
                    doc_id = str(row["id"])
                    text_parts = [
                        str(v) for k, v in row.items() if k not in ["id", "created_at"] and v
                    ]
                    full_text = " ".join(text_parts)

                    vector = await embedder.generate_embedding_async(full_text)

                    metadata = {k: str(v) for k, v in row.items() if k not in ["id", "created_at"]}
                    metadata["source_table"] = table_name

                    docs_to_index.append(
                        {
                            "id": doc_id,
                            "title": f"Запис #{doc_id} з {table_name}",
                            "content": full_text,
                            "embedding": vector,
                            "metadata": metadata,
                            "tenant_id": str(dataset.tenant_id),
                        }
                    )

                # 4. РЕАЛЬНЕ ЗБЕРЕЖЕННЯ (Triple-DB Sync)
                os_results = await opensearch_indexer.index_documents(
                    index_name=index_name, documents=docs_to_index, tenant_id=str(dataset.tenant_id)
                )

                q_batch = [
                    {"id": d["id"], "embedding": d["embedding"], "metadata": d["metadata"]}
                    for d in docs_to_index
                ]
                await qdrant.index_batch(q_batch, tenant_id=str(dataset.tenant_id))

                logger.info("ml_job_indexed_success", count=len(docs_to_index))

                job.status = "succeeded"
                job.metrics = {
                    "processed_rows": len(docs_to_index),
                    "vector_dim": embedder.vector_size,
                    "model": embedder.model_name,
                    "os_status": os_results,
                }
                await sess.commit()
                return {"status": "success", "processed": len(docs_to_index)}

        except Exception as e:
            logger.exception("ml_job_execution_failed", error=str(e), job_id=job_id)
            # Try to save failure status
            try:
                # New session to ensure we can write error even if main transaction failed
                async with get_db_ctx() as err_sess:
                    err_job = await err_sess.get(MLJob, j_uuid)
                    if err_job:
                        err_job.status = "failed"
                        err_job.metrics = {"error": str(e)}
                        await err_sess.commit()
            except:
                pass
            return {"status": "failed", "error": str(e)}

    return asyncio.run(run_job())


@shared_task(name="tasks.ml.self_improvement_cycle", queue="analytics")
def self_improvement_task():
    """Managed Celery task for the Endless Self-Improvement cycle.
    Reschedules itself after execution.
    """
    from app.services.training_service import self_improvement_service

    async def run():
        try:
            await self_improvement_service.run_single_cycle()
            # Optional: Automatic rescheduling logic if not using celery-beat
            # self_improvement_task.apply_async(countdown=300)
            return {"status": "success", "cycle": self_improvement_service.cycle_count}
        except Exception as e:
            return {"status": "error", "error": str(e)}

    return asyncio.run(run())
