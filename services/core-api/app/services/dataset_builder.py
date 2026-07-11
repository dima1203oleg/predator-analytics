import os
import json
import hashlib
import logging
from typing import List, Dict, Any, Optional
import pandas as pd
from datetime import datetime

logger = logging.getLogger(__name__)

class DatasetBuilderService:
    def __init__(self):
        self.similarity_threshold = 0.97
        self.seen_hashes = set()

    def process_raw_data(self, sources: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        """
        ETL and Cleaning pipeline.
        Parses different sources and converts them to standard JSON format.
        """
        processed_data = []
        self.seen_hashes.clear()
        for source in sources:
            try:
                # Mocking parsing for various formats
                if source.get('type') == 'csv':
                    data = self._process_csv(source['path'])
                elif source.get('type') == 'json':
                    data = self._process_json(source['path'])
                elif source.get('type') == 'excel':
                    data = self._process_excel(source['path'])
                else:
                    logger.warning(f"Unsupported source type: {source.get('type')}")
                    continue

                for record in data:
                    cleaned_record = self.clean_record(record)
                    if cleaned_record and not self.is_duplicate(cleaned_record):
                        processed_data.append(cleaned_record)
                        
            except Exception as e:
                logger.error(f"Error processing source {source}: {e}")

        return processed_data

    def _process_csv(self, path: str) -> List[Dict[str, str]]:
        try:
            df = pd.read_csv(path)
            df = df.dropna()
            return df.to_dict(orient="records")
        except Exception as e:
            logger.error(f"Failed to read CSV {path}: {e}")
            return []

    def _process_json(self, path: str) -> List[Dict[str, str]]:
        try:
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return data if isinstance(data, list) else [data]
        except Exception as e:
            logger.error(f"Failed to read JSON {path}: {e}")
            return []

    def _process_excel(self, path: str) -> List[Dict[str, str]]:
        try:
            df = pd.read_excel(path)
            df = df.dropna()
            return df.to_dict(orient="records")
        except Exception as e:
            logger.error(f"Failed to read Excel {path}: {e}")
            return []

    def clean_record(self, record: Dict[str, Any]) -> Optional[Dict[str, str]]:
        """
        Data Cleaning: remove empties, normalize spaces, handle utf-8.
        """
        instruction = str(record.get("instruction", "")).strip()
        input_text = str(record.get("input", "")).strip()
        output_text = str(record.get("output", "")).strip()

        if not instruction or not output_text:
            return None

        # Clean spaces and newlines
        instruction = " ".join(instruction.split())
        input_text = " ".join(input_text.split())
        output_text = " ".join(output_text.split())

        return {
            "instruction": instruction,
            "input": input_text,
            "output": output_text
        }

    def is_duplicate(self, record: Dict[str, str]) -> bool:
        """
        Deduplication using SHA-256 hash. 
        For advanced use, this should be MinHash or Embedding similarity > 0.97
        """
        content = f"{record['instruction']}|{record['input']}|{record['output']}"
        record_hash = hashlib.sha256(content.encode('utf-8')).hexdigest()

        if record_hash in self.seen_hashes:
            return True
        
        self.seen_hashes.add(record_hash)
        return False

    def generate_splits(self, data: List[Dict[str, str]], train_ratio=0.8, val_ratio=0.1) -> Dict[str, List[Dict[str, str]]]:
        """
        Splits data into train/val/test with fixed seed.
        """
        import random
        random.seed(42)
        random.shuffle(data)

        total = len(data)
        train_end = int(total * train_ratio)
        val_end = train_end + int(total * val_ratio)

        return {
            "train": data[:train_end],
            "validation": data[train_end:val_end],
            "test": data[val_end:]
        }

    def calculate_quality_metrics(self, data: List[Dict[str, str]]) -> Dict[str, Any]:
        """
        Calculate quality metrics: size, average length, etc.
        """
        if not data:
            return {"count": 0}

        total_length = sum(len(r['instruction']) + len(r['input']) + len(r['output']) for r in data)
        return {
            "count": len(data),
            "avg_chars_per_record": total_length / len(data),
            "estimated_tokens": int(total_length / 4)
        }

dataset_builder_service = DatasetBuilderService()
