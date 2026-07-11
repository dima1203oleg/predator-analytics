import asyncio
import httpx
import logging
import json
from pathlib import Path
from app.core.security import create_access_token

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

API_URL = "http://localhost:8000/api/v1"

TENANT_ID = "a0000000-0000-0000-0000-000000000001"
USER_ID = "b0000000-0000-0000-0000-000000000001"

def get_token():
    return create_access_token(
        data={"sub": USER_ID, "tenant_id": TENANT_ID, "role": "vip"}
    )

async def test_etl():
    logger.info("Starting ETL pipeline test...")
    token = get_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "X-Tenant-ID": TENANT_ID
    }
    
    # 1. Create a synthetic document with required fields
    test_file_path = Path("/tmp/test_customs_doc.csv")
    csv_content = (
        "invoice_number,company_name,company_edrpou,cargo_description,customs_value,uktzed_code,origin_country\n"
        "INV-2026-001,Test Importer LLC,12345678,\"Electronics, 500 units\",50000,8517120000,Germany\n"
        "INV-2026-002,Global Trade Inc,87654321,\"Machinery, 10 units\",120000,8471300000,China"
    )
    test_file_path.write_text(csv_content)
    
    # 2. Upload file to ingestion endpoint
    logger.info("Uploading document...")
    async with httpx.AsyncClient(timeout=60.0) as client:
        with open(test_file_path, "rb") as f:
            files = {"file": ("test_customs_doc.csv", f, "text/csv")}
            data = {"dataset_name": "test_dataset", "description": "Synthetic ETL test document"}
            resp = await client.post(f"{API_URL}/ingestion/upload", headers=headers, files=files, data=data)
            
        if resp.status_code not in (200, 202):
            logger.error(f"Upload failed: {resp.status_code} - {resp.text}")
            return
            
        resp_data = resp.json()
        logger.info(f"Upload response: {json.dumps(resp_data, indent=2)}")
        
        job_id = resp_data.get("job_id")
        if not job_id:
            logger.error("No job_id returned.")
            return
            
        # 3. Poll for status
        logger.info(f"Polling status for job {job_id}...")
        for _ in range(15):
            await asyncio.sleep(2)
            status_resp = await client.get(f"{API_URL}/ingestion/progress/{job_id}", headers=headers)
            if status_resp.status_code == 200:
                s_data = status_resp.json()
                logger.info(f"Status: {s_data.get('status')} - Progress: {s_data.get('progress_percent', 0)}%")
                if s_data.get("status") in ("completed", "failed"):
                    break
            else:
                logger.warning(f"Status check failed: {status_resp.status_code}")

if __name__ == "__main__":
    asyncio.run(test_etl())
