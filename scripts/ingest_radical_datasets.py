from __future__ import annotations

import json
import logging
import os
import re

from sqlalchemy import text

from libs.core.database import get_db_sync
from libs.core.mlops import DatasetVersionManager


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ingest_radical_datasets")

def parse_md_scenarios(file_path: str):
    with open(file_path, encoding='utf-8') as f:
        content = f.read()

    # Split by separator --- or headers
    blocks = re.split(r'### \d+\.', content)
    scenarios = []

    for block in blocks[1:]: # Skip first block (intro)
        lines = block.strip().split('\n')
        name = lines[0].strip(' "')

        # Simple extraction logic
        description = ""
        essence = ""
        fields = []
        for line in lines:
            if line.startswith("**Опис:**"):
                description = line.replace("**Опис:**", "").strip()
            elif line.startswith("**Суть:**"):
                essence = line.replace("**Суть:**", "").strip()
            elif line.startswith("* "):
                fields.append(line.replace("* ", "").strip())

        scenarios.append({
            "name": name,
            "description": description,
            "essence": essence,
            "fields": fields
        })
    return scenarios

def ingest():
    file_path = "/app/data/seeds/radical_scenarios_expanded.md"
    if not os.path.exists(file_path):
        file_path = "/Users/dima-mac/Documents/Predator_21/data/seeds/radical_scenarios_expanded.md"

    logger.info(f"📂 Parsing {file_path}...")
    scenarios = parse_md_scenarios(file_path)
    print(f"DEBUG: Found {len(scenarios)} scenarios locally.")
    logger.info(f"✅ Found {len(scenarios)} radical scenarios.")

    # Register in MLOps
    dvm = DatasetVersionManager()
    dvm.register_version(
        name="Radical_Analytical_Scenarios_UA",
        version="1.0.0",
        source="Handcrafted_Radical_Core",
        row_count=len(scenarios),
        metadata={"tags": ["custom", "radical", "ukraine", "customs"]}
    )

    try:
        with get_db_sync() as session:
            print("DEBUG: Database connection established.")
            session.execute(text("CREATE SCHEMA IF NOT EXISTS knowledge_base;"))
            session.execute(text("""
                CREATE TABLE IF NOT EXISTS knowledge_base.analytic_scenarios (
                    id SERIAL PRIMARY KEY,
                    name TEXT,
                    description TEXT,
                    essence TEXT,
                    fields JSONB,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            """))

            for i, s in enumerate(scenarios):
                if i % 10 == 0:
                    print(f"DEBUG: Ingesting scenario {i}/{len(scenarios)}: {s['name']}")
                session.execute(
                    text("INSERT INTO knowledge_base.analytic_scenarios (name, description, essence, fields) VALUES (:name, :description, :essence, :fields)"),
                    {"name": s['name'], "description": s['description'], "essence": s['essence'], "fields": json.dumps(s['fields'])}
                )
        print("DEBUG: Ingestion loop finished.")
        logger.info("🛡️ Knowledge Base updated with radical scenarios.")
    except Exception as e:
        logger.exception(f"❌ Failed to update knowledge base: {e}")

if __name__ == "__main__":
    ingest()
