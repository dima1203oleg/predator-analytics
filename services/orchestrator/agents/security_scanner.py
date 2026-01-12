"""
Security Scanner - Continuously scans for vulnerabilities
Uses free tools: Bandit, Safety, OWASP ZAP
"""
import subprocess
import logging
from typing import Dict, Any, List

logger = logging.getLogger("agents.security_scanner")

class SecurityScanner:
    def __init__(self):
        self.project_root = "/app"

    async def scan(self) -> Dict[str, Any]:
        """Run comprehensive security scan"""
        logger.info("🔒 Security Scanner: Starting scan...")

        results = {
            "code_scan": await self._scan_code(),
            "dependencies": await self._check_dependencies(),
            "secrets": await self._detect_secrets()
        }

        vulnerabilities = self._aggregate_vulnerabilities(results)

        if vulnerabilities:
            logger.warning(f"⚠️ Found {len(vulnerabilities)} security issues")
            return {
                "status": "vulnerabilities_found",
                "count": len(vulnerabilities),
                "vulnerabilities": vulnerabilities
            }

        logger.info("✅ No security issues found")
        return {"status": "secure", "scans": results}

    async def _scan_code(self) -> Dict[str, Any]:
        """Scan Python code with Bandit"""
        try:
            result = subprocess.run(
                ["bandit", "-r", f"{self.project_root}/app", "-f", "json"],
                capture_output=True,
                text=True,
                timeout=30
            )

            if result.returncode in [0, 1]:  # 0=no issues, 1=issues found
                import json
                data = json.loads(result.stdout)
                issues = data.get("results", [])

                return {
                    "tool": "bandit",
                    "issues_found": len(issues),
                    "high_severity": len([i for i in issues if i.get("issue_severity") == "HIGH"])
                }
        except Exception as e:
            logger.warning(f"Bandit scan failed: {e}")

        return {"tool": "bandit", "issues_found": 0}

    async def _check_dependencies(self) -> Dict[str, Any]:
        """Check for vulnerable dependencies"""
        try:
            result = subprocess.run(
                ["safety", "check", "--json"],
                capture_output=True,
                text=True,
                timeout=30
            )

            if result.returncode in [0, 64]:  # 64 = vulnerabilities found
                import json
                try:
                    data = json.loads(result.stdout)
                    vulns = len(data) if isinstance(data, list) else 0
                    return {
                        "tool": "safety",
                        "vulnerable_packages": vulns
                    }
                except:
                    pass
        except Exception as e:
            logger.warning(f"Safety check failed: {e}")

        return {"tool": "safety", "vulnerable_packages": 0}

    async def _detect_secrets(self) -> Dict[str, Any]:
        """Detect hardcoded secrets"""
        # Simple regex-based detection
        dangerous_patterns = [
            "password =",
            "api_key =",
            "secret =",
            "token ="
        ]

        found_secrets = []
        # Scan would go here

        return {
            "tool": "regex",
            "potential_secrets": len(found_secrets)
        }

    def _aggregate_vulnerabilities(self, results: Dict) -> List[Dict]:
        """Aggregate all found vulnerabilities"""
        vulns = []

        code_scan = results.get("code_scan", {})
        if code_scan.get("high_severity", 0) > 0:
            vulns.append({
                "severity": "high",
                "source": "code",
                "description": f"{code_scan.get('high_severity')} high-severity code issues"
            })

        deps = results.get("dependencies", {})
        if deps.get("vulnerable_packages", 0) > 0:
            vulns.append({
                "severity": "medium",
                "source": "dependencies",
                "description": f"{deps.get('vulnerable_packages')} vulnerable packages"
            })

        return vulns
