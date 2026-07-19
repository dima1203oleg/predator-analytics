import os
"""
Рівень 10: Перевірка AutoML.
Автоматичний запуск, підбір моделей, гіперпараметри, метрики.
"""
from pathlib import Path
from .base import BaseValidator, CheckResult
TARGET_HOST = os.getenv("TARGET_HOST", "localhost")


class AutoMLValidator(BaseValidator):
    def __init__(self):
        super().__init__(
            name="level10_automl",
            description="AutoML: підбір моделей, гіперпараметри, метрики, експерименти",
        )

    async def _run_validation(self):
        root = Path(os.getenv("PREDATOR_ROOT", Path(__file__).resolve().parent.parent.parent.parent))

        # 1. Перевірка ML-модулів
        await self._check_ml_modules(root)
        # 2. Перевірка ML-бібліотек
        await self._check_ml_libraries()

    async def _check_ml_modules(self, root: Path):
        """Перевірка наявності ML-модулів."""
        locations = [
            root / "services" / "core-api" / "ml",
            root / "services" / "core-api" / "automl",
            root / "libs" / "predator-common" / "ml",
        ]
        found = False
        for loc in locations:
            if loc.exists():
                found = True
                py_files = list(loc.rglob("*.py"))
                self.add_check(CheckResult(
                    name=f"ml_module_{loc.name}",
                    passed=len(py_files) > 0,
                    message=f"ML модуль {loc.name}: {len(py_files)} файлів",
                    severity="info",
                ))
        if not found:
            self.add_check(CheckResult(
                name="ml_modules",
                passed=False,
                message="ML/AutoML модулі не знайдено в проекті",
                severity="warning",
            ))

    async def _check_ml_libraries(self):
        """Перевірка ML бібліотек."""
        libs = {
            "scikit-learn": "sklearn",
            "numpy": "numpy",
            "pandas": "pandas",
        }
        optional = {
            "xgboost": "xgboost",
            "lightgbm": "lightgbm",
            "optuna": "optuna",
            "mlflow": "mlflow",
        }

        for name, mod in libs.items():
            try:
                m = __import__(mod)
                v = getattr(m, "__version__", "?")
                self.add_check(CheckResult(
                    name=f"ml_lib_{name}",
                    passed=True,
                    message=f"{name} v{v}",
                    severity="info",
                ))
            except ImportError:
                self.add_check(CheckResult(
                    name=f"ml_lib_{name}",
                    passed=False,
                    message=f"{name} не встановлений",
                    severity="warning",
                ))

        for name, mod in optional.items():
            try:
                m = __import__(mod)
                v = getattr(m, "__version__", "?")
                self.add_check(CheckResult(
                    name=f"ml_lib_{name}",
                    passed=True,
                    message=f"{name} v{v}",
                    severity="info",
                ))
            except ImportError:
                self.add_check(CheckResult(
                    name=f"ml_lib_{name}",
                    passed=False,
                    message=f"{name} не встановлений (потрібен у Docker)",
                    severity="info",
                ))
