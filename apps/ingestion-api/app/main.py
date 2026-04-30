import logging
import os
import uuid

from confluent_kafka import Producer
from fastapi import FastAPI, File, Form, HTTPException, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware

# Assuming libs is added to PYTHONPATH in docker/deployment
from libs.core.schemas.events import RawIngestionEvent

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ingestion-api")

app = FastAPI(title="Predator Analytics - Ingestion API", version="54.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    # Required for tus protocol
    expose_headers=["Upload-Offset", "Location", "Upload-Length", "Tus-Version", "Tus-Resumable", "Tus-Max-Size", "Tus-Extension", "Upload-Metadata", "Upload-Defer-Length", "Upload-Concat"]
)

# Kafka Configuration
KAFKA_BROKERS = os.getenv("REDPANDA_BROKERS", "redpanda:9092")
RAW_DATA_TOPIC = "raw-data"

producer_conf = {
    'bootstrap.servers': KAFKA_BROKERS,
    'client.id': 'ingestion-api'
}

try:
    kafka_producer = Producer(producer_conf)
    logger.info(f"Connected to Redpanda at {KAFKA_BROKERS}")
except Exception as e:
    logger.error(f"Failed to connect to Redpanda: {e}")
    kafka_producer = None

def delivery_report(err, msg):
    if err is not None:
        logger.error(f"Message delivery failed: {err}")
    else:
        logger.info(f"Message delivered to {msg.topic()} [{msg.partition()}]")

@app.on_event("startup")
async def startup_event():
    logger.info("Ingestion API staring up...")

@app.on_event("shutdown")
async def shutdown_event():
    if kafka_producer:
        kafka_producer.flush()
    logger.info("Ingestion API shutting down...")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ingestion-api"}

# ═══════════════════════════════════════════════════════════════════════════
# TUS RESUMABLE UPLOAD (Simplified Mock for initial scaffold)
# ═══════════════════════════════════════════════════════════════════════════
@app.options("/upload/tus")
async def tus_options(request: Request):
    response = Response()
    response.headers["Tus-Resumable"] = "1.0.0"
    response.headers["Tus-Version"] = "1.0.0"
    response.headers["Tus-Extension"] = "creation,termination,file-check"
    response.headers["Tus-Max-Size"] = "10737418240" # 10GB
    return response

@app.post("/upload/tus")
async def tus_create(request: Request):
    """Create a new resumable upload session"""
    upload_length = request.headers.get("Upload-Length")
    if not upload_length:
        raise HTTPException(status_code=400, detail="Upload-Length header is missing")

    job_id = str(uuid.uuid4())
    # In a real app, we save metadata to Redis here

    response = Response(status_code=201)
    response.headers["Tus-Resumable"] = "1.0.0"
    response.headers["Location"] = f"/upload/tus/{job_id}"
    return response

@app.patch("/upload/tus/{job_id}")
async def tus_patch(request: Request, job_id: str):
    """Upload a chunk"""
    upload_offset = request.headers.get("Upload-Offset")
    if upload_offset is None:
        raise HTTPException(status_code=400, detail="Upload-Offset header missing")

    # Read chunk
    body = await request.body()
    # In a real app, append body to file on disk or MinIO at offset

    new_offset = int(upload_offset) + len(body)

    # Check if complete (mock logic)
    upload_length = request.headers.get("Upload-Length", new_offset) # Fallback for mock

    if new_offset >= int(upload_length):
        # MOCK: Trigger Job Completion
        await finalize_upload(job_id, "mock_tenant", "excel", f"minio://uploads/{job_id}.xlsx", "mock_file.xlsx")

    response = Response(status_code=204)
    response.headers["Tus-Resumable"] = "1.0.0"
    response.headers["Upload-Offset"] = str(new_offset)
    return response

# ═══════════════════════════════════════════════════════════════════════════
# STANDARD DIRECT UPLOAD (Fallback)
# ═══════════════════════════════════════════════════════════════════════════
@app.post("/upload/direct")
async def upload_direct(
    tenant_id: str = Form(...),
    source_type: str = Form(..., description="excel, pdf, etc."),
    file: UploadFile = File(...)
):
    """Fallback standard upload endpoint"""
    job_id = str(uuid.uuid4())
    # Save to MinIO here
    target_uri = f"minio://uploads/{tenant_id}/{job_id}_{file.filename}"

    await finalize_upload(job_id, tenant_id, source_type, target_uri, file.filename)

    return {
        "job_id": job_id,
        "status": "accepted",
        "file": file.filename
    }

async def finalize_upload(job_id: str, tenant_id: str, source_type: str, uri: str, original_filename: str):
    if not kafka_producer:
        logger.error("Kafka producer not configured, cannot send event")
        return

    event = RawIngestionEvent(
        job_id=job_id,
        tenant_id=tenant_id,
        source_type=source_type,
        source_uri=uri,
        metadata={"original_filename": original_filename}
    )

    try:
        kafka_producer.produce(
            RAW_DATA_TOPIC,
            key=tenant_id.encode('utf-8'),
            value=event.model_dump_json().encode('utf-8'),
            callback=delivery_report
        )
        kafka_producer.poll(0)
        logger.info(f"Published RawIngestionEvent for job {job_id}")
    except Exception as e:
        logger.error(f"Failed to publish to Kafka: {e}")
