"""Digital Forensics — Інструменти для OSINT-розслідувань.

Інструменти:
- SpiderFoot: Модульний фреймворк (200+ джерел)
- Hunchly: Система документування розслідувань
- Metagoofil: Видобування метаданих з документів
"""
import logging
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import Enum
from typing import Any

logger = logging.getLogger(__name__)


class ScanType(str, Enum):
    """Типи сканування SpiderFoot."""
    PASSIVE = "passive"  # Тільки пасивний збір
    ACTIVE = "active"  # Активне сканування
    FULL = "full"  # Повне сканування


@dataclass
class ForensicsResult:
    """Результат форензік-аналізу."""
    tool_name: str
    success: bool
    data: dict[str, Any] = field(default_factory=dict)
    artifacts: list[dict] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
    response_time_ms: float = 0.0


class SpiderFootClient:
    """SpiderFoot — Модульний OSINT-фреймворк.
    
    Автоматизує збір даних з 200+ джерел:
    - DNS, WHOIS, SSL сертифікати
    - Соціальні мережі
    - Пошук вразливостей
    - Dark Web моніторинг
    - Репутаційні бази
    
    GitHub: smicallef/spiderfoot
    """

    name = "spiderfoot"
    description = "Модульний OSINT-фреймворк (200+ джерел)"

    # Категорії модулів
    MODULES = {
        "dns": [
            "sfp_dnsresolve", "sfp_dnsbrute", "sfp_dnszonexfer",
            "sfp_dnsdumpster", "sfp_securitytrails",
        ],
        "whois": [
            "sfp_whois", "sfp_whoisology", "sfp_domaintools",
        ],
        "social": [
            "sfp_twitter", "sfp_linkedin", "sfp_instagram",
            "sfp_facebook", "sfp_github",
        ],
        "email": [
            "sfp_hunter", "sfp_emailformat", "sfp_hibp",
            "sfp_emailrep",
        ],
        "threat_intel": [
            "sfp_virustotal", "sfp_shodan", "sfp_censys",
            "sfp_greynoise", "sfp_abuseipdb",
        ],
        "darkweb": [
            "sfp_onionsearchengine", "sfp_ahmia", "sfp_torexits",
        ],
        "reputation": [
            "sfp_spamhaus", "sfp_barracuda", "sfp_sorbs",
        ],
    }

    def __init__(self, api_url: str = "http://localhost:5001"):
        self.api_url = api_url

    async def scan_domain(
        self,
        domain: str,
        scan_type: ScanType = ScanType.PASSIVE,
        modules: list[str] | None = None,
    ) -> ForensicsResult:
        """Сканування домену."""
        start_time = datetime.now(UTC)

        # Симуляція результатів SpiderFoot
        data = {
            "target": domain,
            "scan_type": scan_type.value,
            "scan_id": f"sf_{domain}_{int(start_time.timestamp())}",
            "status": "completed",
            "findings": {
                "dns": {
                    "a_records": ["93.184.216.34"],
                    "mx_records": ["mail.example.com"],
                    "ns_records": ["ns1.example.com", "ns2.example.com"],
                    "txt_records": ["v=spf1 include:_spf.google.com ~all"],
                    "subdomains": ["www", "mail", "api", "dev", "staging"],
                },
                "whois": {
                    "registrar": "GoDaddy",
                    "creation_date": "2010-01-15",
                    "expiration_date": "2025-01-15",
                    "registrant_org": "Example Corp",
                    "registrant_country": "US",
                    "name_servers": ["ns1.example.com", "ns2.example.com"],
                },
                "ssl": {
                    "issuer": "Let's Encrypt",
                    "valid_from": "2024-01-01",
                    "valid_to": "2024-04-01",
                    "subject_alt_names": ["example.com", "www.example.com"],
                },
                "emails_found": [
                    "admin@example.com",
                    "support@example.com",
                    "info@example.com",
                ],
                "technologies": [
                    {"name": "nginx", "version": "1.21"},
                    {"name": "PHP", "version": "8.1"},
                    {"name": "WordPress", "version": "6.4"},
                ],
                "vulnerabilities": [
                    {
                        "cve": "CVE-2024-1234",
                        "severity": "medium",
                        "description": "WordPress plugin vulnerability",
                    },
                ],
                "threat_intel": {
                    "virustotal_score": "0/90",
                    "shodan_ports": [80, 443, 22],
                    "abuse_reports": 0,
                },
                "social_presence": [
                    {"platform": "Twitter", "handle": "@example"},
                    {"platform": "LinkedIn", "url": "linkedin.com/company/example"},
                ],
            },
            "statistics": {
                "total_findings": 45,
                "modules_run": 25,
                "duration_seconds": 120,
            },
        }

        return ForensicsResult(
            tool_name=self.name,
            success=True,
            data=data,
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )

    async def scan_email(self, email: str) -> ForensicsResult:
        """Сканування email."""
        start_time = datetime.now(UTC)

        data = {
            "target": email,
            "target_type": "email",
            "findings": {
                "domain_info": {
                    "domain": email.split("@")[1],
                    "mx_valid": True,
                    "spf_valid": True,
                    "dmarc_valid": True,
                },
                "breaches": [
                    {"source": "LinkedIn2021", "date": "2021-06-22"},
                    {"source": "Adobe2013", "date": "2013-10-04"},
                ],
                "social_profiles": [
                    {"platform": "GitHub", "url": f"https://github.com/{email.split('@')[0]}"},
                    {"platform": "Gravatar", "exists": True},
                ],
                "reputation": {
                    "spam_score": 0,
                    "disposable": False,
                    "role_based": False,
                },
            },
        }

        return ForensicsResult(
            tool_name=self.name,
            success=True,
            data=data,
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )

    async def scan_ip(self, ip: str) -> ForensicsResult:
        """Сканування IP-адреси."""
        start_time = datetime.now(UTC)

        data = {
            "target": ip,
            "target_type": "ip",
            "findings": {
                "geolocation": {
                    "country": "Ukraine",
                    "city": "Kyiv",
                    "isp": "Ukrtelecom",
                    "asn": "AS6849",
                },
                "ports": [
                    {"port": 80, "service": "HTTP", "product": "nginx"},
                    {"port": 443, "service": "HTTPS", "product": "nginx"},
                    {"port": 22, "service": "SSH", "product": "OpenSSH"},
                ],
                "threat_intel": {
                    "malicious": False,
                    "tor_exit": False,
                    "proxy": False,
                    "vpn": False,
                    "abuse_reports": 0,
                },
                "reverse_dns": ["server1.example.com"],
                "ssl_certificates": [
                    {"domain": "example.com", "issuer": "Let's Encrypt"},
                ],
            },
        }

        return ForensicsResult(
            tool_name=self.name,
            success=True,
            data=data,
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )


class HunchlyClient:
    """Hunchly — Система документування розслідувань.
    
    Автоматично зберігає:
    - Кожну веб-сторінку
    - Скріншоти
    - Метадані
    - Часові мітки
    
    Критично важливо для юристів та комплаєнсу.
    """

    name = "hunchly"
    description = "Система документування OSINT-розслідувань"

    def __init__(self, case_id: str | None = None):
        self.case_id = case_id or f"case_{int(datetime.now(UTC).timestamp())}"
        self.artifacts: list[dict] = []

    async def capture_page(
        self,
        url: str,
        tags: list[str] | None = None,
        notes: str | None = None,
    ) -> ForensicsResult:
        """Захоплення веб-сторінки."""
        start_time = datetime.now(UTC)

        artifact = {
            "artifact_id": f"art_{len(self.artifacts) + 1}",
            "type": "webpage",
            "url": url,
            "captured_at": start_time.isoformat(),
            "tags": tags or [],
            "notes": notes,
            "metadata": {
                "title": f"Page from {url}",
                "content_type": "text/html",
                "size_bytes": 125000,
                "response_code": 200,
            },
            "screenshot": {
                "filename": f"screenshot_{len(self.artifacts) + 1}.png",
                "width": 1920,
                "height": 1080,
            },
            "hash": {
                "sha256": "abc123def456...",
                "md5": "xyz789...",
            },
        }

        self.artifacts.append(artifact)

        return ForensicsResult(
            tool_name=self.name,
            success=True,
            data=artifact,
            artifacts=[artifact],
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )

    async def export_case(self, format: str = "pdf") -> ForensicsResult:
        """Експорт справи."""
        start_time = datetime.now(UTC)

        data = {
            "case_id": self.case_id,
            "export_format": format,
            "artifacts_count": len(self.artifacts),
            "export_file": f"{self.case_id}_export.{format}",
            "generated_at": start_time.isoformat(),
            "summary": {
                "total_pages": len([a for a in self.artifacts if a["type"] == "webpage"]),
                "total_screenshots": len([a for a in self.artifacts if "screenshot" in a]),
                "unique_domains": len(set(a.get("url", "").split("/")[2] for a in self.artifacts if a.get("url"))),
            },
        }

        return ForensicsResult(
            tool_name=self.name,
            success=True,
            data=data,
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )

    async def create_timeline(self) -> ForensicsResult:
        """Створення таймлайну розслідування."""
        start_time = datetime.now(UTC)

        timeline = sorted(self.artifacts, key=lambda x: x.get("captured_at", ""))

        data = {
            "case_id": self.case_id,
            "timeline": [
                {
                    "timestamp": a.get("captured_at"),
                    "type": a.get("type"),
                    "url": a.get("url"),
                    "tags": a.get("tags", []),
                }
                for a in timeline
            ],
            "duration": {
                "start": timeline[0].get("captured_at") if timeline else None,
                "end": timeline[-1].get("captured_at") if timeline else None,
            },
        }

        return ForensicsResult(
            tool_name=self.name,
            success=True,
            data=data,
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )


class MetagoofilTool:
    """Metagoofil — Видобування метаданих з публічних документів.
    
    Аналізує PDF, DOC, XLS, PPT та інші формати.
    Знаходить:
    - Імена авторів/співробітників
    - Версії ПЗ
    - Приховані шляхи на серверах
    - Email-адреси
    - Дати створення/модифікації
    """

    name = "metagoofil"
    description = "Видобування метаданих з документів"

    SUPPORTED_FORMATS = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "odt", "ods"]

    async def analyze_domain(
        self,
        domain: str,
        file_types: list[str] | None = None,
        limit: int = 100,
    ) -> ForensicsResult:
        """Пошук та аналіз документів домену."""
        start_time = datetime.now(UTC)

        file_types = file_types or ["pdf", "doc", "docx", "xls", "xlsx"]

        # Симуляція знайдених документів
        documents = [
            {
                "filename": "annual_report_2023.pdf",
                "url": f"https://{domain}/docs/annual_report_2023.pdf",
                "size_bytes": 2500000,
                "metadata": {
                    "author": "Іван Петренко",
                    "creator": "Microsoft Word 2019",
                    "creation_date": "2024-01-15",
                    "modification_date": "2024-01-20",
                    "producer": "Adobe PDF Library 15.0",
                    "title": "Річний звіт 2023",
                    "keywords": ["фінанси", "звіт", "2023"],
                },
            },
            {
                "filename": "presentation_q4.pptx",
                "url": f"https://{domain}/docs/presentation_q4.pptx",
                "size_bytes": 5000000,
                "metadata": {
                    "author": "Марія Коваленко",
                    "creator": "Microsoft PowerPoint 2021",
                    "creation_date": "2023-12-01",
                    "last_modified_by": "Олександр Шевченко",
                    "company": "ТОВ Компанія",
                },
            },
            {
                "filename": "budget_2024.xlsx",
                "url": f"https://{domain}/internal/budget_2024.xlsx",
                "size_bytes": 150000,
                "metadata": {
                    "author": "Фінансовий відділ",
                    "creator": "Microsoft Excel 2019",
                    "creation_date": "2023-11-15",
                    "internal_path": "C:\\Users\\finance\\Documents\\Budget\\",
                },
            },
        ]

        # Аналіз знайдених даних
        authors = list(set(d["metadata"].get("author", "") for d in documents if d["metadata"].get("author")))
        software = list(set(d["metadata"].get("creator", "") for d in documents if d["metadata"].get("creator")))
        internal_paths = [d["metadata"].get("internal_path") for d in documents if d["metadata"].get("internal_path")]

        data = {
            "domain": domain,
            "file_types_searched": file_types,
            "documents_found": len(documents),
            "documents": documents,
            "analysis": {
                "unique_authors": authors,
                "software_used": software,
                "internal_paths_leaked": internal_paths,
                "potential_employees": authors,
                "security_concerns": [
                    "Внутрішні шляхи файлової системи знайдено в метаданих",
                ] if internal_paths else [],
            },
            "statistics": {
                "total_documents": len(documents),
                "by_type": {
                    "pdf": len([d for d in documents if d["filename"].endswith(".pdf")]),
                    "office": len([d for d in documents if any(d["filename"].endswith(ext) for ext in [".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx"])]),
                },
            },
        }

        return ForensicsResult(
            tool_name=self.name,
            success=True,
            data=data,
            artifacts=documents,
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )

    async def analyze_file(self, file_path: str) -> ForensicsResult:
        """Аналіз конкретного файлу."""
        start_time = datetime.now(UTC)

        # Симуляція аналізу
        data = {
            "file_path": file_path,
            "metadata": {
                "author": "Невідомий автор",
                "creator": "Microsoft Office",
                "creation_date": "2024-01-01",
                "modification_date": "2024-06-15",
                "pages": 25,
                "words": 5000,
            },
            "embedded_objects": [],
            "links": [],
            "comments": [],
        }

        return ForensicsResult(
            tool_name=self.name,
            success=True,
            data=data,
            response_time_ms=(datetime.now(UTC) - start_time).total_seconds() * 1000,
        )
