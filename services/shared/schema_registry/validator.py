
"""
Module: validator
Component: shared.schema_registry
Predator Analytics v25.1
"""
import json
import os
import jsonschema
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

SCHEMAS_DIR = os.getenv("SCHEMAS_DIR", "schemas/")

class EventValidator:
    """
    Validates PredatorEvent against versioned JSON schemas.
    Section 3.1.4 of Spec.
    """
    _cache: Dict[str, Any] = {}

    @classmethod
    def _get_schema(cls, event_type: str, version: str) -> Optional[Dict]:
        key = f"{event_type}_{version}"
        if key in cls._cache:
            return cls._cache[key]

        filename = f"predator.events.{event_type}.v{version.split('.')[0]}.json"
        path = os.path.join(SCHEMAS_DIR, filename)

        if not os.path.exists(path):
            logger.warning(f"Schema not found: {path}")
            return None

        try:
            with open(path, 'r') as f:
                schema = json.load(f)
                cls._cache[key] = schema
                return schema
        except Exception as e:
            logger.error(f"Failed to load schema {path}: {e}")
            return None

    @classmethod
    def validate(cls, event_data: Dict[str, Any]) -> bool:
        event_type = event_data.get("event_type")
        version = event_data.get("version", "1.0")

        if not event_type:
            return False

        schema = cls._get_schema(event_type, version)
        if not schema:
            # If no schema exists, we log a warning but might allow (config dependent)
            return True 

        try:
            jsonschema.validate(instance=event_data, schema=schema)
            return True
        except jsonschema.ValidationError as e:
            logger.error(f"Event validation failed for {event_type} v{version}: {e.message}")
            return False
