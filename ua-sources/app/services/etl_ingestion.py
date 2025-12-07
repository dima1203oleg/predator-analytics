import pandas as pd
import logging
from typing import Dict, Any, Optional
from pathlib import Path
import asyncpg
import os

logger = logging.getLogger("service.etl_ingestion")

class ETLIngestionService:
    """
    Handles ETL pipeline for uploaded files:
    1. Read file (CSV/Excel)
    2. Validate schema
    3. Transform/Clean
    4. Load to PostgreSQL staging
    """
    
    def __init__(self):
        self.db_url = os.getenv("DATABASE_URL", "postgresql://predator:predator_password@localhost:5432/predator_db")
        self.supported_formats = [".csv", ".xlsx", ".xls"]

    async def process_file(self, file_path: str, dataset_type: str = "customs") -> Dict[str, Any]:
        """
        Main ETL entry point.
        Returns: {status, record_count, table_name, errors}
        """
        logger.info(f"Starting ETL for {file_path} [Type: {dataset_type}]")
        
        # Step 1: Read (Async/Non-blocking)
        try:
            df = await self._read_file(file_path)
        except Exception as e:
            logger.error(f"Failed to read file: {e}")
            return {"status": "failed", "error": str(e)}

        if dataset_type == "customs":
            column_map = {
                "Дата оформлення": "date",
                "Код товару": "hs_code",
                "Фактурна варість, валюта контракту": "amount",
                "Країна походження": "country",
                "Номер митної декларації": "decl_number",
                "ЄДРПОУ одержувача": "edrpou",
                "Одержувач": "recipient_name",
                "Опис товару": "description"
            }
            df = df.rename(columns=column_map)
        
        # Sanitize all column names (replace spaces, etc)
        import re
        new_columns = []
        seen = set()
        for c in df.columns:
            # Replace non-alphanumeric with _
            clean = re.sub(r'[^a-zA-Z0-9_]', '_', str(c)).lower().strip('_')
            # Handle empty (was only symbols)
            if not clean:
                clean = "col_unknown"
            # Handle starting with digit
            if clean[0].isdigit():
                clean = f"col_{clean}"
            # Handle duplicates
            original_clean = clean
            counter = 1
            while clean in seen:
                clean = f"{original_clean}_{counter}"
                counter += 1
            seen.add(clean)
            new_columns.append(clean)
        
        df.columns = new_columns
        logger.info(f"Sanitized columns: {new_columns}")

        # Step 2: Validate
        validation_result = await self._validate_schema(df, dataset_type)
        if not validation_result["valid"]:
            return {"status": "failed", "error": validation_result["errors"]}

        # Step 3: Transform
        df_clean = await self._transform(df, dataset_type)

        # Step 4: Load to PostgreSQL
        table_name = f"staging_{dataset_type}"
        try:
            record_count = await self._load_to_postgres(df_clean, table_name)
            logger.info(f"Loaded {record_count} records to {table_name}")
            
            # Convert to list of dicts for return (helper for indexing)
            # Use columns expected by indexing
            documents = df_clean.to_dict('records')
            
            # Add basic ID if missing (for indexing)
            for i, doc in enumerate(documents):
                if "id" not in doc:
                    doc["id"] = f"{dataset_type}_{i}_{pd.Timestamp.now().timestamp()}"
            
            return {
                "status": "success",
                "record_count": record_count,
                "table_name": table_name,
                "documents": documents
            }
        except Exception as e:
            logger.error(f"Failed to load to database: {e}")
            # Propagate the real error description
            raise e

    async def _read_file(self, file_path: str) -> pd.DataFrame:
        """Read CSV or Excel file into DataFrame (non-blocking)."""
        import asyncio
        loop = asyncio.get_running_loop()
        
        ext = Path(file_path).suffix.lower()
        if ext == ".csv":
            return await loop.run_in_executor(None, pd.read_csv, file_path)
        elif ext in [".xlsx", ".xls"]:
            # Use openpyxl explicitly for xlsx
            return await loop.run_in_executor(None, lambda: pd.read_excel(file_path, engine='openpyxl'))
        else:
            raise ValueError(f"Unsupported file format: {ext}")

    async def _validate_schema(self, df: pd.DataFrame, dataset_type: str) -> Dict[str, Any]:
        """
        Validate that DataFrame has required columns.
        Schema validation rules per dataset type.
        """
        required_columns = {
            "customs": ["date", "hs_code", "amount", "country"],
            "tax": ["invoice_date", "edrpou", "amount"],
            "generic": []
        }
        
        required = required_columns.get(dataset_type, [])
        missing = [col for col in required if col not in df.columns]
        
        if missing:
            return {"valid": False, "errors": f"Missing columns: {missing}"}
        
        return {"valid": True}

    async def _transform(self, df: pd.DataFrame, dataset_type: str) -> pd.DataFrame:
        """
        Clean and transform data.
        - Remove duplicates
        - Handle nulls
        - Normalize types
        """
        # Remove duplicates
        df = df.drop_duplicates()
        
        # Fill nulls (basic strategy)
        df = df.fillna("")
        
        # Ensure date format for customs
        if dataset_type == "customs" and "date" in df.columns:
            df["date"] = pd.to_datetime(df["date"], errors='coerce')

        # Add metadata
        df["ingested_at"] = pd.Timestamp.now()
        df["source_type"] = dataset_type
        
        return df

    async def _load_to_postgres(self, df: pd.DataFrame, table_name: str) -> int:
        """
        Load DataFrame to PostgreSQL using asyncpg.
        Creates table if not exists.
        """
        conn = await asyncpg.connect(self.db_url)
        
        try:
            # Create table (simplified - in production use Alembic migrations)
            columns = ", ".join([f"{col} TEXT" for col in df.columns])
            create_table_sql = f"""
                CREATE TABLE IF NOT EXISTS {table_name} (
                    id SERIAL PRIMARY KEY,
                    {columns},
                    created_at TIMESTAMP DEFAULT NOW()
                )
            """
            await conn.execute(create_table_sql)
            
            # Insert records
            records = df.to_dict('records')
            if records:
                columns_list = list(records[0].keys())
                placeholders = ", ".join([f"${i+1}" for i in range(len(columns_list))])
                insert_sql = f"""
                    INSERT INTO {table_name} ({", ".join(columns_list)})
                    VALUES ({placeholders})
                """
                
                for record in records:
                    values = [str(record[col]) for col in columns_list]
                    await conn.execute(insert_sql, *values)
            
            return len(records)
        finally:
            await conn.close()
