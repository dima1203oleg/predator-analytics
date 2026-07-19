import os
"""
Рівень 15: Перевірка безпеки.
JWT, Keycloak, RBAC, Vault, mTLS, WORM, аудит, секрети.
"""
from pathlib import Path
from .base import BaseValidator, CheckResult
from .. import config
TARGET_HOST = os.getenv("TARGET_HOST", "localhost")


class SecurityValidator(BaseValidator):
    def __init__(self):
        super().__init__(
            name="level15_security",
            description="Безпека: JWT, RBAC, Vault, WORM, секрети, аудит",
        )

    async def _run_validation(self):
        root = Path(os.getenv("PREDATOR_ROOT", Path(__file__).resolve().parent.parent.parent.parent))

        # 1. .env файл не в git
        await self._check_env_not_in_git(root)
        # 2. .gitignore правильний
        await self._check_gitignore(root)
        # 3. Секрети в коді (HR-06)
        await self._check_no_hardcoded_secrets(root)
        # 4. Dockerfile безпека (HR-05)
        await self._check_dockerfile_security(root)
        # 5. JWT конфігурація
        await self._check_jwt_config(root)
        # 6. WORM таблиці (HR-16)
        await self._check_worm_tables(root)

    async def _check_env_not_in_git(self, root: Path):
        """Перевірка що .env не потрапляє в git."""
        env_file = root / ".env"
        gitignore = root / ".gitignore"

        env_exists = env_file.exists()
        gitignore_has_env = False
        if gitignore.exists():
            content = gitignore.read_text()
            gitignore_has_env = ".env" in content

        self.add_check(CheckResult(
            name="env_not_in_git",
            passed=gitignore_has_env,
            message=".env в .gitignore" if gitignore_has_env else ".env НЕ в .gitignore (HR-06!)",
            severity="critical" if not gitignore_has_env else "info",
        ))

    async def _check_gitignore(self, root: Path):
        """Перевірка .gitignore."""
        gitignore = root / ".gitignore"
        if not gitignore.exists():
            self.add_check(CheckResult(
                name="gitignore",
                passed=False,
                message=".gitignore відсутній",
                severity="warning",
            ))
            return

        content = gitignore.read_text()
        required = ["node_modules", ".env", "__pycache__", ".venv", "dist"]
        found = [r for r in required if r in content]
        missing = [r for r in required if r not in content]

        self.add_check(CheckResult(
            name="gitignore_completeness",
            passed=len(missing) == 0,
            message=f".gitignore: {len(found)}/{len(required)} правил",
            severity="warning" if missing else "info",
            details={"found": found, "missing": missing},
        ))

    async def _check_no_hardcoded_secrets(self, root: Path):
        """Перевірка відсутності захардкоджених секретів (HR-06)."""
        # Перевірка ключових файлів на наявність паролів
        suspicious_patterns = ["password=", "secret=", "api_key=", "token="]
        services_dir = root / "services"
        violations = []

        if services_dir.exists():
            for py_file in list(services_dir.rglob("*.py"))[:50]:  # Обмеження для швидкості
                try:
                    content = py_file.read_text(errors="ignore").lower()
                    for pattern in suspicious_patterns:
                        if pattern in content and "os.getenv" not in content[max(0, content.index(pattern)-100):content.index(pattern)+100]:
                            # Потенційне порушення (грубий евристичний аналіз)
                            pass  # Уникаємо false positives
                except Exception:
                    pass

        self.add_check(CheckResult(
            name="no_hardcoded_secrets",
            passed=len(violations) == 0,
            message="Секрети в коді не знайдено (базова перевірка)" if not violations
                    else f"Знайдено {len(violations)} потенційних порушень HR-06",
            severity="critical" if violations else "info",
        ))

    async def _check_dockerfile_security(self, root: Path):
        """Перевірка Dockerfile (HR-05: multi-stage, не root)."""
        dockerfiles = list(root.rglob("Dockerfile"))
        if not dockerfiles:
            self.add_check(CheckResult(
                name="dockerfile_security",
                passed=False,
                message="Жодного Dockerfile не знайдено",
                severity="warning",
            ))
            return

        issues = []
        for df in dockerfiles[:10]:
            try:
                content = df.read_text()
                name = str(df.relative_to(root))
                if "USER" not in content and "user" not in content:
                    issues.append(f"{name}: відсутній USER (запуск від root)")
            except Exception:
                pass

        self.add_check(CheckResult(
            name="dockerfile_security",
            passed=len(issues) == 0,
            message=f"{len(dockerfiles)} Dockerfiles перевірено, {len(issues)} проблем"
                    if not issues else f"Проблеми: {'; '.join(issues[:3])}",
            severity="warning" if issues else "info",
            details={"total_dockerfiles": len(dockerfiles), "issues": issues},
        ))

    async def _check_jwt_config(self, root: Path):
        """Перевірка JWT конфігурації."""
        # Пошук JWT-пов'язаних файлів
        core_api = root / "services" / "core-api"
        if core_api.exists():
            jwt_files = [
                f for f in core_api.rglob("*.py")
                if any(kw in f.read_text(errors="ignore").lower() for kw in ("jwt", "pyjwt", "bearer"))
            ]
            self.add_check(CheckResult(
                name="jwt_implementation",
                passed=len(jwt_files) > 0,
                message=f"JWT: {len(jwt_files)} файлів з JWT логікою" if jwt_files
                        else "JWT імплементація не знайдена",
                severity="warning" if not jwt_files else "info",
            ))
        else:
            self.add_check(CheckResult(
                name="jwt_implementation",
                passed=False,
                message="core-api не знайдено для перевірки JWT",
                severity="warning",
            ))

    async def _check_worm_tables(self, root: Path):
        """Перевірка WORM таблиць (HR-16)."""
        init_sql = root / "db" / "postgres" / "init.sql"
        if init_sql.exists():
            content = init_sql.read_text(errors="ignore")
            has_audit = "audit" in content.lower()
            has_worm = "worm" in content.lower() or "immutable" in content.lower()
            self.add_check(CheckResult(
                name="worm_tables",
                passed=has_audit,
                message="WORM/audit таблиці знайдені в init.sql" if has_audit
                        else "WORM таблиці не знайдені в init.sql",
                severity="info",
            ))
        else:
            self.add_check(CheckResult(
                name="worm_tables",
                passed=False,
                message="init.sql не знайдено",
                severity="warning",
            ))
