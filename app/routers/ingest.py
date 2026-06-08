import asyncio
from datetime import datetime
import json
import logging
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.connectors.telegram_channel import telegram_channel_connector
from app.models.ingestion import (
    IngestionJob,
    IngestionProgress,
    IngestionResponse,
    IngestionStatus,
)
from app.services.ingestion_service import IngestionService
from app.services.telegram_pipeline import get_telegram_pipeline

# In a real app, use a real auth dependency. Mocking for now if file doesn't exist
try:
    from app.core.security import get_current_user
except ImportError:

    async def get_current_user():
        return type("User", (), {"id": "mock-user-id"})


router = APIRouter(prefix="/ingest", tags=["ingestion"])
logger = logging.getLogger(__name__)

# In-memory storage for jobs (Use Redis in production)
ingestion_jobs: dict = {}


class TelegramIngestRequest(BaseModel):
    url: str
    name: str | None = None
    sector: str | None = None
    limit: int = 100


class ApiIngestRequest(BaseModel):
    url: str
    method: str = "GET"
    headers: dict = {}
    body: dict | None = None
    name: str | None = None
    limit: int = 100


class RssIngestRequest(BaseModel):
    url: str
    name: str | None = None
    limit: int = 100


class WebsiteIngestRequest(BaseModel):
    url: str
    name: str | None = None
    depth: int = 1
    limit: int = 100


async def process_file_async(
    job_id: str,
    content: bytes,
    filename: str,
    file_type: str,
    user_id: str,
    dataset_name: str | None,
):
    """Background task to process file with granular progress updates."""
    job = ingestion_jobs.get(job_id)
    if not job:
        return

    service = IngestionService()

    try:
        # Phase 1: Validation
        job.status = IngestionStatus.VALIDATING
        job.progress.stage = "validating"
        job.progress.message = "Перевірка структури файлу..."
        job.updated_at = datetime.utcnow()
        await asyncio.sleep(0.5)  # UX feel

        await service.validate_file(content, file_type)
        job.progress.percent = 10

        # Phase 2: Parsing
        job.status = IngestionStatus.PARSING
        job.progress.stage = "parsing"
        job.progress.message = "Читання та парсинг даних..."
        job.updated_at = datetime.utcnow()

        records = []
        if file_type in [".xlsx", ".xls", ".csv"]:
            records = await service.parse_excel(content, filename)
        elif file_type == ".pdf":
            records = await service.parse_pdf(content)
        elif file_type in [".docx", ".doc", ".txt"]:
            records = await service.parse_document(content, file_type)
        else:
            # Fallback or unknown
            records = [{"content": "unknown format", "type": "unknown"}]

        job.progress.total_items = len(records)
        job.progress.percent = 30
        job.progress.message = f"Знайдено {len(records)} записів"

        # Phase 2.5: Entity Resolution (UEID) & Data Fusion Persistence
        job.progress.stage = "entity_resolution"
        job.progress.message = "Резолюція суб'єктів (UEID)..."
        job.updated_at = datetime.utcnow()


        from app.core.signal_bus import SignalBus
        from app.libs.core.database import get_db_ctx
        from app.models.v55.signal import SignalLayer, SignalPriority, V55Signal
        from app.repositories.entity_repository import EntityRepository
        from app.repositories.fused_record_repository import FusedRecordRepository

        unique_ueids = set()

        if file_type in [".xlsx", ".xls", ".csv"] and records:
            async with get_db_ctx() as db:
                repo = EntityRepository(db)
                fused_repo = FusedRecordRepository(db)
                bus = SignalBus.get_instance()

                # Use IngestionService to resolve entities, fetch registry data and store fused records
                unique_ueids = await service.resolve_entities(records, filename, repo, fused_repo, job, db)

                await db.commit()

                # Pre-emit `data.ingested` signals
                for u in unique_ueids:
                    sig = V55Signal(
                        signal_type="DATA_INGESTED",
                        topic="data.ingested",
                        ueid=u,
                        layer=SignalLayer.BEHAVIORAL,
                        priority=SignalPriority.ROUTINE,
                        score=0.0,
                        confidence=1.0,
                        summary=f"New data ingested from {filename}"
                    )
                    await bus.emit(sig, session=db)

                await db.commit()

        # Phase 3: Chunking
        job.status = IngestionStatus.CHUNKING
        job.progress.stage = "chunking"
        job.progress.message = "Підготовка даних..."
        job.updated_at = datetime.utcnow()

        chunks = await service.create_chunks(records)
        job.progress.percent = 40

        # Phase 4: Embedding
        job.status = IngestionStatus.EMBEDDING
        job.progress.stage = "embedding"
        job.updated_at = datetime.utcnow()

        total_chunks = len(chunks)
        for i, chunk in enumerate(chunks):
            job.progress.current_item = i + 1
            # Scale progress from 40% to 70%
            job.progress.percent = 40 + ((i + 1) / total_chunks) * 30
            job.progress.message = f"Створення embeddings: {i + 1}/{total_chunks}"

            await service.create_embedding(chunk)

        # Phase 5: Indexing
        job.status = IngestionStatus.INDEXING
        job.progress.stage = "indexing"
        job.updated_at = datetime.utcnow()

        for i, chunk in enumerate(chunks):
            job.progress.current_item = i + 1
            # Scale progress from 70% to 95%
            job.progress.percent = 70 + ((i + 1) / total_chunks) * 25
            job.progress.message = f"Індексація даних: {i + 1}/{total_chunks}"

            await service.index_chunk(chunk)

        # Phase 6: Finalizing
        job.progress.stage = "finalizing"
        job.progress.message = "Збереження метаданих..."
        job.updated_at = datetime.utcnow()

        await service.save_dataset_metadata(job_id, filename, len(records), user_id, dataset_name)

        job.status = IngestionStatus.READY
        job.progress.stage = "ready"
        job.progress.percent = 100
        job.progress.message = f"Успішно оброблено {len(records)} записів"
        job.updated_at = datetime.utcnow()

    except Exception as e:
        logger.exception(f"Ingestion failed for job {job_id}")
        job.status = IngestionStatus.FAILED
        job.progress.stage = "failed"
        job.error = str(e)
        job.progress.message = f"Помилка: {e!s}"
        job.updated_at = datetime.utcnow()


async def process_telegram_async(job_id: str, url: str, limit: int, user_id: str, config: dict):
    """Background task to process Telegram channel with Telethon."""
    job = ingestion_jobs.get(job_id)
    if not job:
        return

    pipeline = get_telegram_pipeline()

    try:
        # Phase 1: Authentication & Connection
        job.status = IngestionStatus.VALIDATING
        job.progress.stage = "AUTH"
        job.progress.message = "Підключення до Telegram API..."
        job.updated_at = datetime.utcnow()

        # Extract username from URL
        username = url.rsplit("/", maxsplit=1)[-1].replace("@", "")

        # Phase 2: Fetching
        job.status = IngestionStatus.PARSING
        job.progress.stage = "FETCH"
        job.progress.message = f"Отримання історії каналу @{username}..."
        job.updated_at = datetime.utcnow()
        await asyncio.sleep(0.5)

        # Get history via Telethon connector
        # Note: In a real app, we'd ensure the connector is initialized with valid session
        result = await telegram_channel_connector.fetch_channel_history(username, limit=limit)

        if not result.success:
            raise ValueError(f"Telethon error: {result.error}")

        messages = result.data
        job.progress.total_items = len(messages)
        job.progress.percent = 30
        job.progress.message = f"Знайдено {len(messages)} повідомлень"

        # Phase 3: Processing & Enrichment
        job.status = IngestionStatus.EMBEDDING
        job.progress.stage = "PARSE"
        job.updated_at = datetime.utcnow()

        processed_count = 0
        for i, msg in enumerate(messages):
            job.progress.current_item = i + 1
            job.progress.percent = 30 + ((i + 1) / len(messages)) * 60
            job.progress.message = f"Обробка повідомлень: {i + 1}/{len(messages)}"

            # Process via Intelligence Pipeline
            # We pass a simplified message dict or the raw one if compat
            await pipeline.process_message(msg, {"name": username})

            # Simulated indexing for now as in process_file_async
            processed_count += 1
            if i % 10 == 0:
                await asyncio.sleep(0.1)  # Yield to event loop

        # Phase 4: Finalizing
        job.status = IngestionStatus.READY
        job.progress.stage = "READY"
        job.progress.percent = 100
        job.progress.message = f"Успішно оброблено {processed_count} повідомлень з @{username}"
        job.updated_at = datetime.utcnow()

    except Exception as e:
        logger.exception(f"Telegram ingestion failed for job {job_id}")
        job.status = IngestionStatus.FAILED
        job.progress.stage = "failed"
        job.error = str(e)
        job.progress.message = f"Помилка: {e!s}"
        job.updated_at = datetime.utcnow()


async def process_website_async(job_id: str, url: str, limit: int, user_id: str, config: dict):
    """Асинхронне фонове завдання для парсингу веб-сайту."""
    job = ingestion_jobs.get(job_id)
    if not job:
        return

    from html.parser import HTMLParser

    import httpx

    from app.etl.processor import etl_processor
    from app.services.indexing_service import indexing_service

    class WebTextParser(HTMLParser):
        def __init__(self):
            super().__init__()
            self.text_parts = []
            self.in_script_or_style = False
            self.title = ""
            self.in_title = False

        def handle_starttag(self, tag, attrs):
            if tag in ["script", "style"]:
                self.in_script_or_style = True
            elif tag == "title":
                self.in_title = True

        def handle_endtag(self, tag):
            if tag in ["script", "style"]:
                self.in_script_or_style = False
            elif tag == "title":
                self.in_title = False

        def handle_data(self, data):
            if self.in_title:
                self.title = data.strip()
            elif not self.in_script_or_style:
                text = data.strip()
                if text:
                    self.text_parts.append(text)

        def get_text(self):
            return " ".join(self.text_parts)

    try:
        # Фаза 1: Валідація та підключення
        job.status = IngestionStatus.VALIDATING
        job.progress.stage = "CONNECTING"
        job.progress.message = f"Підключення до {url}..."
        job.updated_at = datetime.utcnow()
        await asyncio.sleep(0.5)

        # Фаза 2: Отримання контенту
        job.status = IngestionStatus.PARSING
        job.progress.stage = "FETCHING"
        job.progress.message = "Завантаження сторінки..."
        job.updated_at = datetime.utcnow()

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, follow_redirects=True)
            response.raise_for_status()
            html_content = response.text

        # Фаза 3: Парсинг
        job.progress.stage = "PARSING"
        job.progress.message = "Парсинг вмісту сторінки..."
        job.updated_at = datetime.utcnow()

        parser = WebTextParser()
        parser.feed(html_content)

        record = {
            "url": url,
            "title": parser.title or url,
            "content": parser.get_text()[:5000],
            "ingested_at": datetime.utcnow().isoformat(),
            "source_type": "website"
        }

        # Фаза 4: ETL та трансформація
        job.status = IngestionStatus.EMBEDDING
        job.progress.stage = "ETL"
        job.progress.message = "Трансформація даних через ETL пайплайн..."
        job.updated_at = datetime.utcnow()

        etl_res = await etl_processor.process([record], pipeline="default")
        if not etl_res.success:
            raise ValueError(f"Помилка ETL: {', '.join(etl_res.errors)}")

        # Фаза 5: Індексація
        job.status = IngestionStatus.INDEXING
        job.progress.stage = "INDEXING"
        job.progress.message = "Індексація в бази даних..."
        job.updated_at = datetime.utcnow()

        await indexing_service.index_documents([record], dataset_type="website", index_name="websites")

        # Завершення
        job.status = IngestionStatus.READY
        job.progress.stage = "READY"
        job.progress.percent = 100
        job.progress.message = f"Успішно оброблено веб-сторінку: {parser.title or url}"
        job.updated_at = datetime.utcnow()

    except Exception as e:
        logger.exception(f"Website ingestion failed for job {job_id}")
        job.status = IngestionStatus.FAILED
        job.progress.stage = "failed"
        job.error = str(e)
        job.progress.message = f"Помилка: {e!s}"
        job.updated_at = datetime.utcnow()


async def process_api_async(job_id: str, url: str, method: str, headers: dict, body: dict | None, limit: int, user_id: str, config: dict):
    """Асинхронне фонове завдання для парсингу API."""
    job = ingestion_jobs.get(job_id)
    if not job:
        return

    import httpx

    from app.etl.processor import etl_processor
    from app.services.indexing_service import indexing_service

    try:
        # Фаза 1: Валідація та підключення
        job.status = IngestionStatus.VALIDATING
        job.progress.stage = "CONNECTING"
        job.progress.message = f"Надсилання запиту до API: {method} {url}..."
        job.updated_at = datetime.utcnow()
        await asyncio.sleep(0.5)

        # Фаза 2: Отримання контенту
        job.status = IngestionStatus.PARSING
        job.progress.stage = "FETCHING"
        job.progress.message = "Очікування відповіді від API..."
        job.updated_at = datetime.utcnow()

        async with httpx.AsyncClient(timeout=10.0) as client:
            if method.upper() == "POST":
                response = await client.post(url, headers=headers, json=body)
            else:
                response = await client.get(url, headers=headers)
            response.raise_for_status()

            try:
                api_data = response.json()
            except Exception:
                api_data = {"response_text": response.text}

        # Фаза 3: Парсинг та підготовка записів
        job.progress.stage = "PARSING"
        job.progress.message = "Структурування відповіді API..."
        job.updated_at = datetime.utcnow()

        records = []
        if isinstance(api_data, list):
            for i, item in enumerate(api_data[:limit]):
                records.append({
                    "source_url": url,
                    "index": i,
                    "data": item,
                    "ingested_at": datetime.utcnow().isoformat(),
                    "source_type": "api"
                })
        else:
            records.append({
                "source_url": url,
                "data": api_data,
                "ingested_at": datetime.utcnow().isoformat(),
                "source_type": "api"
            })

        job.progress.total_items = len(records)

        # Фаза 4: ETL та трансформація
        job.status = IngestionStatus.EMBEDDING
        job.progress.stage = "ETL"
        job.progress.message = f"Трансформація {len(records)} записів..."
        job.updated_at = datetime.utcnow()

        etl_res = await etl_processor.process(records, pipeline="default")
        if not etl_res.success:
            raise ValueError(f"Помилка ETL: {', '.join(etl_res.errors)}")

        # Фаза 5: Індексація
        job.status = IngestionStatus.INDEXING
        job.progress.stage = "INDEXING"
        job.progress.message = "Індексація даних в сховища..."
        job.updated_at = datetime.utcnow()

        await indexing_service.index_documents(records, dataset_type="api", index_name="api_data")

        # Завершення
        job.status = IngestionStatus.READY
        job.progress.stage = "READY"
        job.progress.percent = 100
        job.progress.message = f"Успішно оброблено {len(records)} записів з API"
        job.updated_at = datetime.utcnow()

    except Exception as e:
        logger.exception(f"API ingestion failed for job {job_id}")
        job.status = IngestionStatus.FAILED
        job.progress.stage = "failed"
        job.error = str(e)
        job.progress.message = f"Помилка: {e!s}"
        job.updated_at = datetime.utcnow()


async def process_rss_async(job_id: str, url: str, limit: int, user_id: str, config: dict):
    """Асинхронне фонове завдання для парсингу RSS-стрічки."""
    job = ingestion_jobs.get(job_id)
    if not job:
        return

    import xml.etree.ElementTree as ET

    import httpx

    from app.etl.processor import etl_processor
    from app.services.indexing_service import indexing_service

    try:
        # Фаза 1: Валідація та підключення
        job.status = IngestionStatus.VALIDATING
        job.progress.stage = "CONNECTING"
        job.progress.message = f"Підключення до RSS: {url}..."
        job.updated_at = datetime.utcnow()
        await asyncio.sleep(0.5)

        # Фаза 2: Отримання контенту
        job.status = IngestionStatus.PARSING
        job.progress.stage = "FETCHING"
        job.progress.message = "Завантаження RSS-стрічки..."
        job.updated_at = datetime.utcnow()

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            xml_content = response.content

        # Фаза 3: Парсинг XML
        job.progress.stage = "PARSING"
        job.progress.message = "Аналіз XML структури..."
        job.updated_at = datetime.utcnow()

        root = ET.fromstring(xml_content)
        items = root.findall(".//item")

        records = []
        for item in items[:limit]:
            title = item.findtext("title") or "No Title"
            link = item.findtext("link") or ""
            desc = item.findtext("description") or ""
            pub_date = item.findtext("pubDate") or ""

            records.append({
                "title": title,
                "link": link,
                "description": desc,
                "pub_date": pub_date,
                "source_url": url,
                "ingested_at": datetime.utcnow().isoformat(),
                "source_type": "rss"
            })

        if not records:
            raise ValueError("Не знайдено жодного запису <item> в RSS")

        job.progress.total_items = len(records)

        # Фаза 4: ETL та трансформація
        job.status = IngestionStatus.EMBEDDING
        job.progress.stage = "ETL"
        job.progress.message = f"Трансформація {len(records)} новин RSS..."
        job.updated_at = datetime.utcnow()

        etl_res = await etl_processor.process(records, pipeline="default")
        if not etl_res.success:
            raise ValueError(f"Помилка ETL: {', '.join(etl_res.errors)}")

        # Фаза 5: Індексація
        job.status = IngestionStatus.INDEXING
        job.progress.stage = "INDEXING"
        job.progress.message = "Індексація новин RSS..."
        job.updated_at = datetime.utcnow()

        await indexing_service.index_documents(records, dataset_type="rss", index_name="rss_feeds")

        # Завершення
        job.status = IngestionStatus.READY
        job.progress.stage = "READY"
        job.progress.percent = 100
        job.progress.message = f"Успішно імпортовано {len(records)} новин з RSS"
        job.updated_at = datetime.utcnow()

    except Exception as e:
        logger.exception(f"RSS ingestion failed for job {job_id}")
        job.status = IngestionStatus.FAILED
        job.progress.stage = "failed"
        job.error = str(e)
        job.progress.message = f"Помилка: {e!s}"
        job.updated_at = datetime.utcnow()


@router.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


@router.post("/upload", response_model=IngestionResponse)
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    dataset_name: str | None = None,
    current_user=Depends(get_current_user),
):
    """Upload file for ingestion with background processing."""
    allowed_extensions = {".xlsx", ".xls", ".csv", ".pdf", ".docx", ".doc", ".txt", ".json"}
    file_ext = "." + file.filename.split(".")[-1].lower() if "." in file.filename else ""

    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format. Allowed: {', '.join(allowed_extensions)}",
        )

    # Read content (In prod: stream to disk/S3 for large files)
    try:
        content = await file.read()
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to read file")

    # Limit size (e.g. 500MB)
    if len(content) > 500 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 500MB)")

    job_id = str(uuid.uuid4())
    job = IngestionJob(
        id=job_id,
        filename=file.filename,
        file_size=len(content),
        file_type=file_ext,
        status=IngestionStatus.UPLOADING,
        user_id=getattr(current_user, "id", "anonymous"),
        created_at=datetime.utcnow(),
        progress=IngestionProgress(stage="queued", percent=0, message="Файл в черзі на обробку"),
    )

    ingestion_jobs[job_id] = job

    # Start background processing
    background_tasks.add_task(
        process_file_async,
        job_id=job_id,
        content=content,
        filename=file.filename,
        file_type=file_ext,
        user_id=getattr(current_user, "id", "anonymous"),
        dataset_name=dataset_name,
    )

    return IngestionResponse(
        job_id=job_id,
        status=IngestionStatus.UPLOADING,
        message="Файл прийнято до обробки",
        status_url=f"/api/v1/ingest/status/{job_id}",
        stream_url=f"/api/v1/ingest/stream/{job_id}",
    )


@router.post("/telegram", response_model=dict)
async def ingest_telegram(
    request: TelegramIngestRequest,
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_user),
):
    """Initiate Telegram channel parsing."""
    job_id = str(uuid.uuid4())
    job = IngestionJob(
        id=job_id,
        filename=f"telegram_{request.url.split('/')[-1]}",
        file_size=0,
        file_type="telegram",
        status=IngestionStatus.UPLOADING,
        user_id=getattr(current_user, "id", "anonymous"),
        created_at=datetime.utcnow(),
        progress=IngestionProgress(
            stage="CREATED", percent=0, message="Запит на парсинг Telegram прийнято"
        ),
    )

    ingestion_jobs[job_id] = job

    # Start background task
    background_tasks.add_task(
        process_telegram_async,
        job_id=job_id,
        url=request.url,
        limit=request.limit,
        user_id=getattr(current_user, "id", "anonymous"),
        config={"name": request.name, "sector": request.sector},
    )

    return {
        "status": "success",
        "job_id": job_id,
        "source_id": job_id,  # Frontend compat
        "message": "Парсинг розпочато",
    }


@router.post("/website", response_model=dict)
async def ingest_website(
    request: WebsiteIngestRequest,
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_user),
):
    """Initiate Website parsing."""
    job_id = str(uuid.uuid4())
    job = IngestionJob(
        id=job_id,
        filename=f"website_{request.url.split('/')[-1]}",
        file_size=0,
        file_type="website",
        status=IngestionStatus.UPLOADING,
        user_id=getattr(current_user, "id", "anonymous"),
        created_at=datetime.utcnow(),
        progress=IngestionProgress(
            stage="CREATED", percent=0, message="Запит на парсинг веб-сайту прийнято"
        ),
    )

    ingestion_jobs[job_id] = job

    background_tasks.add_task(
        process_website_async,
        job_id=job_id,
        url=request.url,
        limit=request.limit,
        user_id=getattr(current_user, "id", "anonymous"),
        config={"name": request.name, "depth": request.depth},
    )

    return {
        "status": "success",
        "job_id": job_id,
        "source_id": job_id,
        "message": "Парсинг веб-сайту розпочато",
    }


@router.post("/api", response_model=dict)
async def ingest_api(
    request: ApiIngestRequest,
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_user),
):
    """Initiate API parsing."""
    job_id = str(uuid.uuid4())
    job = IngestionJob(
        id=job_id,
        filename=f"api_{request.url.split('/')[-1]}",
        file_size=0,
        file_type="api",
        status=IngestionStatus.UPLOADING,
        user_id=getattr(current_user, "id", "anonymous"),
        created_at=datetime.utcnow(),
        progress=IngestionProgress(
            stage="CREATED", percent=0, message="Запит на парсинг API прийнято"
        ),
    )

    ingestion_jobs[job_id] = job

    background_tasks.add_task(
        process_api_async,
        job_id=job_id,
        url=request.url,
        method=request.method,
        headers=request.headers,
        body=request.body,
        limit=request.limit,
        user_id=getattr(current_user, "id", "anonymous"),
        config={"name": request.name},
    )

    return {
        "status": "success",
        "job_id": job_id,
        "source_id": job_id,
        "message": "Парсинг API розпочато",
    }


@router.post("/rss", response_model=dict)
async def ingest_rss(
    request: RssIngestRequest,
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_user),
):
    """Initiate RSS parsing."""
    job_id = str(uuid.uuid4())
    job = IngestionJob(
        id=job_id,
        filename=f"rss_{request.url.split('/')[-1]}",
        file_size=0,
        file_type="rss",
        status=IngestionStatus.UPLOADING,
        user_id=getattr(current_user, "id", "anonymous"),
        created_at=datetime.utcnow(),
        progress=IngestionProgress(
            stage="CREATED", percent=0, message="Запит на парсинг RSS прийнято"
        ),
    )

    ingestion_jobs[job_id] = job

    background_tasks.add_task(
        process_rss_async,
        job_id=job_id,
        url=request.url,
        limit=request.limit,
        user_id=getattr(current_user, "id", "anonymous"),
        config={"name": request.name},
    )

    return {
        "status": "success",
        "job_id": job_id,
        "source_id": job_id,
        "message": "Парсинг RSS розпочато",
    }


@router.get("/jobs")
async def list_jobs():
    """List all active and recent ingestion jobs."""
    jobs_list = []
    for job_id, job in ingestion_jobs.items():
        jobs_list.append(
            {
                "job_id": job_id,
                "source_file": job.filename,
                "state": job.status.value,
                "display_name": getattr(job, "display_name", job.filename),
                "progress": {
                    "percent": job.progress.percent,
                    "records_processed": job.progress.current_item,
                    "records_total": job.progress.total_items,
                },
                "timestamps": {
                    "created_at": job.created_at.isoformat()
                    if job.created_at
                    else datetime.utcnow().isoformat(),
                    "updated_at": job.updated_at.isoformat()
                    if hasattr(job, "updated_at") and job.updated_at
                    else datetime.utcnow().isoformat(),
                },
            }
        )

    # Sort by created_at descending
    jobs_list.sort(key=lambda x: x["timestamps"]["created_at"], reverse=True)
    return {"jobs": jobs_list}


@router.get("/status/{job_id}")
async def get_status(job_id: str):
    """Poll handling status."""
    job = ingestion_jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("/stream/{job_id}")
async def stream_progress(job_id: str):
    """Server-Sent Events (SSE) for real-time progress updates."""
    if job_id not in ingestion_jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    async def event_generator():
        last_percent = -1.0
        last_stage = ""

        while True:
            job = ingestion_jobs.get(job_id)
            if not job:
                yield f"data: {json.dumps({'status': 'not_found'})}\n\n"
                break

            # Send update if changed or every 2 seconds heartbeat
            if job.progress.percent != last_percent or job.progress.stage != last_stage:
                last_percent = job.progress.percent
                last_stage = job.progress.stage

                data = {
                    "status": job.status.value,
                    "stage": job.progress.stage,
                    "percent": round(job.progress.percent, 1),
                    "current": job.progress.current_item,
                    "total": job.progress.total_items,
                    "message": job.progress.message,
                    "error": job.error,
                }
                yield f"data: {json.dumps(data)}\n\n"

            if job.status in [IngestionStatus.READY, IngestionStatus.FAILED]:
                # Send one final update to be sure
                data = {
                    "status": job.status.value,
                    "stage": job.progress.stage,
                    "percent": 100 if job.status == IngestionStatus.READY else job.progress.percent,
                    "message": job.progress.message,
                    "error": job.error,
                }
                yield f"data: {json.dumps(data)}\n\n"
                break

            await asyncio.sleep(0.5)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )
