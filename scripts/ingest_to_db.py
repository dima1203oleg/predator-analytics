from __future__ import annotations

import asyncio
from datetime import datetime
import json
import os
import sys
import uuid


# Ensure we can import app modules
sys.path.append('/app')

from libs.core.database import get_db_ctx
from libs.core.models.entities import AugmentedDataset


DATA_FILE = "/app/data/training_data.jsonl"
GENESIS_TENANT_ID = uuid.UUID("00000000-0000-0000-0000-000000000000")

async def ingest():
    print(f"📥 Starting ingestion from {DATA_FILE} to PostgreSQL...")

    if not os.path.exists(DATA_FILE):
        print("❌ File not found.")
        return

    count = 0

    async with get_db_ctx() as sess:
        with open(DATA_FILE, encoding='utf-8') as f:
            for line in f:
                try:
                    record = json.loads(line)
                    # Convert complex JSON structure to string for 'content' field
                    # The model expects text content usually, or structured json
                    content_str = json.dumps(record, ensure_ascii=False)

                    obj = AugmentedDataset(
                        id=uuid.uuid4(),
                        tenant_id=GENESIS_TENANT_ID,
                        content=content_str, # Storing the full training sample
                        aug_type="radical_seed_synthetic",
                        created_at=datetime.now()
                    )
                    sess.add(obj)
                    count += 1

                    if count % 100 == 0:
                        sys.stdout.write(".")
                        sys.stdout.flush()
                except Exception as e:
                    print(f"⚠️ Error parsing line: {e}")

        await sess.commit()

    print(f"\n✅ Successfully ingested {count} training samples into 'augmented_datasets' table.")
    print("🚀 The Self-Improvement Service should now detect the threshold > 100 and trigger training.")

if __name__ == "__main__":
    asyncio.run(ingest())
