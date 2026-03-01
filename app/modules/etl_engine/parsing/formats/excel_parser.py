from __future__ import annotations

import contextlib
import logging
import os
from typing import Any
import xml.etree.ElementTree as ET
import zipfile

from ..data_parser import ParseResult


logger = logging.getLogger("sovereign_excel_parser")


class ExcelParser:
    """Sovereign Excel Parser (Dependency-Free).
    ---------------------------------------
    Reads .xlsx files using standard zipfile and xml libraries.
    Memory-efficient streaming for massive files.
    """

    def parse(self, file_path: str | Any) -> ParseResult:
        try:
            if not os.path.exists(file_path):
                return ParseResult(False, error=f"File not found: {file_path}")

            logger.info(f"📊 Sovereign Parsing: {file_path}")

            # 1. Open the XLSX (it's a zip)
            with zipfile.ZipFile(file_path, "r") as z:
                # 2. Load Shared Strings (needed to resolve text values)
                shared_strings = self._get_shared_strings(z)

                # 3. Load Worksheet 1
                data = self._parse_worksheet(z, "xl/worksheets/sheet1.xml", shared_strings)

                if not data:
                    return ParseResult(False, error="No data found in sheet1")

                result = ParseResult(True, data=data)
                result.metadata = {
                    "source": "sovereign_parser_v1",
                    "rows": len(data),
                    "file": os.path.basename(file_path),
                }
                return result

        except Exception as e:
            logger.exception(f"Sovereign parse error: {e}")
            return ParseResult(False, error=str(e))

    def _get_shared_strings(self, z: zipfile.ZipFile) -> list[str]:
        """Extract strings from xl/sharedStrings.xml."""
        strings = []
        try:
            with z.open("xl/sharedStrings.xml") as f:
                # Use iterparse for memory efficiency if possible, but for now simple parse
                tree = ET.parse(f)
                root = tree.getroot()
                # Namespaces can be tricky in XLSX
                ns = {"ns": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
                for si in root.findall("ns:si", ns):
                    t = si.find("ns:t", ns)
                    if t is not None:
                        strings.append(t.text or "")
                    else:
                        # Handle formatted text runs <r><t>...</t></r>
                        full_t = "".join([node.text for node in si.findall(".//ns:t", ns) if node.text])
                        strings.append(full_t)
        except KeyError:
            # No shared strings file means only numbers/inline strings
            pass
        return strings

    def _parse_worksheet(
        self, z: zipfile.ZipFile, sheet_rel_path: str, shared_strings: list[str]
    ) -> list[dict[str, Any]]:
        """Parse rows from the worksheet XML."""
        data = []
        headers = []

        try:
            with z.open(sheet_rel_path) as f:
                # iterparse to handle potentially huge files
                context = ET.iterparse(f, events=("start", "end"))

                current_row = {}
                current_cell_ref = ""
                is_shared_string = False

                for event, elem in context:
                    tag = elem.tag.split("}")[-1]

                    if event == "start":
                        if tag == "c":  # Cell
                            current_cell_ref = elem.get("r", "")
                            is_shared_string = elem.get("t") == "s"

                    elif event == "end":
                        if tag == "v":  # Value
                            val = elem.text
                            if is_shared_string and val is not None:
                                with contextlib.suppress(IndexError, ValueError):
                                    val = shared_strings[int(val)]

                            # Map to column index (A, B, C...)
                            col_ref = "".join([c for c in current_cell_ref if c.isalpha()])
                            current_row[col_ref] = val

                        elif tag == "row":
                            if not headers:
                                # First seen row becomes headers
                                # Sort by column ref A, B, C...
                                sorted_cols = sorted(current_row.keys(), key=lambda x: (len(x), x))
                                headers = [current_row[c] for c in sorted_cols]
                            else:
                                # Data row
                                row_dict = {}
                                sorted_cols = sorted(current_row.keys(), key=lambda x: (len(x), x))
                                for i, c in enumerate(sorted_cols):
                                    header = headers[i] if i < len(headers) else f"Col_{c}"
                                    row_dict[header] = current_row[c]
                                data.append(row_dict)

                            current_row = {}
                            # Clear element to save memory
                            elem.clear()

        except Exception as e:
            logger.exception(f"Worksheet parse error: {e}")

        return data
