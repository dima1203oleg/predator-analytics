import os

import boto3
from botocore.client import Config


class MinioClient:
    def __init__(self):
        self.endpoint = os.getenv("MINIO_ENDPOINT", "http://localhost:9000")
        self.access_key = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
        self.secret_key = os.getenv("MINIO_SECRET_KEY", "minioadmin")

        self.s3 = boto3.client(
            's3',
            endpoint_url=self.endpoint,
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            config=Config(signature_version='s3v4')
        )

    def get_file_stream(self, bucket: str, object_name: str):
        response = self.s3.get_object(Bucket=bucket, Key=object_name)
        return response['Body']

def get_minio_client():
    return MinioClient()
