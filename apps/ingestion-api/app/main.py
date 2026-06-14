from contextlib import asynccontextmanager
import logging
import os
import uuid

import aiofiles
from confluent_kafka import Producer
from fastapi import FastAPI, File, Form, HTTPException, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware

# Припускаємо, що libs додано до PYTHONPATH під час деплою
from libs.core.schemas.events import RawIngestionEvent

from app.services.minio_client import minio_client
from app.services.redis_client import redis_client

# Налаштування логування
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ingestion-api")

# Конфігурація Kafka
KAFKA_BROKERS = os.getenv("REDPANDA_BROKERS", "redpanda:9092")
RAW_DATA_TOPIC = "raw-data"

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Керування життєвим циклом застосунку.
    Ініціалізація та очищення ресурсів (Kafka Producer).
    """
    logger.info("🚀 Ingestion API запускається...")

    # Ініціалізація Kafka Producer
    producer_conf = {
        'bootstrap.servers': KAFKA_BROKERS,
        'client.id': 'ingestion-api'
    }

    app.state.kafka_producer = None
    try:
        app.state.kafka_producer = Producer(producer_conf)
        logger.info(f"✅ Підключено до Redpanda за адресою {KAFKA_BROKERS}")
    except Exception as e:
        logger.error(f"❌ Помилка підключення до Redpanda: {e}")

    await redis_client.connect()
    minio_client.connect()

    # Create temporary directory for TUS uploads
    os.makedirs("/tmp/tus_uploads", exist_ok=True)  # noqa: S108

    yield

    # Очищення ресурсів
    if app.state.kafka_producer:
        logger.info("⏳ Очікування завершення черги повідомлень Kafka...")
        app.state.kafka_producer.flush()
    await redis_client.close()
    logger.info("🛑 Ingestion API завершує роботу...")

app = FastAPI(
    title="PREDATOR Analytics - Ingestion API",
    version="61.0.0-ELITE",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    # Заголовки, необхідні для роботи протоколу Tus
    expose_headers=[
        "Upload-Offset", "Location", "Upload-Length", "Tus-Resumable",
        "Tus-Version", "Tus-Max-Size", "Tus-Extension", "Upload-Metadata",
        "Upload-Defer-Length", "Upload-Concat"
    ]
)

def delivery_report(err, msg):
    """Звіт про доставку повідомлення в Kafka."""
    if err is not None:
        logger.error(f"❌ Помилка доставки повідомлення: {err}")
    else:
        logger.info(f"✅ Повідомлення доставлено в {msg.topic()} [{msg.partition()}]")

@app.get("/health")
def health_check():
    """Перевірка працездатності сервісу."""
    return {"status": "ok", "service": "ingestion-api", "version": "61.0.0-ELITE"}

# ═══════════════════════════════════════════════════════════════════════════
# TUS RESUMABLE UPLOAD (Протокол довантаження файлів)
# ═══════════════════════════════════════════════════════════════════════════

@app.options("/upload/tus")
async def tus_options(request: Request):
    """Отримання параметрів протоколу Tus."""
    response = Response()
    response.headers["Tus-Resumable"] = "1.0.0"
    response.headers["Tus-Version"] = "1.0.0"
    response.headers["Tus-Extension"] = "creation,termination,file-check"
    response.headers["Tus-Max-Size"] = "10737418240" # 10 ГБ
    return response

@app.post("/upload/tus")
async def tus_create(request: Request):
    """Створення нової сесії довантаження."""
    upload_length = request.headers.get("Upload-Length")
    if not upload_length:
        raise HTTPException(status_code=400, detail="Заголовок Upload-Length відсутній")

    job_id = str(uuid.uuid4())
    # Зберігаємо метадані в Redis
    await redis_client.set_metadata(job_id, {
        "upload_length": upload_length,
        "upload_offset": "0"
    })

    # Створюємо порожній тимчасовий файл
    tmp_path = f"/tmp/tus_uploads/{job_id}"  # noqa: S108
    open(tmp_path, "wb").close()

    response = Response(status_code=201)
    response.headers["Tus-Resumable"] = "1.0.0"
    response.headers["Location"] = f"/upload/tus/{job_id}"
    return response

@app.patch("/upload/tus/{job_id}")
async def tus_patch(request: Request, job_id: str):
    """Завантаження фрагмента файлу."""
    upload_offset = request.headers.get("Upload-Offset")
    if upload_offset is None:
        raise HTTPException(status_code=400, detail="Заголовок Upload-Offset відсутній")

    # Читання тіла запиту (фрагмент файлу)
    body = await request.body()

    # Дописуємо дані у тимчасовий файл
    tmp_path = f"/tmp/tus_uploads/{job_id}"  # noqa: S108
    async with aiofiles.open(tmp_path, "ab") as f:
        await f.write(body)

    new_offset = int(upload_offset) + len(body)
    upload_length = request.headers.get("Upload-Length")

    # Оновлюємо offset в Redis
    await redis_client.set_metadata(job_id, {"upload_offset": str(new_offset)})

    if upload_length and new_offset >= int(upload_length):
        # Файл завантажено повністю — завантажуємо в MinIO та фіналізуємо
        async with aiofiles.open(tmp_path, "rb") as f:
            file_data = await f.read()

        bucket = "uploads"
        object_name = f"tus/{job_id}"
        target_uri = await minio_client.upload_file(bucket, object_name, file_data)

        await finalize_upload(job_id, "default_tenant", "auto", target_uri, "resumable_upload")

        # Очищуємо тимчасовий файл
        os.remove(tmp_path)

    response = Response(status_code=204)
    response.headers["Tus-Resumable"] = "1.0.0"
    response.headers["Upload-Offset"] = str(new_offset)
    return response

# ═══════════════════════════════════════════════════════════════════════════
# ПРЯМЕ ЗАВАНТАЖЕННЯ (Fallback)
# ═══════════════════════════════════════════════════════════════════════════

@app.post("/upload/direct")
async def upload_direct(
    tenant_id: str = Form(...),
    source_type: str = Form(..., description="excel, pdf, json, etc."),
    file: UploadFile = File(...)
):
    """Стандартний ендпоїнт для прямого завантаження файлів."""
    job_id = str(uuid.uuid4())

    # Читаємо та завантажуємо у MinIO
    file_data = await file.read()
    bucket = "uploads"
    object_name = f"{tenant_id}/{job_id}_{file.filename}"

    target_uri = await minio_client.upload_file(bucket, object_name, file_data, content_type=file.content_type)

    await finalize_upload(job_id, tenant_id, source_type, target_uri, file.filename)

    return {
        "job_id": job_id,
        "status": "accepted",
        "file": file.filename
    }

async def finalize_upload(job_id: str, tenant_id: str, source_type: str, uri: str, original_filename: str):
    """Відправка події про завершення завантаження в Kafka."""
    if not app.state.kafka_producer:
        logger.error("❌ Kafka Producer не налаштований, неможливо надіслати подію")
        return

    event = RawIngestionEvent(
        job_id=job_id,
        tenant_id=tenant_id,
        source_type=source_type,
        source_uri=uri,
        metadata={"original_filename": original_filename}
    )

    try:
        app.state.kafka_producer.produce(
            RAW_DATA_TOPIC,
            key=tenant_id.encode('utf-8'),
            value=event.model_dump_json().encode('utf-8'),
            callback=delivery_report
        )
        # Опитування для виклику callback
        app.state.kafka_producer.poll(0)
        logger.info(f"✅ Опубліковано RawIngestionEvent для завдання {job_id}")
    except Exception as e:
        logger.error(f"❌ Не вдалося опублікувати подію в Kafka: {e}")
