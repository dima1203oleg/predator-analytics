"""Schema registry validator for Predator Analytics v45.1.

Component: shared.schema_registry.
"""

import json
import logging
from pathlib import Path
from typing import Any, ClassVar

import jsonschema

logger = logging.getLogger(__name__)

SCHEMAS_DIR = Path(__file__).parent.parent.parent / "schemas"


class EventValidator:
    """Validate PredatorEvent against versioned JSON schemas.

    Section 3.1.4 of Spec.
    """

    _cache: ClassVar[dict[str, Any]] = {}

    @classmethod
    def _get_schema(cls, event_type: str, version: str) -> dict[str, Any] | None:
        """Load and cache a JSON schema for the given event type and version."""
        key = f"{event_type}_{version}"
        if key in cls._cache:
            return cls._cache[key]

        filename = f"predator.events.{event_type}.v{version.split('.', maxsplit=1)[0]}.json"
        path = SCHEMAS_DIR / filename

        if not path.exists():
            logger.warning("Schema not found: %s", path)
            return None

        try:
            with open(path) as f:
                schema = json.load(f)
                cls._cache[key] = schema
        except Exception:
            logger.exception("Failed to load schema %s", path)
            return None
        else:
            return schema

    @classmethod
    def validate(cls, event_data: dict[str, Any]) -> bool:
        """Validate event data against its schema."""
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
        except jsonschema.ValidationError as e:
            logger.exception(
                "Event validation failed for %s v%s: %s",
                event_type,
                version,
                e.message,
            )
            return False
        else:
            return True
