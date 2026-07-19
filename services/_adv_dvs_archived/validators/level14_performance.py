import os
"""
Рівень 14: Перевірка продуктивності.
Stress/load/soak/spike тести, CPU/RAM, затримки API, швидкість пошуку.
"""
import asyncio
import time
import httpx
from .base import BaseValidator, CheckResult
from .. import config
TARGET_HOST = os.getenv("TARGET_HOST", "localhost")


class PerformanceValidator(BaseValidator):
    def __init__(self):
        super().__init__(
            name="level14_performance",
            description="Продуктивність: stress/load тести, затримки API, ресурси",
        )

    async def _run_validation(self):
        # 1. Перевірка ресурсів системи
        await self._check_system_resources()
        # 2. Load тест Frontend
        await self._load_test_frontend()
        # 3. Load тест API (якщо доступний)
        await self._load_test_api()
        # 4. Перевірка затримки Ollama
        await self._check_ollama_latency()

    async def _check_system_resources(self):
        """Перевірка CPU/RAM через system commands."""
        try:
            # macOS: sysctl + vm_stat
            proc = await asyncio.create_subprocess_exec(
                "sysctl", "-n", "hw.memsize",
                stdout=asyncio.subprocess.PIPE,
            )
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=3)
            total_ram_gb = int(stdout.decode().strip()) / (1024**3)

            proc2 = await asyncio.create_subprocess_exec(
                "sysctl", "-n", "hw.ncpu",
                stdout=asyncio.subprocess.PIPE,
            )
            stdout2, _ = await asyncio.wait_for(proc2.communicate(), timeout=3)
            cpus = int(stdout2.decode().strip())

            self.add_check(CheckResult(
                name="system_resources",
                passed=True,
                message=f"RAM: {total_ram_gb:.0f} ГБ, CPU: {cpus} ядер",
                severity="info",
                details={"ram_gb": total_ram_gb, "cpus": cpus},
            ))
        except Exception as e:
            self.add_check(CheckResult(
                name="system_resources",
                passed=False,
                message=f"Не вдалося перевірити ресурси: {e}",
                severity="info",
            ))

    async def _load_test_frontend(self):
        """Простий load тест Frontend (10 паралельних запитів)."""
        url = config.FRONTEND_URL
        n_requests = 10
        try:
            async with httpx.AsyncClient(verify=False, timeout=10) as client:
                start = time.time()
                tasks = [client.get(url) for _ in range(n_requests)]
                results = await asyncio.gather(*tasks, return_exceptions=True)
                elapsed = time.time() - start

                success = sum(1 for r in results if not isinstance(r, Exception) and r.status_code == 200)
                avg_latency = (elapsed / n_requests) * 1000

                self.add_check(CheckResult(
                    name="load_frontend",
                    passed=success == n_requests,
                    message=f"Frontend: {success}/{n_requests} OK, avg {avg_latency:.0f}мс, total {elapsed:.1f}с",
                    severity="warning" if success < n_requests else "info",
                    latency_ms=avg_latency,
                    details={"success": success, "total": n_requests, "elapsed_s": round(elapsed, 2)},
                ))
        except Exception as e:
            self.add_check(CheckResult(
                name="load_frontend",
                passed=False,
                message=f"Load тест frontend: {e}",
                severity="warning",
            ))

    async def _load_test_api(self):
        """Load тест API."""
        url = f"{config.CORE_API_URL}/api/v1/health"
        n_requests = 10
        try:
            async with httpx.AsyncClient(verify=False, timeout=10) as client:
                start = time.time()
                tasks = [client.get(url) for _ in range(n_requests)]
                results = await asyncio.gather(*tasks, return_exceptions=True)
                elapsed = time.time() - start

                success = sum(1 for r in results if not isinstance(r, Exception) and r.status_code == 200)

                self.add_check(CheckResult(
                    name="load_api",
                    passed=success == n_requests,
                    message=f"API: {success}/{n_requests} OK за {elapsed:.1f}с"
                            if success > 0 else "API не доступний для load тесту",
                    severity="warning" if success == 0 else "info",
                    details={"success": success, "total": n_requests},
                ))
        except Exception as e:
            self.add_check(CheckResult(
                name="load_api",
                passed=False,
                message=f"API load тест: {e}",
                severity="warning",
            ))

    async def _check_ollama_latency(self):
        """Вимір затримки Ollama."""
        try:
            start = time.time()
            async with httpx.AsyncClient(verify=False, timeout=5) as client:
                r = await client.get(config.OLLAMA_URL)
                latency = (time.time() - start) * 1000
                self.add_check(CheckResult(
                    name="ollama_latency",
                    passed=latency < 1000,
                    message=f"Ollama затримка: {latency:.0f}мс",
                    severity="info",
                    latency_ms=latency,
                ))
        except Exception:
            self.add_check(CheckResult(
                name="ollama_latency",
                passed=False,
                message="Ollama не доступна для виміру затримки",
                severity="warning",
            ))
