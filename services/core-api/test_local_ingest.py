import asyncio
import os
import hashlib
from datetime import datetime
from uuid import uuid4

import dotenv
dotenv.load_dotenv()

from app.services.minio_service import get_minio_service
from app.services.kafka_service import get_kafka_service

async def local_ingest():
    file_path = "/Users/dima1203/Desktop/Березень_2024_repacked.xlsx"
    file_name = "Березень_2024.xlsx"
    file_size = os.path.getsize(file_path)
    
    print(f"Uploading {file_name} ({file_size} bytes)...")
    
    with open(file_path, "rb") as f:
        data = f.read()
    
    # MinIO
    s3_path = f"ingestion/2024/03/01/{uuid4()}_{file_name}"
    
    minio = get_minio_service()
    try:
        minio._client.list_buckets()
        print("Connected to MinIO successfully!")
    except Exception as e:
        print("ERROR CONNECTING TO MINIO:", e)
        return
