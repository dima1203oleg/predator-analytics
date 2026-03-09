"""
CSV Parser — PREDATOR Analytics v55.1 Ironclad.

Efficient CSV parsing for large datasets using streaming.
"""
import csv
import io
from typing import List, Dict, Any, Generator

class CSVParser:
    @staticmethod
    def parse_stream(stream: io.StringIO) -> Generator[Dict[str, Any], None, None]:
        """Парсинг CSV стріму в словники."""
        reader = csv.DictReader(stream)
        for row in reader:
            yield row

    @staticmethod
    def parse_string(content: str) -> List[Dict[str, Any]]:
        """Парсинг рядка CSV."""
        f = io.StringIO(content)
        return list(CSVParser.parse_stream(f))
