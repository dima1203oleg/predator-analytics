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


class QueryRequest(BaseModel):
    """Запит для отримання даних з таблиці."""
    limit: int = 100
    offset: int = 0
    filters: dict[str, Any] | None = None


@router.get("/tables")
async def list_omniverse_tables(
    tenant_id: str = Depends(get_tenant_id),
    current_user: dict = Depends(get_current_active_user),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Повертає список усіх таблиць OMNIVERSE для поточного тенанта."""
    from app.database import get_clickhouse_client
    client = get_clickhouse_client()
    
    # Шукаємо таблиці, що починаються на omniverse_{tenant_id}
    query = f"SHOW TABLES LIKE 'omniverse_{tenant_id}_%'"
    result = client.query(query)
    
    tables = [row[0] for row in result.result_rows]
    return {"tables": tables}


@router.get("/table/{table_name}/schema")
async def get_table_schema(
    table_name: str,
    tenant_id: str = Depends(get_tenant_id),
    current_user: dict = Depends(get_current_active_user),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Отримує структуру колонок конкретної таблиці."""
    # Безпека: дозволяємо доступ тільки до таблиць свого тенанта
    if not table_name.startswith(f"omniverse_{tenant_id}_"):
        raise HTTPException(status_code=403, detail="Доступ до цієї таблиці заборонено")
        
    from app.database import get_clickhouse_client
    client = get_clickhouse_client()
    
    query = f"DESCRIBE TABLE {table_name}"
    result = client.query(query)
    
    columns = [
        {"name": row[0], "type": row[1]} 
        for row in result.result_rows 
        if not row[0].startswith("_")  # Приховуємо системні поля
    ]
    return {"table": table_name, "columns": columns}


@router.post("/table/{table_name}/query")
async def query_table_data(
    table_name: str,
    request: QueryRequest,
    tenant_id: str = Depends(get_tenant_id),
    current_user: dict = Depends(get_current_active_user),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Виконує запит до таблиці з підтримкою пагінації та фільтрації."""
    if not table_name.startswith(f"omniverse_{tenant_id}_"):
        raise HTTPException(status_code=403, detail="Доступ до цієї таблиці заборонено")

    from app.database import get_clickhouse_client
    client = get_clickhouse_client()
    
    # Базовий запит
    where_clause = f"WHERE _tenant_id = '{tenant_id}'"
    if request.filters:
        # Спрощена фільтрація (тільки рівність для демонстрації)
        for key, value in request.filters.items():
            if isinstance(value, str):
                where_clause += f" AND `{key}` = '{value}'"
            else:
                where_clause += f" AND `{key}` = {value}"
                
    query = f"SELECT * EXCEPT(_tenant_id) FROM {table_name} {where_clause} ORDER BY _ingested_at DESC LIMIT {request.limit} OFFSET {request.offset}"
    
    try:
        result = client.query(query)
        data = [dict(zip(result.column_names, row)) for row in result.result_rows]
        
        # Отримуємо загальну кількість для пагінації
        count_query = f"SELECT count() FROM {table_name} {where_clause}"
        count_result = client.query(count_query)
        total_count = count_result.result_rows[0][0]
        
        return {
            "data": data,
            "total": total_count,
            "limit": request.limit,
            "offset": request.offset
        }
    except Exception as e:
        logger.error(f"Помилка виконання запиту до {table_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/graph")
async def get_omniverse_graph(
    tenant_id: str = Depends(get_tenant_id),
    current_user: dict = Depends(get_current_active_user),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Отримує всі вузли та зв'язки OMNIVERSE для поточного тенанта."""
    from app.services.neo4j_service import Neo4jService
    neo4j = Neo4jService()
    
    # Отримуємо вузли, що мають tenant_id
    query = """
    MATCH (n)
    WHERE n.tenant_id = $tenant
    OPTIONAL MATCH (n)-[r]->(m)
    WHERE m.tenant_id = $tenant
    RETURN n, r, m
    LIMIT 1000
    """
    
    try:
        records = await neo4j.run_query(query, {"tenant": tenant_id})
        
        nodes = {}
        edges = []
        
        for record in records:
            n = record.get("n")
            if n:
                node_id = str(n.element_id)
                if node_id not in nodes:
                    nodes[node_id] = {
                        "id": node_id,
                        "labels": list(n.labels),
                        "properties": dict(n)
                    }
            
            m = record.get("m")
            if m:
                node_id = str(m.element_id)
                if node_id not in nodes:
                    nodes[node_id] = {
                        "id": node_id,
                        "labels": list(m.labels),
                        "properties": dict(m)
                    }
            
            r = record.get("r")
            if r and n and m:
                edges.append({
                    "id": str(r.element_id),
                    "type": r.type,
                    "source": str(n.element_id),
                    "target": str(m.element_id),
                    "properties": dict(r)
                })
        
        return {
            "nodes": list(nodes.values()),
            "edges": edges
        }
    except Exception as e:
        logger.error(f"Помилка отримання графа OMNIVERSE: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class InsightRequest(BaseModel):
    """Запит для отримання AI аналітики."""
    table_name: str
    question: str


@router.post("/insights/ask")
async def get_omniverse_insight(
    request: InsightRequest,
    tenant_id: str = Depends(get_tenant_id),
    current_user: dict = Depends(get_current_active_user),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """
    Використовує Sovereign AI для аналізу даних у таблиці та надання відповідей
    на питання користувача у вільному форматі.
    """
    if not request.table_name.startswith(f"omniverse_{tenant_id}_"):
        raise HTTPException(status_code=403, detail="Доступ до цієї таблиці заборонено")

    from app.database import get_clickhouse_client
    client = get_clickhouse_client()
    
    try:
        # Отримуємо семпл даних (100 рядків) для контексту LLM
        query = f"SELECT * EXCEPT(_tenant_id, _job_id) FROM {request.table_name} WHERE _tenant_id = '{tenant_id}' LIMIT 100"
        result = client.query(query)
        data_sample = [dict(zip(result.column_names, row)) for row in result.result_rows]
        
        # Отримуємо схему таблиці
        schema_query = f"DESCRIBE TABLE {request.table_name}"
        schema_result = client.query(schema_query)
        schema_info = [f"{row[0]} ({row[1]})" for row in schema_result.result_rows if not row[0].startswith("_")]
        
        context = {
            "table_name": request.table_name,
            "columns": schema_info,
            "data_sample_preview": data_sample[:10]  # Тільки перші 10 для промпту, щоб не перевантажувати токени
        }
        
        prompt = f"""
        Ти - Senior OSINT Analyst платформи PREDATOR OMNIVERSE.
        Твоя задача - проаналізувати надані дані з таблиці '{request.table_name}' та відповісти на питання користувача.
        
        СТРУКТУРА ТАБЛИЦІ:
        {", ".join(schema_info)}
        
        ЗРАЗОК ДАНИХ (10 рядків):
        {json.dumps(data_sample[:10], ensure_ascii=False, indent=2)}
        
        ПИТАННЯ КОРИСТУВАЧА:
        {request.question}
        
        Будь ласка, надай глибоку, професійну відповідь українською мовою. 
        Якщо дані дозволяють, зроби висновки про ризики, тренди або аномалії.
        Якщо для відповіді недостатньо даних, поясни чому.
        """
        
        insight = await AIService.generate_insight(
            prompt=prompt,
            context={"task": "omniverse_insight", "table": request.table_name}
        )
        
        return {
            "answer": insight,
            "context_used": {
                "rows_analyzed": len(data_sample),
                "table": request.table_name
            }
        }
        
    except Exception as e:
        logger.error(f"Помилка генерації інсайту для OMNIVERSE: {e}")
        raise HTTPException(status_code=500, detail=str(e))
