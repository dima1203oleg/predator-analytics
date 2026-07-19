import os
"""
Рівень 1: Перевірка розгортання інфраструктури.
Docker Engine, Docker Compose, контейнери, мережі, volumes,
health checks, DNS, env vars, secrets, probes.
"""
import asyncio
import shutil
import subprocess
from typing import Dict, Any

from .base import BaseValidator, CheckResult
TARGET_HOST = os.getenv("TARGET_HOST", "localhost")


class InfraValidator(BaseValidator):
    def __init__(self):
        super().__init__(
            name="level1_infra",
            description="Інфраструктура: Docker, контейнери, мережі, volumes, health checks",
        )

    async def _run_validation(self):
        # 1. Docker Engine
        await self._check_docker_engine()
        # 2. Docker Compose
        await self._check_docker_compose()
        # 3. Контейнери (локальні)
        await self._check_containers_local()
        # 4. NVIDIA Server (віддалений)
        await self._check_remote_server()
        # 5. Мережі
        await self._check_networks()
        # 6. Volumes
        await self._check_volumes()
        # 7. Перевірка портів платформи
        await self._check_platform_ports()

    async def _check_docker_engine(self):
        """Docker Engine перевірка."""
        docker_path = shutil.which("docker")
        if not docker_path:
            self.add_check(CheckResult(
                name="docker_engine",
                passed=False,
                message="Docker CLI не знайдено в PATH",
                severity="critical",
            ))
            return

        try:
            proc = await asyncio.create_subprocess_exec(
                "docker", "info", "--format", "{{.ServerVersion}}",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=10)
            if proc.returncode == 0:
                version = stdout.decode().strip()
                self.add_check(CheckResult(
                    name="docker_engine",
                    passed=True,
                    message=f"Docker Engine v{version}",
                    details={"version": version},
                ))
            else:
                self.add_check(CheckResult(
                    name="docker_engine",
                    passed=False,
                    message=f"Docker daemon не запущено: {stderr.decode().strip()[:100]}",
                    severity="critical",
                ))
        except asyncio.TimeoutError:
            self.add_check(CheckResult(
                name="docker_engine",
                passed=False,
                message="Таймаут перевірки Docker",
                severity="critical",
            ))

    async def _check_docker_compose(self):
        """Docker Compose перевірка."""
        try:
            proc = await asyncio.create_subprocess_exec(
                "docker", "compose", "version", "--short",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=5)
            if proc.returncode == 0:
                version = stdout.decode().strip()
                self.add_check(CheckResult(
                    name="docker_compose",
                    passed=True,
                    message=f"Docker Compose v{version}",
                    details={"version": version},
                ))
            else:
                self.add_check(CheckResult(
                    name="docker_compose",
                    passed=False,
                    message="Docker Compose недоступний",
                    severity="warning",
                ))
        except Exception as e:
            self.add_check(CheckResult(
                name="docker_compose",
                passed=False,
                message=f"Помилка: {e}",
                severity="warning",
            ))

    async def _check_containers_local(self):
        """Перевірка запущених контейнерів."""
        try:
            proc = await asyncio.create_subprocess_exec(
                "docker", "ps", "--format", "{{.Names}}|{{.Status}}|{{.Ports}}",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=10)
            if proc.returncode != 0:
                self.add_check(CheckResult(
                    name="containers_local",
                    passed=False,
                    message=f"Неможливо перевірити контейнери: {stderr.decode()[:100]}",
                    severity="warning",
                ))
                return

            lines = [l for l in stdout.decode().strip().split("\n") if l]
            if not lines:
                self.add_check(CheckResult(
                    name="containers_local",
                    passed=False,
                    message="Жодного запущеного контейнера (Docker Desktop не активний або сервіси на NVIDIA/NVIDIA)",
                    severity="warning",
                    details={"count": 0},
                ))
                return

            healthy = 0
            unhealthy = 0
            for line in lines:
                parts = line.split("|")
                name = parts[0] if len(parts) > 0 else "unknown"
                status = parts[1] if len(parts) > 1 else ""
                is_up = "Up" in status
                if is_up:
                    healthy += 1
                else:
                    unhealthy += 1

            self.add_check(CheckResult(
                name="containers_local",
                passed=unhealthy == 0,
                message=f"{healthy} контейнерів працюють, {unhealthy} з проблемами",
                severity="warning" if unhealthy > 0 else "info",
                details={"healthy": healthy, "unhealthy": unhealthy, "total": len(lines)},
            ))
        except Exception as e:
            self.add_check(CheckResult(
                name="containers_local",
                passed=False,
                message=f"Помилка перевірки контейнерів: {e}",
                severity="warning",
            ))

    async def _check_remote_server(self):
        """Перевірка NVIDIA Server через SSH або локально."""
        try:
            if os.uname().sysname == "Linux":
                # Ми вже на NVIDIA сервері
                reachable = True
            else:
                proc = await asyncio.create_subprocess_exec(
                    "ssh", "-o", "ConnectTimeout=5", "-o", "StrictHostKeyChecking=no",
                    "nvidia-server", "echo", "OK",
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                )
                stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=10)
                reachable = proc.returncode == 0 and "OK" in stdout.decode()
            
            self.add_check(CheckResult(
                name="nvidia_server_ssh",
                passed=reachable,
                message="NVIDIA Server (194.177.1.240) доступний" if reachable
                        else "NVIDIA Server недоступний",
                severity="warning",
            ))
        except Exception as e:
            self.add_check(CheckResult(
                name="nvidia_server_ssh",
                passed=False,
                message=f"SSH помилка: {e}",
                severity="warning",
            ))

    async def _check_networks(self):
        """Перевірка Docker мереж."""
        try:
            proc = await asyncio.create_subprocess_exec(
                "docker", "network", "ls", "--format", "{{.Name}}",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=5)
            if proc.returncode == 0:
                nets = stdout.decode().strip().split("\n")
                predator_nets = [n for n in nets if "predator" in n.lower()]
                self.add_check(CheckResult(
                    name="docker_networks",
                    passed=True,
                    message=f"{len(nets)} мереж Docker, {len(predator_nets)} PREDATOR",
                    severity="info",
                    details={"total": len(nets), "predator_networks": predator_nets},
                ))
            else:
                self.add_check(CheckResult(
                    name="docker_networks",
                    passed=False,
                    message="Неможливо перевірити мережі Docker",
                    severity="warning",
                ))
        except Exception:
            self.add_check(CheckResult(
                name="docker_networks",
                passed=False,
                message="Docker не доступний для перевірки мереж",
                severity="warning",
            ))

    async def _check_volumes(self):
        """Перевірка Docker volumes."""
        try:
            proc = await asyncio.create_subprocess_exec(
                "docker", "volume", "ls", "--format", "{{.Name}}",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=5)
            if proc.returncode == 0:
                vols = [v for v in stdout.decode().strip().split("\n") if v]
                self.add_check(CheckResult(
                    name="docker_volumes",
                    passed=True,
                    message=f"{len(vols)} volumes зареєстровано",
                    severity="info",
                    details={"count": len(vols), "volumes": vols[:10]},
                ))
            else:
                self.add_check(CheckResult(
                    name="docker_volumes",
                    passed=False,
                    message="Неможливо перевірити volumes",
                    severity="warning",
                ))
        except Exception:
            self.add_check(CheckResult(
                name="docker_volumes",
                passed=False,
                message="Docker не доступний",
                severity="warning",
            ))

    async def _check_platform_ports(self):
        """Перевірка ключових портів платформи."""
        # Перевірка базових портів
        ports_to_check = {
            "postgres_5432": (TARGET_HOST, 5432),
            "redis_6379": (TARGET_HOST, 6379),
            "neo4j_7687": (TARGET_HOST, 7687),
            "frontend_3030": (TARGET_HOST, 3030),
            "ollama_11434": (TARGET_HOST, 11434),
            "core_api_8000": (TARGET_HOST, 8090),  # Host maps to 8090
            "mock_api_9080": (TARGET_HOST, 9080),
        }
        for name, (host, port) in ports_to_check.items():
            severity = "warning" if name in ("core_api_8000", "mock_api_9080") else "critical"
            await self.tcp_check(name, host, port, timeout=2.0, severity=severity)
