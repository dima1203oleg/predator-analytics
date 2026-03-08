from __future__ import annotations


"""
Data Transformation Layer

Provides validation and mapping of parsed data to a unified schema.
"""

from datetime import datetime
import logging
from typing import Any


try:
    import pandas as pd
except ImportError:
    pd = None

try:
    from pydantic import BaseModel, Field, ValidationError, validator
except ImportError:

    class BaseModel:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)

        def dict(self):
            return self.__dict__
        
        def model_dump(self):
            return self.__dict__

    def Field(default=None, **kwargs):
        return default

    def validator(*args, **kwargs):
        return lambda x: x

    class ValidationError(Exception):
        pass


# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CompanySchema(BaseModel):
    """Schema for company data.

    This schema defines the structure for company information extracted from datasets.
    """

    name: str = Field(..., description="Company name")
    registration_number: str = Field(..., description="Company registration number (e.g., ЄДРПОУ)")
    address: str = Field(..., description="Company address")
    directors: list[str] = Field(default_factory=list, description="List of company directors")
    source_format: str = Field(..., description="Original data format (csv, json, xml)")
    timestamp: datetime = Field(
        default_factory=datetime.now, description="Transformation timestamp"
    )


class CustomsSchema(BaseModel):
    """Schema for Customs Declaration data (Ukraine Customs OSINT)."""
    
    declaration_number: str = Field(..., alias="Митна декларація")
    date: datetime = Field(..., alias="Дата")
    sender: str = Field(..., alias="Відправник")
    receiver: str = Field(..., alias="Одержувач")
    product_code: str = Field(..., alias="Код товару")
    description: str = Field(..., alias="Опис товару")
    net_weight: float = Field(default=0.0, alias="Маса, нетто, кг")
    gross_weight: float = Field(default=0.0, alias="Маса, брутто, кг")
    invoice_value: float = Field(default=0.0, alias="Фактурна варість, валюта контракту")
    currency: str = Field(default="USD", alias="Валюта")
    source_format: str = Field(default="canonical", description="Original data format")
    timestamp: datetime = Field(default_factory=datetime.now)

    class Config:
        populate_by_name = True


class DirectorSchema(BaseModel):
    """Schema for director/person data.

    This schema defines the structure for individual/director information extracted from datasets.
    """

    name: str = Field(..., description="Person's name")
    position: str = Field(..., description="Person's position/role")
    company: str = Field(..., description="Associated company")
    source_format: str = Field(default="unknown", description="Original data format")
    timestamp: datetime = Field(
        default_factory=datetime.now, description="Transformation timestamp"
    )

class UnifiedSchema(BaseModel):
    """Unified data schema for transformed data.

    This schema defines the standard structure that all parsed data
    should be transformed into for consistency across different sources.
    """

    name: str = Field(..., description="Person's name")
    age: int = Field(..., description="Person's age", ge=0, le=150)
    city: str = Field(..., description="Person's city of residence")
    score: float = Field(..., description="Person's score", ge=0.0, le=100.0)
    source_format: str = Field(..., description="Original data format (csv, json, xml)")
    timestamp: datetime = Field(
        default_factory=datetime.now, description="Transformation timestamp"
    )

    class Config:
        json_schema_extra = {
            "examples": [
                {
                    "name": "John",
                    "age": 25,
                    "city": "New York",
                    "score": 85.5,
                    "source_format": "csv",
                    "timestamp": "2024-01-23T12:00:00",
                }
            ]
        }


class TransformResult:
    """Result container for transformation operations."""

    def __init__(self, success: bool, data: Any | None = None, error: str | None = None):
        self.success = success
        self.data = data
        self.error = error
        self.metadata = {}

    def __repr__(self) -> str:
        if self.success:
            return f"TransformResult(success=True, data_type={type(self.data).__name__})"
        return f"TransformResult(success=False, error={self.error})"


class DataTransformer:
    """Data transformation layer for validating and mapping data to unified schema.

    This class handles:
    - Data validation against the unified schema
    - Type conversion and normalization
    - Error handling and logging
    - Transformation of parsed data from various sources
    """

    def __init__(self):
        self.unified_schema = UnifiedSchema
        self.company_schema = CompanySchema
        self.director_schema = DirectorSchema
        self.customs_schema = CustomsSchema
        logger.info("DataTransformer initialized with unified and customs schemas")

    def validate_data(
        self,
        data: dict[str | Any, list[dict[str, Any]]],
        source_format: str = "unknown",
        schema_type: str = "unified",
    ) -> TransformResult:
        """Validate data against the specified schema.

        Args:
            data: Data to validate (single record or list of records)
            source_format: Original data format (csv, json, xml)
            schema_type: Type of schema to use ('unified', 'company', 'director')

        Returns:
            TransformResult containing validated data or error information
        """
        try:
            # Select the appropriate schema
            if schema_type == "company":
                schema = self.company_schema
            elif schema_type == "director":
                schema = self.director_schema
            elif schema_type == "customs":
                schema = self.customs_schema
            else:
                schema = self.unified_schema

            if isinstance(data, list):
                # Validate list of records
                validated_records = []
                for i, record in enumerate(data):
                    try:
                        # Add source format and timestamp
                        record_with_metadata = record.copy()
                        record_with_metadata["source_format"] = source_format

                        validated_record = schema(**record_with_metadata)
                        # Use .model_dump() for Pydantic v2, or .dict() for v1/fallback
                        if hasattr(validated_record, "model_dump"):
                            validated_records.append(validated_record.model_dump())
                        else:
                            validated_records.append(validated_record.dict())
                    except ValidationError as ve:
                        logger.warning(f"Validation error in record {i}: {ve}")
                        return TransformResult(
                            False, error=f"Validation error in record {i}: {ve!s}"
                        )

                return TransformResult(True, data=validated_records)
            # Validate single record
            data_with_metadata = data.copy()
            data_with_metadata["source_format"] = source_format

            validated_record = schema(**data_with_metadata)
            if hasattr(validated_record, "model_dump"):
                return TransformResult(True, data=validated_record.model_dump())
            return TransformResult(True, data=validated_record.dict())

        except ValidationError as ve:
            error_msg = f"Schema validation failed: {ve!s}"
            logger.exception(error_msg)
            return TransformResult(False, error=error_msg)
        except Exception as e:
            error_msg = f"Validation failed: {e!s}"
            logger.exception(error_msg)
            return TransformResult(False, error=error_msg)

    def transform_from_dataframe(
        self, df: pd.DataFrame, source_format: str = "unknown"
    ) -> TransformResult:
        """Transform data from pandas DataFrame to unified schema.

        Args:
            df: DataFrame containing parsed data
            source_format: Original data format

        Returns:
            TransformResult containing transformed data or error
        """
        try:
            # Convert DataFrame to list of dicts
            records = df.to_dict(orient="records")

            # Validate and transform each record
            return self.validate_data(records, source_format)

        except Exception as e:
            error_msg = f"DataFrame transformation failed: {e!s}"
            logger.exception(error_msg)
            return TransformResult(False, error=error_msg)

    def transform_from_dict(
        self, data: dict[str, Any], source_format: str = "unknown"
    ) -> TransformResult:
        """Transform data from dictionary to unified schema.

        Args:
            data: Dictionary containing parsed data
            source_format: Original data format

        Returns:
            TransformResult containing transformed data or error
        """
        try:
            # Handle nested XML structure
            if source_format == "xml" and "person" in data:
                # Extract person records from XML structure
                person_data = data["person"]
                if isinstance(person_data, list):
                    # Multiple person records
                    records = []
                    for person in person_data:
                        # Handle both direct person dict and nested structure
                        if isinstance(person, dict):
                            # Extract from person dict, handling @attributes
                            person_content = person
                            if "@attributes" in person_content:
                                # Skip attributes for main data
                                person_content = {
                                    k: v for k, v in person_content.items() if k != "@attributes"
                                }

                            record = {
                                "name": person_content.get("name", ""),
                                "age": int(person_content.get("age", 0)),
                                "city": person_content.get("city", ""),
                                "score": float(person_content.get("score", 0.0)),
                            }
                            records.append(record)
                        else:
                            # Handle case where person is a string or other type
                            record = {
                                "name": str(person),
                                "age": 0,
                                "city": "unknown",
                                "score": 0.0,
                            }
                            records.append(record)
                    return self.validate_data(records, source_format)
                # Single person record
                person_content = person_data
                if isinstance(person_content, dict) and "@attributes" in person_content:
                    # Skip attributes for main data
                    person_content = {k: v for k, v in person_content.items() if k != "@attributes"}

                record = {
                    "name": person_content.get("name", ""),
                    "age": int(person_content.get("age", 0)),
                    "city": person_content.get("city", ""),
                    "score": float(person_content.get("score", 0.0)),
                }
                return self.validate_data(record, source_format)
            # Direct dictionary transformation
            return self.validate_data(data, source_format)

        except Exception as e:
            error_msg = f"Dictionary transformation failed: {e!s}"
            logger.exception(error_msg)
            return TransformResult(False, error=error_msg)

    def normalize_data_types(self, data: dict[str | Any, list[dict[str, Any]]]) -> TransformResult:
        """Normalize data types to ensure consistency.

        Args:
            data: Data to normalize

        Returns:
            TransformResult containing normalized data or error
        """
        try:

            def normalize_record(record: dict[str, Any]) -> dict[str, Any]:
                """Normalize a single record."""
                normalized = record.copy()

                # Convert age to int
                if "age" in normalized:
                    try:
                        normalized["age"] = int(float(normalized["age"]))
                    except (ValueError, TypeError):
                        normalized["age"] = 0

                # Convert score to float
                if "score" in normalized:
                    try:
                        normalized["score"] = float(normalized["score"])
                    except (ValueError, TypeError):
                        normalized["score"] = 0.0

                # Ensure string fields
                for field in ["name", "city"]:
                    if field in normalized:
                        normalized[field] = str(normalized[field])

                # Customs data normalization (Ukraine Customs OSINT)
                customs_float_fields = [
                    "Маса, брутто, кг",
                    "Маса, нетто, кг",
                    "Вага по митній декларації",
                    "Фактурна варість, валюта контракту",
                    "Розрахункова фактурна вартість, дол. США / кг",
                    "Розрахункова митна вартість, нетто дол. США / кг",
                    "Розрахункова митна вартість, дол. США / дод. од.",
                    "Розрахункова митна вартість,брутто дол. США / кг",
                    "Мін.База Дол/кг.",
                    "КЗ Нетто Дол/кг.",
                    "Кількість"
                ]

                for field in customs_float_fields:
                    if field in normalized and not pd.isna(normalized[field]) if pd is not None else normalized.get(field) is not None:
                        try:
                            # Parse European format floats if needed (e.g. 1,23 -> 1.23) and handle empty strings
                            val = str(normalized[field]).replace(',', '.').strip()
                            normalized[field] = float(val) if val else 0.0
                        except (ValueError, TypeError):
                            normalized[field] = 0.0

                # Normalize Customs Code (Код товару) as string, strip trailing .0 from float parses
                customs_code_fields = ["Код товару", "Код ЄДРПОУ"]
                for field in customs_code_fields:
                    val_raw = normalized.get(field)
                    if val_raw is not None:
                        is_na = False
                        if pd is not None:
                            is_na = pd.isna(val_raw)
                        
                        if not is_na:
                            val_str = str(val_raw).strip()
                            # Handle float representations of codes (e.g. 12345.0)
                            if val_str.endswith(".0"):
                                val_str = val_str[:-2]
                            normalized[field] = val_str

                return normalized

            if isinstance(data, list):
                normalized_data = [normalize_record(record) for record in data]
            else:
                normalized_data = normalize_record(data)

            return TransformResult(True, data=normalized_data)

        except Exception as e:
            error_msg = f"Data normalization failed: {e!s}"
            logger.exception(error_msg)
            return TransformResult(False, error=error_msg)

    def get_schema(self) -> dict[str, Any]:
        """Get the unified schema definition.

        Returns:
            Dictionary representation of the schema
        """
        return self.schema.schema()

    def validate_schema_compatibility(
        self, data_sample: dict[str | Any, list[dict[str, Any]]]
    ) -> TransformResult:
        """Validate that a data sample is compatible with the unified schema.

        Args:
            data_sample: Sample data to validate compatibility

        Returns:
            TransformResult with compatibility status
        """
        try:
            # Check if required fields are present
            required_fields = ["name", "age", "city", "score"]

            if isinstance(data_sample, list):
                if not data_sample:
                    return TransformResult(False, error="Empty data sample")
                sample_record = data_sample[0]
            else:
                sample_record = data_sample

            missing_fields = [field for field in required_fields if field not in sample_record]

            if missing_fields:
                return TransformResult(
                    False, error=f"Missing required fields: {', '.join(missing_fields)}"
                )

            return TransformResult(
                True, data={"message": "Data sample is compatible with unified schema"}
            )

        except Exception as e:
            error_msg = f"Schema compatibility check failed: {e!s}"
            logger.exception(error_msg)
            return TransformResult(False, error=error_msg)


def create_data_transformer() -> DataTransformer:
    """Factory function to create a DataTransformer instance.

    Returns:
        DataTransformer instance
    """
    return DataTransformer()
