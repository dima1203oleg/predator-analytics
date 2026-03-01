from datetime import datetime
import hashlib
import logging
import re
from typing import Any

import pandas as pd


# Configure logging
logger = logging.getLogger(__name__)


class CustomsExcelParser:
    """Production-ready parser for Customs Excel files (e.g., March_2024.xlsx).
    Implements dynamic column mapping, normalization, validation, and reporting.
    """

    # LOGICAL MODEL MAPPING (Target Field -> Possible Source Column Names (regex))
    COLUMN_MAPPING = {
        # Declaration Core
        "declaration_number": [r"номер.*декларації", r"декларація", r"decl_no", r"number"],
        "declaration_date": [r"дата.*оформлення", r"date", r"дата"],
        "customs_office": [r"митниця", r"customs", r"пост"],
        "regime": [r"режим", r"regime", r"тип.*декларації"],
        # Participants
        "importer_name": [r"імпортер", r"importer", r"одержувач", r"платник"],
        "importer_code": [r"код.*імпортера", r"єдрпоу.*імпортера", r"importer.*code"],
        "exporter_name": [r"експортер", r"exporter", r"відправник"],
        "exporter_country": [r"країна.*відправлення", r"sender.*country"],
        "origin_country": [r"країна.*походження", r"origin.*country"],
        # Goods
        "hs_code": [r"код.*товару", r"уктзед", r"hs_code"],
        "goods_description": [r"опис.*товару", r"name", r"description"],
        "net_weight": [r"вага.*нетто", r"net_weight"],
        "gross_weight": [r"вага.*брутто", r"gross_weight"],
        "customs_value": [r"митна.*вартість", r"customs.*value", r"вартість.*грн"],
        "invoice_value": [r"фактурна.*вартість", r"invoice.*value", r"вартість.*у.*валюті"],
        "currency": [r"валюта", r"currency_code"],
    }

    REQUIRED_FIELDS = ["declaration_number", "hs_code"]

    def __init__(self, file_path: str):
        self.file_path = file_path
        self.df: pd.DataFrame | None = None
        self.column_map: dict[str, str] = {}  # actual_col_name -> target_field
        self.stats = {"total_rows": 0, "success": 0, "rejected": 0, "duplicates": 0, "anomalies": 0, "errors": []}
        self.results: list[dict[str, Any]] = []

    def load_and_parse(self) -> dict[str, Any]:
        """Main execution flow."""
        try:
            self._load_excel()
            self._map_columns()
            self._process_rows()
            return self.stats
        except Exception as e:
            logger.exception(f"Critical parser error: {e}")
            self.stats["errors"].append(str(e))
            return self.stats

    def _load_excel(self):
        """Load Excel file safely."""
        logger.info(f"Loading {self.file_path}...")
        # Load only header first to detect structure? No, load all for now.
        # Assuming header is in the first few rows. We'll search for it.
        self.df = pd.read_excel(self.file_path, header=None)  # Load raw first
        self._detect_header()

    def _detect_header(self):
        """Dynamically find the header row by matching known keywords."""
        if self.df is None:
            raise ValueError("DataFrame not loaded")

        # Simple heuristic: Row with most matches to our mapping keywords
        best_idx = -1
        max_matches = 0

        for idx, row in self.df.head(10).iterrows():
            row_str = " ".join([str(x).lower() for x in row.values])
            matches = 0
            for targets in self.COLUMN_MAPPING.values():
                for pattern in targets:
                    if re.search(pattern, row_str):
                        matches += 1
                        break

            if matches > max_matches:
                max_matches = matches
                best_idx = idx

        if max_matches < 3:
            raise ValueError("Could not detect a valid header row. File structure unknown.")

        logger.info(f"Header detected at row {best_idx} with {max_matches} matches.")

        # Reload with correct header
        self.df = pd.read_excel(self.file_path, header=best_idx)
        # Normalize column names for mapping
        self.df.columns = [str(c).strip() for c in self.df.columns]

    def _map_columns(self):
        """Map actual Excel columns to our logical fields using Regex."""
        self.column_map = {}
        found_fields = set()

        for actual_col in self.df.columns:
            actual_lower = actual_col.lower()
            mapped = False
            for field, patterns in self.COLUMN_MAPPING.items():
                for pattern in patterns:
                    if re.search(pattern, actual_lower):
                        self.column_map[actual_col] = field
                        found_fields.add(field)
                        mapped = True
                        break
                if mapped:
                    break

        logger.info(f"Mapped {len(found_fields)} fields: {list(found_fields)}")
        missing_required = set(self.REQUIRED_FIELDS) - found_fields
        if missing_required:
            logger.warning(f"⚠️ Missing REQUIRED fields: {missing_required}")

    def _process_rows(self):
        """Iterate, validate, and normalize rows."""
        self.stats["total_rows"] = len(self.df)
        seen_hashes = set()

        for idx, row in self.df.iterrows():
            try:
                # 1. Extract raw data based on map
                data = {}
                for actual, target in self.column_map.items():
                    val = row[actual]
                    if pd.notna(val):
                        data[target] = val

                # 2. Basic cleaning / Normalization
                clean_data = self._normalize_record(data)

                # 3. Create Row Hash for Deduplication
                row_hash = self._calculate_hash(clean_data)

                # 4. Validation
                validation_error = self._validate_record(clean_data, row_hash, seen_hashes)

                if validation_error:
                    self.stats["rejected"] += 1
                    # Can verify duplicates vs other errors
                    if "Duplicate" in validation_error:
                        self.stats["duplicates"] += 1
                    else:
                        self.stats["errors"].append(f"Row {idx}: {validation_error}")
                    continue

                seen_hashes.add(row_hash)

                # 5. Success
                self.results.append(clean_data)
                self.stats["success"] += 1

            except Exception as e:
                self.stats["rejected"] += 1
                self.stats["errors"].append(f"Row {idx} exception: {e}")

    def _normalize_record(self, data: dict) -> dict:
        """Text cleaning, type conversion, ISO standardization."""
        norm = data.copy()

        # Normalize text fields
        for field in ["importer_name", "exporter_name", "goods_description", "customs_office"]:
            if field in norm:
                norm[field] = str(norm[field]).strip().upper().replace("  ", " ")

        # Normalize Company Names (Remove formal prefixes for matching)
        if "importer_name" in norm:
            norm["importer_name"] = re.sub(r'^(ТОВ|ПП|ДП|АТ|ТЗОВ)\s+"|"', "", norm["importer_name"]).strip()

        # Normalize Dates
        if "declaration_date" in norm:
            d = norm["declaration_date"]
            # Pandas usually handles datetime objects, ensure it's ISO string
            if isinstance(d, datetime):
                norm["declaration_date"] = d.strftime("%Y-%m-%d")
            else:
                norm["declaration_date"] = str(d)  # Fallback

        return norm

    def _calculate_hash(self, data: dict) -> str:
        """Create a unique hash for the record content."""
        # Join values sorted by key to ensure consistency
        s = "|".join([str(data.get(k, "")) for k in sorted(data.keys())])
        return hashlib.md5(s.encode("utf-8")).hexdigest()

    def _validate_record(self, data: dict, row_hash: str, seen_hashes: set) -> str | None:
        """Return error string if invalid, else None."""
        if row_hash in seen_hashes:
            return "Duplicate record (in-file)"

        # Global DB Duplicate Check (Stub)
        # if self._is_duplicate_in_db(data.get('declaration_number'), row_hash):
        #     return "Duplicate record (in-DB)"

        # Check required fields
        for req in self.REQUIRED_FIELDS:
            if req not in data or not str(data[req]).strip():
                return f"Missing required field: {req}"

        # Strict Date Validation
        if "declaration_date" in data:
            try:
                d = datetime.strptime(data["declaration_date"], "%Y-%m-%d")
                if d.year < 2000 or d > datetime.now():
                    return f"Invalid date: {data['declaration_date']} (out of realistic range)"
            except ValueError:
                return f"Invalid date format: {data['declaration_date']}"

        # Strict Numeric Validation
        for num_field in ["net_weight", "gross_weight", "customs_value", "invoice_value"]:
            if num_field in data:
                try:
                    val = float(data[num_field])
                    if val < 0:
                        return f"Negative value for {num_field}: {val}"
                except ValueError:
                    return f"Non-numeric value for {num_field}: {data[num_field]}"

        # Anomaly Detection (Simple heuristics)
        if "customs_value" in data and "invoice_value" in data:
            try:
                cv = float(data["customs_value"])
                iv = float(data["invoice_value"])
                if cv > iv * 10:
                    self.stats["anomalies"] += 1
                    data["_anomaly"] = "High customs/invoice ratio"
            except:
                pass

        return None

    def _is_duplicate_in_db(self, decl_number: str, row_hash: str) -> bool:
        """Check against PostgreSQL/Redis for existing record.
        This would be implemented with a db_session query in the full pipeline.
        """
        # Example: return db.query(Declaration).filter_by(row_hash=row_hash).exists()
        return False

    def export_results(self, output_path: str):
        """Save parsed data."""
        if not self.results:
            logger.warning("No results to export.")
            return

        pd.DataFrame(self.results).to_json(output_path, orient="records", force_ascii=False, indent=2)
        logger.info(f"Exported {len(self.results)} records to {output_path}")
