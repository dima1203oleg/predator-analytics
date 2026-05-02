"""Omniverse Dynamic Ingestion Pipeline — OMNIVERSE v70.0.

Універсальний пайплайн для обробки довільних даних з використанням LLM-схем.
"""
import asyncio
import csv
import io
import json
import hashlib
from datetime import UTC, datetime
from typing import Any, AsyncGenerator

import chardet
import pandas as pd
from app.minio_service import get_minio_service
from app.sinks.clickhouse_sink import ClickHouseSink
from app.sinks.neo4j_sink import Neo4jSink
from predator_common.logging import get_logger

logger = get_logger("ingestion_worker.omniverse_pipeline")

CHUNK_SIZE = 10_000

class OmniversePipeline:
    def __init__(
        self,
        job_id: str,
        tenant_id: str,
        file_name: str,
        s3_path: str,
        schema_definition: dict[str, Any],
    ) -> None:
        self.job_id = job_id
        self.tenant_id = tenant_id
        self.file_name = file_name
        self.s3_path = s3_path
        self.schema = schema_definition
        
        self.clickhouse_sink = ClickHouseSink()
        self.neo4j_sink = Neo4jSink()
        self.minio = get_minio_service()

    async def run(self) -> dict[str, Any]:
        logger.info(f"Starting Omniverse Ingestion: {self.job_id}", extra={"file": self.file_name})
        
        try:
            # 1. Створення інфраструктури (таблиці ClickHouse)
            await self._prepare_infrastructure()

            # 2. Завантаження файлу
            file_content = await self._download_file()
            encoding = self._detect_encoding(file_content)
            text_content = file_content.decode(encoding, errors="replace")

            # 3. Обробка чанками
            batch = []
            total_processed = 0
            
            async for record in self._parse_file(text_content):
                batch.append(record)
                if len(batch) >= CHUNK_SIZE:
                    await self._process_batch(batch)
                    total_processed += len(batch)
                    batch = []

            if batch:
                await self._process_batch(batch)
                total_processed += len(batch)

            logger.info(f"Omniverse Ingestion completed: {self.job_id}", extra={"total": total_processed})
            return {"job_id": self.job_id, "status": "completed", "total_rows": total_processed}

        except Exception as e:
            logger.error(f"Omniverse Ingestion failed: {e}", exc_info=True)
            raise

    async def _prepare_infrastructure(self):
        """Створює необхідні таблиці в ClickHouse на основі схеми."""
        table_name = self.schema.get("target_table", f"omniverse_{self.tenant_id}_{self.job_id[:8]}")
        columns = self.schema.get("clickhouse_schema", [])
        
        # Формуємо SQL для створення таблиці
        col_defs = []
        for col in columns:
            name = col["name"]
            dtype = col.get("type", "String")
            col_defs.append(f"`{name}` {dtype}")
        
        # Додаємо системні поля
        col_defs.append("`_job_id` String")
        col_defs.append("`_tenant_id` String")
        col_defs.append("`_ingested_at` DateTime")
        
        create_query = f"CREATE TABLE IF NOT EXISTS {table_name} ({', '.join(col_defs)}) ENGINE = MergeTree() ORDER BY _ingested_at"
        self.clickhouse_sink.execute_query(create_query)
        self.target_table = table_name
        self.column_names = [col["name"] for col in columns] + ["_job_id", "_tenant_id", "_ingested_at"]

    async def _download_file(self) -> bytes:
        bucket, object_name = self.minio.parse_s3_path(self.s3_path)
        return self.minio.get_file_bytes(bucket, object_name)

    def _detect_encoding(self, content: bytes) -> str:
        if content.startswith(b"\xef\xbb\xbf"): return "utf-8-sig"
        result = chardet.detect(content[:10000])
        return result.get("encoding", "utf-8")

    async def _parse_file(self, content: str) -> AsyncGenerator[dict[str, Any], None]:
        file_ext = "." + self.file_name.rsplit(".", 1)[-1].lower()
        mapping = self.schema.get("column_mapping", {})
        
        if file_ext == ".csv":
            reader = csv.DictReader(io.StringIO(content))
            for row in reader:
                normalized = {mapping.get(k, k): v for k, v in row.items()}
                yield self._enrich_record(normalized)
        elif file_ext == ".json":
            data = json.loads(content)
            for item in (data if isinstance(data, list) else [data]):
                normalized = {mapping.get(k, k): v for k, v in item.items()}
                yield self._enrich_record(normalized)

    def _enrich_record(self, record: dict[str, Any]) -> dict[str, Any]:
        record["_job_id"] = self.job_id
        record["_tenant_id"] = self.tenant_id
        record["_ingested_at"] = datetime.now(UTC).replace(tzinfo=None)
        return record

    async def _process_batch(self, batch: list[dict[str, Any]]):
        # 1. ClickHouse
        await self.clickhouse_sink.insert_dynamic(self.target_table, batch, self.column_names)
        
        # 2. Neo4j (Dynamic Graph Ingestion)
        neo4j_ontology = self.schema.get("neo4j_ontology", {})
        if neo4j_ontology:
            await self._process_neo4j_batch(batch, neo4j_ontology)

    async def _process_neo4j_batch(self, batch: list[dict[str, Any]], ontology: dict[str, Any]):
        """Створює вузли та зв'язки в Neo4j на основі динамічної онтології."""
        nodes_spec = ontology.get("nodes", [])
        edges_spec = ontology.get("relationships", [])
        
        for record in batch:
            # Створення вузлів
            for node in nodes_spec:
                label = node["label"]
                key_field = node["key_field"]
                props = node.get("properties", [])
                
                if record.get(key_field):
                    prop_map = {p: record.get(p) for p in props if record.get(p) is not None}
                    prop_map[key_field] = record[key_field]
                    
                    query = f"MERGE (n:{label} {{{key_field}: $key}}) SET n += $props, n.tenant_id = $tenant"
                    await self.neo4j_sink.run_query(query, {"key": record[key_field], "props": prop_map, "tenant": self.tenant_id})
            
            # Створення зв'язків
            for rel in edges_spec:
                src_label = rel["source_node_label"]
                src_key = rel["source_key_field"]
                tgt_label = rel["target_node_label"]
                tgt_key = rel["target_key_field"]
                rel_type = rel["relationship_type"]
                
                if record.get(src_key) and record.get(tgt_key):
                    query = f"""
                    MATCH (s:{src_label} {{{src_key}: $src_val}})
                    MATCH (t:{tgt_label} {{{tgt_key}: $tgt_val}})
                    MERGE (s)-[r:{rel_type}]->(t)
                    SET r.job_id = $job_id, r.updated_at = datetime()
                    """
                    await self.neo4j_sink.run_query(query, {
                        "src_val": record[src_key],
                        "tgt_val": record[tgt_key],
                        "job_id": self.job_id
                    })
