import os
import io
from dotenv import load_dotenv
from minio import Minio
from datetime import datetime

load_dotenv()

class RegistryManager:
    def __init__(self):
        self.minio = Minio(
            os.getenv("MINIO_ENDPOINT", "localhost:9000"),
            access_key=os.getenv("MINIO_ACCESS_KEY", "minioadmin"),
            secret_key=os.getenv("MINIO_SECRET_KEY", "minioadmin"),
            secure=False
        )
        self.ensure_bucket("raw-data")
        self.ensure_bucket("clean-data")
        
        # We will lazy-load the sources when requested to avoid circular imports
        self.sources = {}
    
    def ensure_bucket(self, bucket: str):
        if not self.minio.bucket_exists(bucket):
            self.minio.make_bucket(bucket)
    
    def save_raw(self, dataset: str, data: bytes, filename: str):
        data_stream = io.BytesIO(data)
        self.minio.put_object("raw-data", f"{dataset}/{filename}", data_stream, len(data))
        print(f"✅ Raw saved: {dataset}/{filename}")
