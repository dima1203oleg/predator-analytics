from minio import Minio
import os

# Config from your stack
MINIO_URL = "localhost:9000"
ACCESS_KEY = "predator_admin"
SECRET_KEY = "predator_secret_key"
BUCKET_NAME = "raw-imports"
FILE_PATH = "/Users/dima-mac/Downloads/Березень_2024.xlsx"

def upload_file():
    print(f"🌊 Connecting to MinIO Data Lake at {MINIO_URL}...")
    client = Minio(
        MINIO_URL,
        access_key=ACCESS_KEY,
        secret_key=SECRET_KEY,
        secure=False
    )
    
    # 1. Ensure bucket exists
    if not client.bucket_exists(BUCKET_NAME):
        print(f"📦 Creating bucket '{BUCKET_NAME}'...")
        client.make_bucket(BUCKET_NAME)
    else:
        print(f"📦 Bucket '{BUCKET_NAME}' exists.")
        
    # 2. Upload
    file_name = os.path.basename(FILE_PATH)
    file_size = os.path.getsize(FILE_PATH)
    
    print(f"🚀 Uploading {file_name} ({file_size / 1024 / 1024:.2f} MB)...")
    
    with open(FILE_PATH, 'rb') as file_data:
        client.put_object(
            BUCKET_NAME,
            file_name,
            file_data,
            file_size,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        
    print(f"✅ Upload Complete: s3://{BUCKET_NAME}/{file_name}")

if __name__ == "__main__":
    try:
        upload_file()
    except Exception as e:
        print(f"❌ MinIO Error: {e}")
