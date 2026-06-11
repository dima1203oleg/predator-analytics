import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class BaseValidator:
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description

    async def validate(self) -> Dict[str, Any]:
        logger.info(f"Starting validation: {self.name} - {self.description}")
        try:
            result = await self._run_validation()
            return {
                "name": self.name,
                "status": "pass" if result.get("success", False) else "fail",
                "details": result.get("details", {}),
                "errors": result.get("errors", [])
            }
        except Exception as e:
            logger.error(f"Validation failed with exception: {e}")
            return {
                "name": self.name,
                "status": "error",
                "details": {},
                "errors": [str(e)]
            }

    async def _run_validation(self) -> Dict[str, Any]:
        raise NotImplementedError("Subclasses must implement _run_validation")
