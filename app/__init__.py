import pathlib
import pkgutil

# Extend this package to include the two service app directories
core_api_path = pathlib.Path(__file__).resolve().parents[2] / "services" / "core-api" / "app"
ingestion_path = pathlib.Path(__file__).resolve().parents[2] / "services" / "ingestion-worker" / "app"

# Ensure both paths are added to __path__ for namespace package behavior
__path__ = pkgutil.extend_path(__path__, __name__)
__path__.extend([str(core_api_path), str(ingestion_path)])

