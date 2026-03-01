import asyncio
import logging
import os
from typing import Any

import pandas as pd


logger = logging.getLogger("app.services.etl_service")


class ETLService:
    async def process_file(self, file_path: str, dataset_type: str = "custom") -> dict[str, Any]:
        """Real ETL processing using pandas for CSV and Excel files."""
        logger.info(f"🚀 ETL: Processing {file_path} for type {dataset_type}")

        try:
            # 1. Read the file
            ext = os.path.splitext(file_path)[1].lower()

            # Use asyncio to run blocking pandas calls in a thread pool
            def read_file():
                if ext == ".csv":
                    # Try different encodings
                    for encoding in ["utf-8", "cp1251", "latin1"]:
                        try:
                            return pd.read_csv(file_path, encoding=encoding)
                        except:
                            continue
                    raise ValueError("Could not read CSV with supported encodings")
                if ext in [".xlsx", ".xls"]:
                    return pd.read_excel(file_path)
                raise ValueError(f"Unsupported file format: {ext}")

            df = await asyncio.to_thread(read_file)

            # 2. Map columns based on dataset type
            documents = []

            if dataset_type == "customs":
                # Specific mapping for customs data
                for _, row in df.head(500).iterrows():  # Limit for now
                    doc = {
                        "decl_number": str(row.get("decl_number", row.get("номер_декларації", ""))),
                        "description": str(row.get("description", row.get("опис_товару", ""))),
                        "hs_code": str(row.get("hs_code", row.get("код_тнзед", ""))),
                        "country_trading": str(row.get("country_trading", row.get("країна_торгівлі", ""))),
                        "customs_office": str(row.get("customs_office", row.get("митний_орган", ""))),
                        "raw_data": row.to_dict(),
                    }
                    if doc["description"] and doc["description"] != "nan":
                        documents.append(doc)
            else:
                # Generic mapping
                for _, row in df.head(500).iterrows():
                    doc = {"description": str(row.values[0]) if len(row) > 0 else "Empty row", "meta": row.to_dict()}
                    documents.append(doc)

            logger.info(f"✅ ETL: Successfully extracted {len(documents)} documents")
            return {"success": True, "documents": documents, "rows_processed": len(df), "dataset_type": dataset_type}

        except Exception as e:
            logger.exception(f"❌ ETL Failed: {e}")
            return {"success": False, "error": str(e)}


etl_service = ETLService()
