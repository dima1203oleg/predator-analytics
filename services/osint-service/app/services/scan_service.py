"""Scan Service — координація OSINT сканувань."""
import asyncio
import logging
from datetime import datetime, UTC
from typing import Any
from uuid import UUID

import redis.asyncio as redis

from app.config import get_settings
from app.models import (
    ScanStatus,
    ScanProgress,
    DomainScanResult,
    PersonSearchResult,
    CompanyInvestigationResult,
    FileAnalysisResult,
    OSINTFinding,
)
from app.tools import get_tool_registry, ToolStatus

logger = logging.getLogger(__name__)


class ScanService:
    """Сервіс для координації OSINT сканувань."""

    def __init__(self):
        """Ініціалізація сервісу."""
        self.settings = get_settings()
        self.registry = get_tool_registry()
        self._redis: redis.Redis | None = None

    async def _get_redis(self) -> redis.Redis:
        """Отримання Redis клієнта."""
        if self._redis is None:
            self._redis = redis.from_url(self.settings.REDIS_URL)
        return self._redis

    async def _save_progress(self, scan_id: str, progress: dict[str, Any]):
        """Збереження прогресу в Redis."""
        r = await self._get_redis()
        await r.hset(f"osint:scan:{scan_id}", mapping={
            "status": progress.get("status", "running"),
            "progress_pct": str(progress.get("progress_pct", 0)),
            "current_tool": progress.get("current_tool", ""),
            "findings_count": str(progress.get("findings_count", 0)),
            "updated_at": datetime.now(UTC).isoformat(),
        })
        await r.expire(f"osint:scan:{scan_id}", 86400)  # 24 години

    async def _save_result(self, scan_id: str, result: dict[str, Any]):
        """Збереження результату в Redis."""
        import json
        r = await self._get_redis()
        await r.set(f"osint:result:{scan_id}", json.dumps(result, default=str))
        await r.expire(f"osint:result:{scan_id}", 86400 * 7)  # 7 днів

    async def get_scan_progress(self, scan_id: str) -> ScanProgress | None:
        """Отримання прогресу сканування."""
        r = await self._get_redis()
        data = await r.hgetall(f"osint:scan:{scan_id}")

        if not data:
            return None

        return ScanProgress(
            scan_id=UUID(scan_id),
            status=ScanStatus(data.get(b"status", b"queued").decode()),
            progress_pct=float(data.get(b"progress_pct", b"0").decode()),
            current_tool=data.get(b"current_tool", b"").decode() or None,
            findings_count=int(data.get(b"findings_count", b"0").decode()),
        )

    async def get_scan_result(self, scan_id: str) -> dict[str, Any] | None:
        """Отримання результату сканування."""
        import json
        r = await self._get_redis()
        data = await r.get(f"osint:result:{scan_id}")

        if not data:
            return None

        return json.loads(data)

    async def cancel_scan(self, scan_id: str) -> bool:
        """Скасування сканування."""
        r = await self._get_redis()
        exists = await r.exists(f"osint:scan:{scan_id}")

        if not exists:
            return False

        await r.hset(f"osint:scan:{scan_id}", "status", "cancelled")
        return True

    # ======================== DOMAIN SCAN ========================

    async def run_domain_scan(
        self,
        scan_id: str,
        domain: str,
        tools: list[str] | None = None,
        depth: int = 2,
        options: dict[str, Any] | None = None,
    ):
        """Запуск сканування домену."""
        options = options or {}
        start_time = datetime.now(UTC)

        await self._save_progress(scan_id, {
            "status": "running",
            "progress_pct": 0,
            "current_tool": "initializing",
        })

        # Визначаємо інструменти
        if tools:
            tool_list = [self.registry.get(t) for t in tools if self.registry.get(t)]
        else:
            tool_list = self.registry.get_by_target("domain")

        tool_list = [t for t in tool_list if t]
        total_tools = len(tool_list)

        # Збираємо результати
        all_subdomains = []
        all_emails = set()
        all_dns_records = []
        all_ips = set()
        all_findings = []
        tools_used = []
        errors = []

        for i, tool in enumerate(tool_list):
            # Перевіряємо чи не скасовано
            progress = await self.get_scan_progress(scan_id)
            if progress and progress.status == ScanStatus.CANCELLED:
                break

            await self._save_progress(scan_id, {
                "status": "running",
                "progress_pct": (i / total_tools) * 100,
                "current_tool": tool.name,
                "findings_count": len(all_findings),
            })

            # Запускаємо інструмент
            try:
                result = await tool.run_with_timeout(domain, options)
                tools_used.append(tool.name)

                if result.status in (ToolStatus.SUCCESS, ToolStatus.PARTIAL):
                    # Збираємо дані
                    data = result.data

                    if "subdomains" in data:
                        for sub in data["subdomains"]:
                            if sub not in all_subdomains:
                                all_subdomains.append(sub)

                    if "emails" in data:
                        all_emails.update(data["emails"])

                    if "dns_records" in data:
                        all_dns_records.extend(data["dns_records"])

                    if "ip_addresses" in data:
                        all_ips.update(data["ip_addresses"])
                    if "ips" in data:
                        all_ips.update(data["ips"])

                    # Findings
                    for finding in result.findings:
                        finding["scan_id"] = scan_id
                        all_findings.append(finding)

                if result.errors:
                    errors.extend(result.errors)

            except Exception as e:
                logger.error(f"Tool {tool.name} failed: {e}")
                errors.append(f"{tool.name}: {str(e)}")

        # Формуємо результат
        duration = (datetime.now(UTC) - start_time).total_seconds()

        result = DomainScanResult(
            scan_id=UUID(scan_id),
            status=ScanStatus.COMPLETED,
            domain=domain,
            subdomains=all_subdomains,
            dns_records=all_dns_records,
            emails=list(all_emails),
            ip_addresses=list(all_ips),
            findings=[OSINTFinding(
                id=UUID(f.get("id", scan_id)),
                finding_type=f["type"],
                source_tool=f["source"],
                confidence=f.get("confidence", 0.5),
                data=f.get("metadata", {}),
                entity_ueid=f.get("entity_ueid"),
                created_at=datetime.now(UTC),
            ) for f in all_findings[:100]],  # Обмежуємо
            duration_seconds=duration,
            tools_used=tools_used,
        )

        await self._save_result(scan_id, result.model_dump())
        await self._save_progress(scan_id, {
            "status": "completed",
            "progress_pct": 100,
            "findings_count": len(all_findings),
        })

        return result

    # ======================== PERSON SEARCH ========================

    async def run_person_search(
        self,
        search_id: str,
        username: str | None = None,
        email: str | None = None,
        phone: str | None = None,
        full_name: str | None = None,
        tools: list[str] | None = None,
    ):
        """Запуск пошуку особи."""
        start_time = datetime.now(UTC)

        await self._save_progress(search_id, {
            "status": "running",
            "progress_pct": 0,
        })

        # Визначаємо інструменти
        if tools:
            tool_list = [self.registry.get(t) for t in tools if self.registry.get(t)]
        else:
            tool_list = self.registry.get_by_target("username")

        tool_list = [t for t in tool_list if t]
        total_tools = len(tool_list)

        all_profiles = []
        all_emails = set()
        all_findings = []
        tools_used = []

        for i, tool in enumerate(tool_list):
            await self._save_progress(search_id, {
                "status": "running",
                "progress_pct": (i / total_tools) * 100,
                "current_tool": tool.name,
                "findings_count": len(all_findings),
            })

            try:
                # Запускаємо з username
                if username:
                    result = await tool.run_with_timeout(username)
                    tools_used.append(tool.name)

                    if result.status in (ToolStatus.SUCCESS, ToolStatus.PARTIAL):
                        if "profiles" in result.data:
                            all_profiles.extend(result.data["profiles"])

                        all_findings.extend(result.findings)

            except Exception as e:
                logger.error(f"Tool {tool.name} failed: {e}")

        duration = (datetime.now(UTC) - start_time).total_seconds()

        result = PersonSearchResult(
            search_id=UUID(search_id),
            status=ScanStatus.COMPLETED,
            query={
                "username": username or "",
                "email": email or "",
                "phone": phone or "",
                "full_name": full_name or "",
            },
            profiles=all_profiles,
            emails=list(all_emails),
            findings=[OSINTFinding(
                id=UUID(search_id),
                finding_type=f["type"],
                source_tool=f["source"],
                confidence=f.get("confidence", 0.5),
                data=f.get("metadata", {}),
                created_at=datetime.now(UTC),
            ) for f in all_findings[:100]],
            duration_seconds=duration,
            tools_used=tools_used,
        )

        await self._save_result(search_id, result.model_dump())
        await self._save_progress(search_id, {
            "status": "completed",
            "progress_pct": 100,
            "findings_count": len(all_findings),
        })

        return result

    # ======================== COMPANY INVESTIGATION ========================

    async def run_company_investigation(
        self,
        investigation_id: str,
        company_name: str | None = None,
        edrpou: str | None = None,
        domain: str | None = None,
        country: str = "UA",
        options: dict[str, Any] | None = None,
    ):
        """Запуск розслідування компанії."""
        start_time = datetime.now(UTC)
        options = options or {}

        await self._save_progress(investigation_id, {
            "status": "running",
            "progress_pct": 0,
        })

        company_data = {
            "name": company_name,
            "edrpou": edrpou,
            "country": country,
        }
        all_findings = []
        tools_used = []
        domains_found = []

        # Якщо є домен — скануємо його
        if domain:
            domain_tools = self.registry.get_by_target("domain")
            for tool in domain_tools[:3]:  # Обмежуємо
                try:
                    result = await tool.run_with_timeout(domain)
                    tools_used.append(tool.name)

                    if result.status in (ToolStatus.SUCCESS, ToolStatus.PARTIAL):
                        all_findings.extend(result.findings)
                        if "emails" in result.data:
                            company_data["emails"] = result.data["emails"]

                except Exception as e:
                    logger.error(f"Tool {tool.name} failed: {e}")

            domains_found.append(domain)

        duration = (datetime.now(UTC) - start_time).total_seconds()

        result = CompanyInvestigationResult(
            investigation_id=UUID(investigation_id),
            status=ScanStatus.COMPLETED,
            company=company_data,
            domains=domains_found,
            findings=[OSINTFinding(
                id=UUID(investigation_id),
                finding_type=f["type"],
                source_tool=f["source"],
                confidence=f.get("confidence", 0.5),
                data=f.get("metadata", {}),
                created_at=datetime.now(UTC),
            ) for f in all_findings[:100]],
            duration_seconds=duration,
            tools_used=tools_used,
        )

        await self._save_result(investigation_id, result.model_dump())
        await self._save_progress(investigation_id, {
            "status": "completed",
            "progress_pct": 100,
            "findings_count": len(all_findings),
        })

        return result

    # ======================== FILE ANALYSIS ========================

    async def run_file_analysis(
        self,
        analysis_id: str,
        file_path: str,
        file_name: str,
        file_size: int,
        options: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Аналіз файлу."""
        options = options or {}

        exiftool = self.registry.get("exiftool")
        if not exiftool:
            return {
                "analysis_id": analysis_id,
                "status": "failed",
                "error": "ExifTool не доступний",
            }

        result = await exiftool.run_with_timeout(file_path, options)

        if result.status == ToolStatus.SUCCESS:
            return FileAnalysisResult(
                analysis_id=UUID(analysis_id),
                status=ScanStatus.COMPLETED,
                file_name=file_name,
                file_type=result.data.get("file_type", "unknown"),
                file_size_bytes=file_size,
                metadata=result.data.get("metadata", {}),
                geolocation=result.data.get("geolocation"),
                author=result.data.get("author"),
                creation_date=result.data.get("creation_date"),
                modification_date=result.data.get("modification_date"),
                software=result.data.get("software"),
                findings=[OSINTFinding(
                    id=UUID(analysis_id),
                    finding_type=f["type"],
                    source_tool=f["source"],
                    confidence=f.get("confidence", 0.5),
                    data=f.get("metadata", {}),
                    created_at=datetime.now(UTC),
                ) for f in result.findings],
            ).model_dump()

        return {
            "analysis_id": analysis_id,
            "status": "failed",
            "errors": result.errors,
        }
