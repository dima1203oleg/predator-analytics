"""Runtime Component Registry & Verification System
Ensures all critical components are loaded and operational before serving requests.
"""

from dataclasses import dataclass
from datetime import datetime
from enum import StrEnum
import importlib
import logging


logger = logging.getLogger(__name__)


class ComponentStatus(StrEnum):
    """Component health status."""

    HEALTHY = "healthy"
    DEGRADED = "degraded"
    FAILED = "failed"
    NOT_LOADED = "not_loaded"


@dataclass
class ComponentInfo:
    """Component registration information."""

    name: str
    module_path: str
    required: bool
    status: ComponentStatus
    error: str | None = None
    loaded_at: datetime | None = None
    health_check_fn: callable | None = None


class ComponentRegistry:
    """Central registry for all system components.

    Enforces that critical components are loaded and healthy
    before the application starts serving requests.
    """

    # Critical components that MUST be loaded
    REQUIRED_COMPONENTS: list[dict[str, any]] = [
        {
            "name": "provenance",
            "module": "app.provenance.tracker",
            "health_check": "check_provenance_storage",
        },
        {
            "name": "metrics",
            "module": "app.metrics.collector",
            "health_check": "check_metrics_backend",
        },
        {"name": "ai", "module": "app.ai.orchestrator", "health_check": "check_llm_availability"},
        {
            "name": "ingestion",
            "module": "app.pipelines.ingestion",
            "health_check": "check_storage_access",
        },
        {"name": "azr", "module": "app.azr.engine", "health_check": "check_azr_constraints"},
        {"name": "security", "module": "app.core.security", "health_check": "check_auth_provider"},
    ]

    # Optional components (warnings only)
    OPTIONAL_COMPONENTS: list[dict[str, any]] = [
        {"name": "decision_memory", "module": "app.ai.decision_memory", "health_check": None},
        {"name": "simulation", "module": "app.analytics.simulation", "health_check": None},
    ]

    def __init__(self):
        self._components: dict[str, ComponentInfo] = {}
        self._initialized = False

    def register_all(self) -> None:
        """Register and verify all components."""
        logger.info("🔍 Registering system components...")

        # Register required components
        for comp in self.REQUIRED_COMPONENTS:
            self._register_component(
                name=comp["name"],
                module_path=comp["module"],
                required=True,
                health_check=comp.get("health_check"),
            )

        # Register optional components
        for comp in self.OPTIONAL_COMPONENTS:
            self._register_component(
                name=comp["name"],
                module_path=comp["module"],
                required=False,
                health_check=comp.get("health_check"),
            )

        self._initialized = True
        logger.info(f"✅ Registered {len(self._components)} components")

    def _register_component(
        self, name: str, module_path: str, required: bool, health_check: str | None = None
    ) -> None:
        """Register a single component."""
        try:
            # Try to import the module
            module = importlib.import_module(module_path)

            # Get health check function if specified
            health_fn = None
            if health_check and hasattr(module, health_check):
                health_fn = getattr(module, health_check)

            self._components[name] = ComponentInfo(
                name=name,
                module_path=module_path,
                required=required,
                status=ComponentStatus.HEALTHY,
                loaded_at=datetime.utcnow(),
                health_check_fn=health_fn,
            )

            logger.info(f"  ✓ {name} loaded from {module_path}")

        except ImportError as e:
            status = ComponentStatus.FAILED if required else ComponentStatus.NOT_LOADED
            self._components[name] = ComponentInfo(
                name=name, module_path=module_path, required=required, status=status, error=str(e)
            )

            if required:
                logger.exception(f"  ✗ {name} FAILED: {e}")
            else:
                logger.warning(f"  ⚠ {name} not loaded (optional): {e}")

    def verify(self) -> bool:
        """Verify all required components are healthy.

        Returns:
            True if all required components are healthy, False otherwise

        Raises:
            RuntimeError if critical components are missing
        """
        if not self._initialized:
            raise RuntimeError("Registry not initialized. Call register_all() first.")

        logger.info("🔎 Verifying component health...")

        missing = []
        degraded = []

        for name, info in self._components.items():
            if not info.required:
                continue

            # Check load status
            if info.status == ComponentStatus.NOT_LOADED:
                missing.append(name)
                continue

            # Run health check if available
            if info.health_check_fn:
                try:
                    is_healthy = info.health_check_fn()
                    if not is_healthy:
                        info.status = ComponentStatus.DEGRADED
                        degraded.append(name)
                        logger.warning(f"  ⚠ {name} is DEGRADED")
                    else:
                        logger.info(f"  ✓ {name} is HEALTHY")
                except Exception as e:
                    info.status = ComponentStatus.FAILED
                    info.error = str(e)
                    missing.append(name)
                    logger.exception(f"  ✗ {name} health check FAILED: {e}")

        # Report results
        if missing:
            error_msg = f"Missing or failed required components: {', '.join(missing)}"
            logger.error(f"❌ {error_msg}")
            raise RuntimeError(error_msg)

        if degraded:
            logger.warning(f"⚠️  Degraded components: {', '.join(degraded)}")
            logger.warning("System will start but some features may be limited")
        else:
            logger.info("✅ All required components are HEALTHY")

        return len(missing) == 0

    def get_status(self) -> dict[str, any]:
        """Get current status of all components."""
        return {
            "initialized": self._initialized,
            "components": {
                name: {
                    "status": info.status.value,
                    "required": info.required,
                    "loaded_at": info.loaded_at.isoformat() if info.loaded_at else None,
                    "error": info.error,
                }
                for name, info in self._components.items()
            },
            "summary": {
                "total": len(self._components),
                "required": sum(1 for c in self._components.values() if c.required),
                "healthy": sum(
                    1 for c in self._components.values() if c.status == ComponentStatus.HEALTHY
                ),
                "degraded": sum(
                    1 for c in self._components.values() if c.status == ComponentStatus.DEGRADED
                ),
                "failed": sum(
                    1 for c in self._components.values() if c.status == ComponentStatus.FAILED
                ),
            },
        }

    def get_missing_components(self) -> list[str]:
        """Get list of missing required components."""
        return [
            name
            for name, info in self._components.items()
            if info.required and info.status in (ComponentStatus.NOT_LOADED, ComponentStatus.FAILED)
        ]


# Global registry instance
registry = ComponentRegistry()


def initialize_registry() -> ComponentRegistry:
    """Initialize and verify the component registry."""
    registry.register_all()
    registry.verify()
    return registry


def get_registry() -> ComponentRegistry:
    """Get the global registry instance."""
    return registry
