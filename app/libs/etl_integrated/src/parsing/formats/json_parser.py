from __future__ import annotations

"""
JSON Parser Implementation

Handles parsing of JSON files using pandas and standard json library.
"""

import json
from pathlib import Path

try:
    import pandas as pd
except ImportError:
    pd = None

from parsing.data_parser import ParseResult


class JSONParser:
    """JSON file parser using pandas and standard json library.

    This parser handles various JSON formats including arrays of objects,
    single objects, and nested structures.
    """

    def __init__(self):
        self.default_options = {
            "encoding": "utf-8",
            "orient": "records",  # Default for pandas
        }

    def parse(self, file_path: str | Path, **kwargs) -> ParseResult:
        """Parse a JSON file.

        Args:
            file_path: Path to the JSON file
            **kwargs: Additional options to override defaults

        Returns:
            ParseResult containing parsed data or error

        """
        file_path = Path(file_path)

        if not file_path.exists():
            return ParseResult(False, error=f"JSON file not found: {file_path}")

        if file_path.suffix.lower() != ".json":
            return ParseResult(False, error=f"File is not a JSON: {file_path}")

        # Merge default options with user-provided options
        options = self.default_options.copy()
        options.update(kwargs)

        try:
            # First try pandas read_json for structured data
            try:
                df = pd.read_json(file_path, **options)
                data = df
            except (ValueError, json.JSONDecodeError):
                # Fall back to standard json library for non-tabular JSON
                with open(file_path, encoding=options.get("encoding", "utf-8")) as f:
                    data = json.load(f)

            # Add metadata
            result = ParseResult(True, data=data)
            result.metadata = {
                "format": "json",
                "file_size": file_path.stat().st_size,
            }

            if isinstance(data, pd.DataFrame):
                result.metadata["rows"] = len(data)
                result.metadata["columns"] = list(data.columns)
            elif isinstance(data, list):
                result.metadata["items"] = len(data)
            elif isinstance(data, dict):
                result.metadata["keys"] = list(data.keys())

            return result

        except json.JSONDecodeError as e:
            return ParseResult(False, error=f"Invalid JSON format: {e!s}")
        except Exception as e:
            return ParseResult(False, error=f"Failed to parse JSON: {e!s}")

    def parse_to_dict(self, file_path: str | Path) -> ParseResult:
        """Parse JSON file and return as Python dictionary/list.

        Args:
            file_path: Path to the JSON file

        Returns:
            ParseResult containing parsed dictionary/list or error

        """
        result = self.parse(file_path)

        if not result.success:
            return result

        # If we got a DataFrame, convert to dict
        if isinstance(result.data, pd.DataFrame):
            try:
                result.data = result.data.to_dict(orient="records")
                return result
            except Exception as e:
                return ParseResult(False, error=f"Failed to convert DataFrame to dict: {e!s}")

        return result

    def parse_to_dataframe(self, file_path: str | Path, orient: str = "records") -> ParseResult:
        """Parse JSON file and return as pandas DataFrame.

        Args:
            file_path: Path to the JSON file
            orient: JSON string format orientation

        Returns:
            ParseResult containing parsed DataFrame or error

        """
        try:
            df = pd.read_json(file_path, orient=orient)
            result = ParseResult(True, data=df)
            result.metadata = {
                "format": "json",
                "rows": len(df),
                "columns": list(df.columns),
                "file_size": Path(file_path).stat().st_size,
            }
            return result
        except Exception as e:
            return ParseResult(False, error=f"Failed to parse JSON to DataFrame: {e!s}")
