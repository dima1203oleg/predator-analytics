from __future__ import annotations

from typing import Any

"""
Dataset Parser for Company and Director Information

This module provides functionality to parse datasets and extract key information
about companies and directors, then save the data in a unified schema and log
results in the Knowledge Graph.
"""

from datetime import datetime
import logging
from pathlib import Path

try:
    import pandas as pd
except ImportError:
    pd = None

from transformation.data_transformer import DataTransformer

from parsing.data_parser import DataParser

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DatasetParser:
    """Dataset parser for extracting company and director information.

    This class handles:
    - Parsing datasets in various formats (CSV, JSON, XML)
    - Extracting key information about companies and directors
    - Transforming data to unified schemas
    - Logging results to Knowledge Graph
    """

    def __init__(self):
        self.data_parser = DataParser()
        self.data_transformer = DataTransformer()
        logger.info("DatasetParser initialized")

    def parse_dataset(self, file_path: str | Path, dataset_type: str = "auto") -> dict[str, Any]:
        """Parse a dataset file and extract key information.

        Args:
            file_path: Path to the dataset file
            dataset_type: Type of dataset ('company', 'director', 'auto')

        Returns:
            Dictionary containing parsing results and extracted data

        """
        file_path = Path(file_path)

        if not file_path.exists():
            return {
                "success": False,
                "error": f"File not found: {file_path}",
                "file_path": str(file_path),
            }

        # Parse the file using the appropriate parser
        parse_result = self.data_parser.parse(file_path)

        if not parse_result.success:
            return {
                "success": False,
                "error": f"Parsing failed: {parse_result.error}",
                "file_path": str(file_path),
                "format": file_path.suffix.lower()[1:],  # Remove dot
            }

        # Convert to DataFrame for easier processing
        if not isinstance(parse_result.data, pd.DataFrame):
            try:
                if isinstance(parse_result.data, list):
                    df = pd.DataFrame(parse_result.data)
                elif isinstance(parse_result.data, dict):
                    df = pd.DataFrame([parse_result.data])
                else:
                    df = pd.DataFrame([parse_result.data])
            except Exception as e:
                return {
                    "success": False,
                    "error": f"Failed to convert to DataFrame: {e!s}",
                    "file_path": str(file_path),
                }
        else:
            df = parse_result.data

        # Auto-detect dataset type if not specified
        if dataset_type == "auto":
            dataset_type = self._detect_dataset_type(df)

        # Extract key information based on dataset type
        try:
            if dataset_type == "company":
                extracted_data = self._extract_company_data(df)
                schema_type = "company"
            elif dataset_type == "director":
                extracted_data = self._extract_director_data(df)
                schema_type = "director"
            else:
                # Default to unified schema for backward compatibility
                extracted_data = self._extract_unified_data(df)
                schema_type = "unified"

            # Transform data to unified schema
            transform_result = self.data_transformer.validate_data(
                extracted_data,
                source_format=file_path.suffix.lower()[1:],  # Remove dot
                schema_type=schema_type,
            )

            if not transform_result.success:
                return {
                    "success": False,
                    "error": f"Data transformation failed: {transform_result.error}",
                    "file_path": str(file_path),
                    "dataset_type": dataset_type,
                }

            return {
                "success": True,
                "file_path": str(file_path),
                "format": file_path.suffix.lower()[1:],
                "dataset_type": dataset_type,
                "extracted_data": extracted_data,
                "transformed_data": transform_result.data,
                "metadata": {
                    "rows_processed": len(df),
                    "columns": list(df.columns),
                    "timestamp": datetime.now().isoformat(),
                },
            }

        except Exception as e:
            return {
                "success": False,
                "error": f"Data extraction failed: {e!s}",
                "file_path": str(file_path),
                "dataset_type": dataset_type,
            }

    def _detect_dataset_type(self, df: pd.DataFrame) -> str:
        """Auto-detect dataset type based on column names.

        Args:
            df: DataFrame containing the dataset

        Returns:
            Detected dataset type ('company', 'director', or 'unified')

        """
        columns = [col.lower() for col in df.columns]

        # Check for company-related columns
        company_indicators = ["company", "registration", "edrpou", "business", "organization"]
        if any(indicator in str(columns) for indicator in company_indicators):
            return "company"

        # Check for director/person-related columns
        director_indicators = ["director", "position", "role", "title", "executive"]
        if any(indicator in str(columns) for indicator in director_indicators):
            return "director"

        # Default to unified (personal data)
        return "unified"

    def _extract_company_data(self, df: pd.DataFrame) -> list[dict[str, Any]]:
        """Extract company data from DataFrame.

        Args:
            df: DataFrame containing company data

        Returns:
            List of dictionaries with extracted company information

        """
        extracted_records = []

        for _, row in df.iterrows():
            record = {}

            # Map common column names to schema fields
            if "name" in row or "company" in row or "organization" in row:
                record["name"] = str(
                    row.get("name", row.get("company", row.get("organization", "")))
                )

            if "registration" in row or "edrpou" in row or "reg_number" in row:
                record["registration_number"] = str(
                    row.get("registration", row.get("edrpou", row.get("reg_number", "")))
                )

            if "address" in row or "location" in row:
                record["address"] = str(row.get("address", row.get("location", "")))

            # Handle directors (can be single value or list)
            directors = []
            if "director" in row:
                directors.append(str(row["director"]))
            if "directors" in row:
                if isinstance(row["directors"], list):
                    directors.extend([str(d) for d in row["directors"]])
                else:
                    directors.append(str(row["directors"]))

            record["directors"] = directors or []

            extracted_records.append(record)

        return extracted_records

    def _extract_director_data(self, df: pd.DataFrame) -> list[dict[str, Any]]:
        """Extract director data from DataFrame.

        Args:
            df: DataFrame containing director data

        Returns:
            List of dictionaries with extracted director information

        """
        extracted_records = []

        for _, row in df.iterrows():
            record = {}

            # Map common column names to schema fields
            if "name" in row or "director" in row or "person" in row:
                record["name"] = str(row.get("name", row.get("director", row.get("person", ""))))

            if "position" in row or "role" in row or "title" in row:
                record["position"] = str(row.get("position", row.get("role", row.get("title", ""))))

            if "company" in row or "organization" in row or "business" in row:
                record["company"] = str(
                    row.get("company", row.get("organization", row.get("business", "")))
                )

            extracted_records.append(record)

        return extracted_records

    def _extract_unified_data(self, df: pd.DataFrame) -> list[dict[str, Any]]:
        """Extract unified (personal) data from DataFrame.

        Args:
            df: DataFrame containing personal data

        Returns:
            List of dictionaries with extracted personal information

        """
        extracted_records = []

        for _, row in df.iterrows():
            record = {}

            # Map common column names to schema fields with default values
            record["name"] = str(row.get("name", row.get("person", "Unknown")))
            record["age"] = int(row.get("age", 25))  # Default age
            record["city"] = str(row.get("city", row.get("location", "Unknown")))
            record["score"] = float(row.get("score", row.get("rating", 50.0)))  # Default score

            extracted_records.append(record)

        return extracted_records

    async def log_to_knowledge_graph(
        self, parse_result: dict[str, Any], namespace: str = "global"
    ) -> dict[str, Any]:
        """Log parsing results to Knowledge Graph.

        Args:
            parse_result: Result from parse_dataset method
            namespace: Knowledge Graph namespace

        Returns:
            Dictionary containing Knowledge Graph logging results

        """
        if not parse_result.get("success", False):
            return {
                "success": False,
                "error": "Cannot log failed parsing result to Knowledge Graph",
                "original_error": parse_result.get("error", "Unknown error"),
            }

        try:
            # Import Knowledge Graph here to avoid circular imports
            from src.brain.knowledge_graph import knowledge_graph

            kg_results = {"nodes_added": 0, "edges_added": 0, "success": True, "errors": []}

            dataset_type = parse_result["dataset_type"]
            file_path = parse_result["file_path"]
            transformed_data = parse_result["transformed_data"]

            # Add dataset node to Knowledge Graph
            dataset_node_id = f"dataset://{file_path}"
            dataset_success = await knowledge_graph.add_node(
                node_type="DATASET",
                node_id=dataset_node_id,
                attributes={
                    "file_path": file_path,
                    "format": parse_result["format"],
                    "dataset_type": dataset_type,
                    "rows_processed": parse_result["metadata"]["rows_processed"],
                    "timestamp": parse_result["metadata"]["timestamp"],
                    "description": f"Dataset containing {dataset_type} information",
                },
                namespace=namespace,
            )

            if dataset_success:
                kg_results["nodes_added"] += 1
            else:
                kg_results["errors"].append("Failed to add dataset node")

            # Add nodes for each extracted entity
            if isinstance(transformed_data, list):
                for i, entity_data in enumerate(transformed_data):
                    entity_id = f"{dataset_type.lower()}:{file_path}:{i}"

                    if dataset_type == "company":
                        node_type = "COMPANY"
                        attributes = {
                            "name": entity_data.get("name", ""),
                            "registration_number": entity_data.get("registration_number", ""),
                            "address": entity_data.get("address", ""),
                            "directors": entity_data.get("directors", []),
                            "source_dataset": file_path,
                        }
                    elif dataset_type == "director":
                        node_type = "DIRECTOR"
                        attributes = {
                            "name": entity_data.get("name", ""),
                            "position": entity_data.get("position", ""),
                            "company": entity_data.get("company", ""),
                            "source_dataset": file_path,
                        }
                    else:  # unified/personal
                        node_type = "PERSON"
                        attributes = {
                            "name": entity_data.get("name", ""),
                            "age": entity_data.get("age", 0),
                            "city": entity_data.get("city", ""),
                            "score": entity_data.get("score", 0.0),
                            "source_dataset": file_path,
                        }

                    entity_success = await knowledge_graph.add_node(
                        node_type=node_type,
                        node_id=entity_id,
                        attributes=attributes,
                        namespace=namespace,
                    )

                    if entity_success:
                        kg_results["nodes_added"] += 1

                        # Add edge from dataset to entity
                        edge_success = await knowledge_graph.add_edge(
                            source_id=dataset_node_id,
                            target_id=entity_id,
                            relation="CONTAINS",
                            attributes={"dataset_type": dataset_type, "index": i},
                            namespace=namespace,
                        )

                        if edge_success:
                            kg_results["edges_added"] += 1
                    else:
                        kg_results["errors"].append(f"Failed to add entity node {entity_id}")

            logger.info(
                f"Knowledge Graph logging completed: {kg_results['nodes_added']} nodes, {kg_results['edges_added']} edges added"
            )
            return kg_results

        except ImportError:
            logger.warning("Knowledge Graph module not available - skipping KG logging")
            return {
                "success": False,
                "error": "Knowledge Graph module not available",
                "warning": "KG logging skipped",
            }
        except Exception as e:
            logger.exception(f"Failed to log to Knowledge Graph: {e!s}")
            return {
                "success": False,
                "error": f"Knowledge Graph logging failed: {e!s}",
                "exception": str(e),
            }


def create_dataset_parser() -> DatasetParser:
    """Factory function to create a DatasetParser instance.

    Returns:
        DatasetParser instance

    """
    return DatasetParser()
