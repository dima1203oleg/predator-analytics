from __future__ import annotations


"""
XML Parser Implementation

Handles parsing of XML files using xml.etree.ElementTree.
"""

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Union
from xml.etree import ElementTree as ET

import pandas as pd

from ..data_parser import ParseResult


class XMLParser:
    """XML file parser using xml.etree.ElementTree.

    This parser handles various XML formats and can convert XML data
    to dictionaries or pandas DataFrames.
    """

    def __init__(self):
        self.default_options = {
            "encoding": "utf-8",
        }

    def parse(self, file_path: str |  Path, **kwargs) -> ParseResult:
        """Parse an XML file.

        Args:
            file_path: Path to the XML file
            **kwargs: Additional options to override defaults

        Returns:
            ParseResult containing parsed data or error
        """
        file_path = Path(file_path)

        if not file_path.exists():
            return ParseResult(False, error=f"XML file not found: {file_path}")

        if file_path.suffix.lower() != ".xml":
            return ParseResult(False, error=f"File is not an XML: {file_path}")

        # Merge default options with user-provided options
        options = self.default_options.copy()
        options.update(kwargs)

        try:
            # Parse XML file
            tree = ET.parse(file_path)
            root = tree.getroot()

            # Convert XML to dictionary
            xml_dict = self._xml_to_dict(root)

            # Add metadata
            result = ParseResult(True, data=xml_dict)
            result.metadata = {
                "format": "xml",
                "root_tag": root.tag,
                "file_size": file_path.stat().st_size,
            }

            return result

        except ET.ParseError as e:
            return ParseResult(False, error=f"XML parsing error: {e!s}")
        except Exception as e:
            return ParseResult(False, error=f"Failed to parse XML: {e!s}")

    def _xml_to_dict(self, element: ET.Element) -> dict[str, Any]:
        """Convert XML element to dictionary recursively.

        Args:
            element: XML element to convert

        Returns:
            Dictionary representation of the XML element
        """
        result = {}

        # Add attributes
        if element.attrib:
            result["@attributes"] = element.attrib

        # Process child elements
        for child in element:
            child_data = self._xml_to_dict(child)

            # Handle multiple elements with same tag
            if child.tag in result:
                # If it's already a list, append to it
                if isinstance(result[child.tag], list):
                    result[child.tag].append(child_data)
                else:
                    # Convert to list
                    result[child.tag] = [result[child.tag], child_data]
            else:
                result[child.tag] = child_data

        # Add text content if present
        if element.text and element.text.strip():
            if result:  # If there are attributes or children
                result["#text"] = element.text.strip()
            else:  # Simple text element
                return element.text.strip()

        return result

    def parse_to_dataframe(self, file_path: str |  Path) -> ParseResult:
        """Parse XML file and return as pandas DataFrame.

        Args:
            file_path: Path to the XML file

        Returns:
            ParseResult containing parsed DataFrame or error
        """
        result = self.parse(file_path)

        if not result.success:
            return result

        try:
            # Convert XML dict to DataFrame
            df = self._xml_dict_to_dataframe(result.data)
            result.data = df
            result.metadata["rows"] = len(df)
            result.metadata["columns"] = list(df.columns)
            return result

        except Exception as e:
            return ParseResult(False, error=f"Failed to convert XML to DataFrame: {e!s}")

    def _xml_dict_to_dataframe(self, xml_dict: dict[str, Any]) -> pd.DataFrame:
        """Convert XML dictionary to pandas DataFrame.

        Args:
            xml_dict: Dictionary representation of XML

        Returns:
            pandas DataFrame
        """
        # Flatten the XML dictionary for DataFrame conversion
        flat_data = []

        def _flatten_dict(d: dict[str, Any], parent_key: str = "") -> dict[str, Any]:
            """Recursively flatten nested dictionary."""
            items = []

            for key, value in d.items():
                new_key = f"{parent_key}.{key}" if parent_key else key

                if isinstance(value, dict):
                    if key == "@attributes":
                        # Handle attributes
                        for attr_key, attr_value in value.items():
                            items.append((f"{new_key}.{attr_key}", attr_value))
                    else:
                        # Recursively flatten nested dict
                        items.extend(_flatten_dict(value, new_key).items())
                elif isinstance(value, list):
                    # Handle lists by taking first element as representative
                    if value and isinstance(value[0], dict):
                        items.extend(_flatten_dict(value[0], new_key).items())
                    else:
                        items.append((new_key, str(value)))
                else:
                    items.append((new_key, value))

            return dict(items)

        # If the XML has multiple records, process each one
        if isinstance(xml_dict, dict):
            # Check if it's a list of records
            for key, value in xml_dict.items():
                if isinstance(value, list):
                    for item in value:
                        if isinstance(item, dict):
                            flat_data.append(_flatten_dict(item))
                    break
            else:
                # Single record
                flat_data.append(_flatten_dict(xml_dict))

        if flat_data:
            return pd.DataFrame(flat_data)
        # Fallback: create DataFrame with XML content as string
        return pd.DataFrame([{"xml_content": str(xml_dict)}])

    def parse_to_dict(self, file_path: str |  Path) -> ParseResult:
        """Parse XML file and return as dictionary.

        Args:
            file_path: Path to the XML file

        Returns:
            ParseResult containing parsed dictionary or error
        """
        return self.parse(file_path)
