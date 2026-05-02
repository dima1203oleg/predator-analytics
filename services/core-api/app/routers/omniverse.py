"""Omniverse Ingestion Router — PREDATOR Analytics v70.0.

Універсальна платформа імпорту даних (Data Agnosticism).
Дозволяє завантажувати будь-які CSV/JSON дані та автоматично
генерувати онтології (схеми графа та таблиць) за допомогою LLM.
"""
import hashlib
import uuid
import json
from typing import Any

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from app.core.permissions import Permission
from app.dependencies import PermissionChecker, get_current_active_user, get_tenant_id
from app.services.ai_service import AIService
from app.services.kafka_service import get_kafka_service
from app.services.minio_service import get_minio_service
from predator_common.logging import get_logger

logger = get_logger("core_api.omniverse")

router = APIRouter(prefix="/omniverse", tags=["omniverse", "ingestion"])


class SchemaInferenceResponse(BaseModel):
    """Модель відповіді для результату автоматичного виведення схеми."""
    
    status: str
    inferred_schema: dict[str, Any]
    preview_data: list[dict[str, Any]]
    message: str


class IngestResponse(BaseModel):
    """Модель відповіді для запуску процесу інгестії."""
    
    job_id: str
    status: str
    file_size_bytes: int
    message: str


@router.post("/schema/infer", response_model=SchemaInferenceResponse)
async def infer_schema(
    file: UploadFile = File(...),
    tenant_id: str = Depends(get_tenant_id),
    current_user: dict = Depends(get_current_active_user),
    _ = Depends(PermissionChecker([Permission.WRITE_CORP_DATA])),
):
    """
    Зчитує семпл файлу (до 50 рядків) та використовує Sovereign AI
    для виведення універсальної онтології: структури таблиць ClickHouse
    та вузлів/зв'язків Neo4j.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Файл не вказано")

    allowed_extensions = {".csv", ".json"}
    file_ext = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Непідтримуваний формат для авто-схеми. Дозволені: {', '.join(allowed_extensions)}"
        )

    # Зчитуємо тільки семпл даних (перші ~50КБ щоб отримати кілька рядків)
    content = await file.read(50 * 1024)
    text_content = content.decode("utf-8", errors="replace")
    
    # Витягуємо перші рядки для розуміння
    lines = text_content.splitlines()
    sample_lines = lines[:20]
    sample_text = "\n".join(sample_lines)

    # Формуємо промпт для LLM
    prompt = f"""
    Ти - Knowledge Engineer для платформи PREDATOR OMNIVERSE.
    Твоя задача - проаналізувати наданий зразок сирих даних і вивести універсальну схему для їх зберігання.
    
    Зразок даних (формат {file_ext}):
    {sample_text}
    
    Сформуй JSON відповідь, яка міститиме:
    1. clickhouse_schema: список колонок з їхніми типами даних.
    2. neo4j_ontology: пропозиція вузлів (Nodes) та зв'язків (Relationships), які можна витягнути з цих даних.
    3. entity_mapping: як саме колонки мапляться на вузли графа.
    
    Відповідай ВИКЛЮЧНО у валідному JSON форматі без маркдаун блоків.
    """

    try:
        llm_response = await AIService.generate_insight(
            prompt=prompt,
            context={"task": "schema_inference", "filename": file.filename}
        )
        
        # Спроба розпарсити відповідь як JSON
        # Інколи LLM повертає JSON в маркдаун блоках ```json ... ```
        clean_json = llm_response.strip()
        if clean_json.startswith("```json"):
            clean_json = clean_json[7:-3].strip()
        elif clean_json.startswith("```"):
            clean_json = clean_json[3:-3].strip()
            
        inferred_schema = json.loads(clean_json)
        
    except json.JSONDecodeError as e:
        logger.error(f"Помилка парсингу LLM JSON схеми: {e}, Response: {llm_response}")
        inferred_schema = {
            "error": "Не вдалося автоматично згенерувати схему у форматі JSON. Відповідь моделі була неформатованою.",
            "raw_response": llm_response
        }
    except Exception as e:
        logger.error(f"Помилка AIService при генерації схеми: {e}")
        raise HTTPException(status_code=500, detail="Помилка при генерації схеми через Sovereign AI")

    return SchemaInferenceResponse(
        status="success",
        inferred_schema=inferred_schema,
        preview_data=[{"sample": "Дані приховані в цій версії"}],
        message="Схема успішно згенерована за допомогою AI."
    )


@router.post("/ingest", response_model=IngestResponse, status_code=202)
async def universal_ingest(
    file: UploadFile = File(...),
    schema_definition: str = Form(...),
    domain: str = Form(default="universal"),
    tenant_id: str = Depends(get_tenant_id),
    current_user: dict = Depends(get_current_active_user),
    _ = Depends(PermissionChecker([Permission.WRITE_CORP_DATA])),
):
    """
    Завантажує файл разом із затвердженою користувачем схемою.
    Ініціює універсальний процес інгестії, передаючи файл до Kafka.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Файл не вказано")

    try:
        parsed_schema = json.loads(schema_definition)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="schema_definition повинен бути валідним JSON")

    # Читаємо весь файл
    content = await file.read()
    file_size = len(content)
    content_hash = hashlib.sha256(content).hexdigest()
    
    job_id = str(uuid.uuid4())
    user_id = current_user.get("sub", "system")

    # Зберігаємо файл в MinIO
    minio = get_minio_service()
    await minio.ensure_tenant_buckets(tenant_id)

    object_name = f"omniverse/{job_id}/{file.filename}"
    content_type = file.content_type or "application/octet-stream"
    bucket_name = minio.get_raw_bucket(tenant_id)

    _success, s3_path, _ = await minio.upload_file(
        bucket=bucket_name,
        object_name=object_name,
        data=content,
        content_type=content_type,
    )

    # Відправляємо подію в Kafka для Ingestion Worker (Universal Parser)
    kafka = get_kafka_service()
    await kafka.publish_event(
        topic="omniverse-ingestion-triggers",
        event_type="omniverse_ingestion_started",
        payload={
            "job_id": job_id,
            "tenant_id": tenant_id,
            "user_id": user_id,
            "domain": domain,
            "file_name": file.filename,
            "file_size": file_size,
            "content_hash": content_hash,
            "s3_path": s3_path,
            "schema_definition": parsed_schema
        }
    )

    return IngestResponse(
        job_id=job_id,
        status="queued",
        file_size_bytes=file_size,
        message="Файл прийнято до універсальної обробки."
    )
