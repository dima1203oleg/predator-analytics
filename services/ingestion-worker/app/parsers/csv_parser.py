"""CSV Parser — PREDATOR Analytics v61.0-ELITE Ironclad.

Efficient CSV parsing for large datasets using streaming.
"""
from collections.abc import Generator
import csv
import io
from typing import Any


class CSVParser:
    @staticmethod
    def parse_stream(stream: io.StringIO) -> Generator[dict[str, Any], None, None]:
        """Парсинг CSV стріму в словники."""
        reader = csv.DictReader(stream)
        yield from reader

    @staticmethod
    def parse_string(content: str) -> list[dict[str, Any]]:
        """Парсинг рядка CSV."""
        f = io.StringIO(content)
        return list(CSVParser.parse_stream(f))
