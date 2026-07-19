import os
"""
Базовий клас валідатора ADV-DVS v61.0-ELITE.
Надає єдиний інтерфейс для всіх рівнів перевірки.
"""
import asyncio
import logging
import time
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, field

import httpx
TARGET_HOST = os.getenv("TARGET_HOST", "localhost")

logger = logging.getLogger(__name__)


@dataclass
class CheckResult:
    """Результат однієї перевірки."""
    name: str
    passed: bool
    message: str
    severity: str = "info"  # info | warning | critical
    latency_ms: float = 0.0
    details: Dict[str, Any] = field(default_factory=dict)


class BaseValidator:
    """Абстрактний валідатор. Кожен рівень наслідує цей клас."""

    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        self.checks: List[CheckResult] = []

    async def validate(self) -> Dict[str, Any]:
        """Головний метод — запускає всі перевірки рівня."""
        logger.info(f"{'='*60}")
        logger.info(f"🚀 Рівень: {self.name} — {self.description}")
        logger.info(f"{'='*60}")
        start = time.time()
        self.checks = []

        try:
            await self._run_validation()
        except Exception as e:
            logger.error(f"❌ Фатальна помилка валідатора {self.name}: {e}")
            self.checks.append(CheckResult(
                name="validator_crash",
                passed=False,
                message=f"Валідатор впав: {e}",
                severity="critical",
            ))

        elapsed = time.time() - start

        # Підрахунок
        total = len(self.checks)
        passed = sum(1 for c in self.checks if c.passed)
        failed = total - passed
        critical_failures = [c for c in self.checks if not c.passed and c.severity == "critical"]

        if total == 0:
            status = "skip"
        elif critical_failures:
            status = "fail"
        elif failed > 0:
            status = "warning"
        else:
            status = "pass"

        result = {
            "name": self.name,
            "description": self.description,
            "status": status,
            "total_checks": total,
            "passed": passed,
            "failed": failed,
            "elapsed_seconds": round(elapsed, 2),
            "details": {c.name: {
                "passed": c.passed,
                "message": c.message,
                "severity": c.severity,
                "latency_ms": round(c.latency_ms, 1),
                **c.details,
            } for c in self.checks},
            "errors": [c.message for c in self.checks if not c.passed],
        }

        icon = "✅" if status == "pass" else ("⚠️" if status == "warning" else "❌")
        logger.info(f"{icon} {self.name}: {passed}/{total} перевірок пройдено ({elapsed:.1f}с)")
        return result

    async def _run_validation(self):
        """Підкласи реалізують конкретні перевірки тут."""
        raise NotImplementedError

    # ─── Утилітні методи ──────────────────────────────────────────────────

    def add_check(self, result: CheckResult):
        """Додати результат перевірки."""
        icon = "✅" if result.passed else "❌"
        logger.info(f"  {icon} {result.name}: {result.message}")
        self.checks.append(result)

    async def http_check(
        self,
        name: str,
        url: str,
        timeout: float = 5.0,
        expected_status: int = 200,
        severity: str = "critical",
        verify_ssl: bool = False,
    ) -> CheckResult:
        """HTTP GET перевірка з виміром затримки."""
        start = time.time()
        try:
            async with httpx.AsyncClient(verify=verify_ssl, timeout=timeout) as client:
                resp = await client.get(url)
                latency = (time.time() - start) * 1000
                passed = resp.status_code == expected_status
                result = CheckResult(
                    name=name,
                    passed=passed,
                    message=f"HTTP {resp.status_code} ({latency:.0f}мс)" if passed
                            else f"Очікувався {expected_status}, отримано {resp.status_code}",
                    severity=severity,
                    latency_ms=latency,
                    details={"url": url, "status_code": resp.status_code},
                )
        except httpx.ConnectError:
            result = CheckResult(
                name=name, passed=False,
                message=f"Не вдалося з'єднатися з {url}",
                severity=severity, details={"url": url},
            )
        except httpx.TimeoutException:
            result = CheckResult(
                name=name, passed=False,
                message=f"Таймаут з'єднання ({timeout}с) для {url}",
                severity=severity, details={"url": url},
            )
        except Exception as e:
            result = CheckResult(
                name=name, passed=False,
                message=f"Помилка: {e}",
                severity=severity, details={"url": url, "error": str(e)},
            )
        self.add_check(result)
        return result

    async def tcp_check(
        self,
        name: str,
        host: str,
        port: int,
        timeout: float = 3.0,
        severity: str = "critical",
    ) -> CheckResult:
        """TCP порт перевірка."""
        start = time.time()
        try:
            reader, writer = await asyncio.wait_for(
                asyncio.open_connection(host, port), timeout=timeout
            )
            latency = (time.time() - start) * 1000
            writer.close()
            await writer.wait_closed()
            result = CheckResult(
                name=name, passed=True,
                message=f"Порт {port} доступний ({latency:.0f}мс)",
                severity=severity, latency_ms=latency,
                details={"host": host, "port": port},
            )
        except (asyncio.TimeoutError, OSError, ConnectionRefusedError) as e:
            result = CheckResult(
                name=name, passed=False,
                message=f"Порт {host}:{port} недоступний: {type(e).__name__}",
                severity=severity,
                details={"host": host, "port": port},
            )
        self.add_check(result)
        return result

    async def http_json_check(
        self,
        name: str,
        url: str,
        timeout: float = 5.0,
        severity: str = "critical",
        verify_ssl: bool = False,
    ) -> Tuple[CheckResult, Optional[dict]]:
        """HTTP GET → JSON parse."""
        start = time.time()
        try:
            async with httpx.AsyncClient(verify=verify_ssl, timeout=timeout) as client:
                resp = await client.get(url)
                latency = (time.time() - start) * 1000
                if resp.status_code != 200:
                    result = CheckResult(
                        name=name, passed=False,
                        message=f"HTTP {resp.status_code}",
                        severity=severity, latency_ms=latency,
                        details={"url": url},
                    )
                    self.add_check(result)
                    return result, None
                data = resp.json()
                result = CheckResult(
                    name=name, passed=True,
                    message=f"OK ({latency:.0f}мс)",
                    severity=severity, latency_ms=latency,
                    details={"url": url},
                )
                self.add_check(result)
                return result, data
        except Exception as e:
            result = CheckResult(
                name=name, passed=False,
                message=f"Помилка: {e}",
                severity=severity,
                details={"url": url, "error": str(e)},
            )
            self.add_check(result)
            return result, None
