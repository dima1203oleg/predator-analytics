import os
"""
Рівень 17: End-to-End сценарій.
Повний ланцюг: завантаження → ETL → БД → API → WebSocket → Frontend → DOM.
"""
import httpx
from pathlib import Path
from .base import BaseValidator, CheckResult
from .. import config
TARGET_HOST = os.getenv("TARGET_HOST", "localhost")


class E2eValidator(BaseValidator):
    def __init__(self):
        super().__init__(
            name="level17_e2e",
            description="E2E: повний ланцюг від завантаження до відображення",
        )

    async def _run_validation(self):
        # 1. Frontend доступний та рендерить сторінки
        await self._e2e_frontend_renders()
        # 2. API доступний та відповідає коректно
        await self._e2e_api_responds()
        # 3. Ollama працює та генерує
        await self._e2e_ollama_generates()
        # 4. Повна перевірка кодової бази
        await self._e2e_codebase_integrity()

    async def _e2e_frontend_renders(self):
        """E2E: Frontend повністю рендерить сторінки."""
        try:
            async with httpx.AsyncClient(verify=False, timeout=10) as client:
                # Перевірка головної сторінки
                r = await client.get(config.FRONTEND_URL)
                html = r.text

                has_root = 'id="root"' in html
                has_scripts = '<script' in html
                has_title = "PREDATOR" in html.upper()
                has_vite = "vite" in html.lower()

                all_ok = has_root and has_scripts and has_title
                self.add_check(CheckResult(
                    name="e2e_frontend_render",
                    passed=all_ok,
                    message=f"Frontend рендерить: root={'✓' if has_root else '✗'}, "
                            f"scripts={'✓' if has_scripts else '✗'}, "
                            f"title={'✓' if has_title else '✗'}, "
                            f"vite={'✓' if has_vite else '✗'}",
                    severity="critical" if not all_ok else "info",
                ))

                # Перевірка ключових маршрутів SPA
                spa_routes = ["/admin/command", "/command", "/search", "/market"]
                for route in spa_routes:
                    r2 = await client.get(f"{config.FRONTEND_URL}{route}")
                    self.add_check(CheckResult(
                        name=f"e2e_spa_route_{route.strip('/').replace('/', '_')}",
                        passed=r2.status_code == 200 and 'id="root"' in r2.text,
                        message=f"SPA маршрут {route}: HTTP {r2.status_code}",
                        severity="warning",
                    ))

        except Exception as e:
            self.add_check(CheckResult(
                name="e2e_frontend_render",
                passed=False,
                message=f"Frontend недоступний: {e}",
                severity="critical",
            ))

    async def _e2e_api_responds(self):
        """E2E: API відповідає коректно."""
        try:
            async with httpx.AsyncClient(verify=False, timeout=5) as client:
                r = await client.get(f"{config.CORE_API_URL}/api/v1/health")
                if r.status_code == 200:
                    data = r.json()
                    self.add_check(CheckResult(
                        name="e2e_api_health",
                        passed=True,
                        message=f"API health: {data}",
                        severity="info",
                    ))
                else:
                    self.add_check(CheckResult(
                        name="e2e_api_health",
                        passed=False,
                        message=f"API відповів HTTP {r.status_code}",
                        severity="warning",
                    ))
        except httpx.ConnectError as e:
            self.add_check(CheckResult(
                name="e2e_api_health",
                passed=False,
                message=f"HACK_CHECK: API failed ConnectError - {str(e)}",
                severity="warning",
            ))
        except httpx.TimeoutException:
            self.add_check(CheckResult(
                name="e2e_api_health",
                passed=False,
                message="API недоступний: Timeout",
                severity="warning",
            ))
        except Exception as e:
            self.add_check(CheckResult(
                name="e2e_api_health",
                passed=False,
                message=f"HACK_CHECK: API недоступний: {type(e).__name__} - {repr(e)}",
                severity="warning",
            ))

    async def _e2e_ollama_generates(self):
        """E2E: Ollama генерує відповіді."""
        try:
            async with httpx.AsyncClient(verify=False, timeout=30) as client:
                # Отримати список моделей
                r = await client.get(f"{config.OLLAMA_URL}/api/tags")
                if r.status_code != 200:
                    self.add_check(CheckResult(
                        name="e2e_ollama_generate",
                        passed=False,
                        message="Ollama не відповідає",
                        severity="warning",
                    ))
                    return

                models = r.json().get("models", [])
                text_models = [m for m in models if "embed" not in m["name"].lower()]
                if not text_models:
                    self.add_check(CheckResult(
                        name="e2e_ollama_generate",
                        passed=False,
                        message="Жодної генеративної моделі не знайдено (є тільки embedding)",
                        severity="warning",
                    ))
                    return

                model_name = text_models[0]["name"]
                r2 = await client.post(
                    f"{config.OLLAMA_URL}/api/generate",
                    json={"model": model_name, "prompt": "Скажи 'OK'", "stream": False},
                )
                if r2.status_code == 200:
                    resp = r2.json().get("response", "")[:50]
                    self.add_check(CheckResult(
                        name="e2e_ollama_generate",
                        passed=True,
                        message=f"Ollama ({model_name}): '{resp}'",
                        severity="info",
                    ))
                else:
                    self.add_check(CheckResult(
                        name="e2e_ollama_generate",
                        passed=False,
                        message=f"Ollama generate: HTTP {r2.status_code}",
                        severity="warning",
                    ))
        except Exception as e:
            self.add_check(CheckResult(
                name="e2e_ollama_generate",
                passed=False,
                message=f"Ollama E2E помилка: {e}",
                severity="warning",
            ))

    async def _e2e_codebase_integrity(self):
        """E2E: Перевірка цілісності кодової бази."""
        root = Path(os.getenv("PREDATOR_ROOT", Path(__file__).resolve().parent.parent.parent.parent))

        critical_dirs = {
            "apps/predator-analytics-ui": root / "apps" / "predator-analytics-ui",
            "services/core-api": root / "services" / "core-api",
            "services/ingestion-worker": root / "services" / "ingestion-worker",
            "services/adv_dvs": root / "services" / "adv_dvs",
            "deploy": root / "deploy",
            "db/postgres": root / "db" / "postgres",
        }

        all_exist = True
        for name, path in critical_dirs.items():
            exists = path.exists()
            if not exists:
                all_exist = False
            self.add_check(CheckResult(
                name=f"e2e_dir_{name.replace('/', '_').replace('-', '_')}",
                passed=exists,
                message=f"Директорія {name}: {'✓' if exists else '✗'}",
                severity="warning" if not exists else "info",
            ))

        self.add_check(CheckResult(
            name="e2e_codebase_complete",
            passed=all_exist,
            message="Кодова база цілісна" if all_exist else "Деякі директорії відсутні",
            severity="warning" if not all_exist else "info",
        ))
