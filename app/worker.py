from __future__ import annotations


"""UA Sources - Celery Worker Entry Point."""
from app.core.celery_app import celery_app
from app.tasks.custom_intel import analyze_customs_intel
from app.tasks.etl_workers import index_gold_documents, parse_external_source, process_staging_records
from app.tasks.pipeline import process_pipeline_task


if __name__ == "__main__":
    celery_app.start()
