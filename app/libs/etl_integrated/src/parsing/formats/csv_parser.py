from __future__ import annotations

from typing import Any, Optional, Union


"""
CSV Parser Implementation

Handles parsing of CSV files using pandas.
"""

from pathlib import Path
from typing import Dict


try:
    import pandas as pd
except ImportError:
    pd = None

from parsing.data_parser import ParseResult


class CSVParser:
    """CSV file parser using pandas.

    This parser handles various CSV formats and provides options for
    customizing the parsing process.
    """

    def __init__(self):
        self.default_options = {
            "sep": ",",
            "header": "infer",
            "encoding": "utf-8",
            "quotechar": '"',
            "skipinitialspace": True,
        }

    def parse(self, file_path: str |  Path, **kwargs) -> ParseResult:
        """Parse a CSV file.

        Args:
            file_path: Path to the CSV file
            **kwargs: Additional options to override defaults

        Returns:
            ParseResult containing parsed DataFrame or error
        """
        file_path = Path(file_path)

        if not file_path.exists():
            return ParseResult(False, error=f"CSV file not found: {file_path}")

        if file_path.suffix.lower() != ".csv":
            return ParseResult(False, error=f"File is not a CSV: {file_path}")

        # Merge default options with user-provided options
        options = self.default_options.copy()
        options.update(kwargs)

        try:
            # Read CSV file
            df = pd.read_csv(file_path, **options)

            # Add metadata
            result = ParseResult(True, data=df)
            result.metadata = {
                "format": "csv",
                "rows": len(df),
                "columns": list(df.columns),
                "file_size": file_path.stat().st_size,
            }

            return result

        except pd.errors.EmptyDataError:
            return ParseResult(False, error="CSV file is empty")
        except pd.errors.ParserError as e:
            return ParseResult(False, error=f"CSV parsing error: {e!s}")
        except Exception as e:
            return ParseResult(False, error=f"Failed to parse CSV: {e!s}")

    def parse_with_options(self, file_path: str |  Path,
                          sep: str = ",",
                          header: int |  str | None = "infer",
                          encoding: str = "utf-8") -> ParseResult:
        """Parse CSV with explicit options.

        Args:
            file_path: Path to the CSV file
            sep: Field delimiter
            header: Row number to use as column names
            encoding: File encoding

        Returns:
            ParseResult containing parsed DataFrame or error
        """
        return self.parse(file_path, sep=sep, header=header, encoding=encoding)
