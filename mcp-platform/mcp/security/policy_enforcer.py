"""Security Policy Enforcer для впровадження політик безпеки."""
from __future__ import annotations

from typing import Any, Optional
from dataclasses import dataclass
from enum import Enum


class PolicySeverity(Enum):
    """Рівні серйозності політики."""

    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


@dataclass
class SecurityPolicy:
    """Політика безпеки."""

    id: str
    name: str
    description: str
    rules: list[str]
    severity: PolicySeverity
    enabled: bool = True


@dataclass
class PolicyViolation:
    """Порушення політики."""

    policy_id: str
    policy_name: str
    violation: str
    severity: PolicySeverity
    location: str | None = None
    fix_suggestion: str | None = None


class PolicyError(Exception):
    """Базова помилка для Policy Enforcer."""

    pass


class SecurityPolicyEnforcer:
    """Enforcer для впровадження політик безпеки."""

    def __init__(self) -> None:
        """Ініціалізувати Policy Enforcer."""
        self.policies: dict[str, SecurityPolicy] = {}
        self.violations: list[PolicyViolation] = []
        self._init_default_policies()

    def _init_default_policies(self) -> None:
        """Ініціалізувати стандартні політики безпеки."""
        # Політика: Забороняти небезпечні функції
        self.policies["no_dangerous_functions"] = SecurityPolicy(
            id="pol_001",
            name="No Dangerous Functions",
            description="Забороняти використання небезпечних функцій",
            rules=[
                "Забороняти eval()",
                "Забороняти exec()",
                "Забороняти __import__()",
                "Забороняти pickle.loads()",
            ],
            severity=PolicySeverity.CRITICAL,
        )

        # Політика: Вимагати type hints
        self.policies["require_type_hints"] = SecurityPolicy(
            id="pol_002",
            name="Require Type Hints",
            description="Вимагати type hints для публічних функцій",
            rules=[
                "Всі публічні функції повинні мати type hints",
                "Параметри повинні мати анотацію типу",
                "Повернене значення повинно мати анотацію типу",
            ],
            severity=PolicySeverity.WARNING,
        )

        # Політика: Вимагати документацію
        self.policies["require_documentation"] = SecurityPolicy(
            id="pol_003",
            name="Require Documentation",
            description="Вимагати docstring для всіх публічних модулів, функцій та класів",
            rules=[
                "Модулі повинні мати docstring",
                "Функції повинні мати docstring",
                "Класи повинні мати docstring",
            ],
            severity=PolicySeverity.WARNING,
        )

        # Політика: Забороняти hardcoded секрети
        self.policies["no_hardcoded_secrets"] = SecurityPolicy(
            id="pol_004",
            name="No Hardcoded Secrets",
            description="Забороняти hardcoded пароли та API ключі",
            rules=[
                "Не використовувати пароль у коді",
                "Не використовувати API ключі у коді",
                "Не використовувати токени у коді",
            ],
            severity=PolicySeverity.CRITICAL,
        )

    async def check_file(
        self, file_path: str, code: str
    ) -> list[PolicyViolation]:
        """Перевірити файл на порушення політик.

        Args:
            file_path: Шлях до файлу
            code: Текст коду

        Returns:
            Список порушень

        Raises:
            PolicyError: Якщо помилка перевірки
        """
        violations = []

        try:
            # Перевірити кожну активну політику
            for policy in self.policies.values():
                if not policy.enabled:
                    continue

                if policy.id == "pol_001":  # No dangerous functions
                    violations.extend(
                        await self._check_dangerous_functions(file_path, code, policy)
                    )
                elif policy.id == "pol_004":  # No hardcoded secrets
                    violations.extend(
                        await self._check_hardcoded_secrets(file_path, code, policy)
                    )

            self.violations.extend(violations)
            return violations

        except Exception as e:
            raise PolicyError(f"Помилка перевірки політики: {str(e)}") from e

    async def _check_dangerous_functions(
        self, file_path: str, code: str, policy: SecurityPolicy
    ) -> list[PolicyViolation]:
        """Перевірити на небезпечні функції."""
        violations = []
        dangerous = ["eval(", "exec(", "__import__(", "pickle.loads("]

        for dangerous_func in dangerous:
            if dangerous_func in code:
                violations.append(
                    PolicyViolation(
                        policy_id=policy.id,
                        policy_name=policy.name,
                        violation=f"Знайдено небезпечну функцію: {dangerous_func}",
                        severity=policy.severity,
                        location=file_path,
                        fix_suggestion=f"Замініть {dangerous_func} на безпечну альтернативу",
                    )
                )

        return violations

    async def _check_hardcoded_secrets(
        self, file_path: str, code: str, policy: SecurityPolicy
    ) -> list[PolicyViolation]:
        """Перевірити на hardcoded секрети."""
        violations = []
        secret_patterns = ["password =", "api_key =", "token =", "secret ="]

        for pattern in secret_patterns:
            if pattern in code.lower():
                violations.append(
                    PolicyViolation(
                        policy_id=policy.id,
                        policy_name=policy.name,
                        violation=f"Знайдено потенційний hardcoded секрет: {pattern}",
                        severity=policy.severity,
                        location=file_path,
                        fix_suggestion="Використовуйте змінні оточення або Secret Manager",
                    )
                )

        return violations

    def get_policy(self, policy_id: str) -> SecurityPolicy:
        """Отримати політику за ID.

        Args:
            policy_id: ID політики

        Returns:
            Політика

        Raises:
            PolicyError: Якщо політика не знайдена
        """
        for policy in self.policies.values():
            if policy.id == policy_id:
                return policy

        raise PolicyError(f"Політика не знайдена: {policy_id}")

    def enable_policy(self, policy_id: str) -> None:
        """Увімкнути політику.

        Args:
            policy_id: ID політики
        """
        for policy in self.policies.values():
            if policy.id == policy_id:
                policy.enabled = True

    def disable_policy(self, policy_id: str) -> None:
        """Вимкнути політику.

        Args:
            policy_id: ID політики
        """
        for policy in self.policies.values():
            if policy.id == policy_id:
                policy.enabled = False

    def get_statistics(self) -> dict[str, Any]:
        """Отримати статистику порушень.

        Returns:
            Статистика
        """
        by_severity = {}
        for violation in self.violations:
            severity = violation.severity.value
            by_severity[severity] = by_severity.get(severity, 0) + 1

        return {
            "total_violations": len(self.violations),
            "total_policies": len(self.policies),
            "enabled_policies": sum(1 for p in self.policies.values() if p.enabled),
            "by_severity": by_severity,
        }

    def clear_violations(self) -> None:
        """Очистити список порушень."""
        self.violations.clear()
