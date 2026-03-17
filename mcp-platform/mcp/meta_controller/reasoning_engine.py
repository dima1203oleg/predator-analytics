"""Reasoning Engine для прийняття рішень на основі ШІ."""
from __future__ import annotations

from typing import Any, Optional
from dataclasses import dataclass
from enum import Enum


class ReasoningError(Exception):
    """Базова помилка для Reasoning Engine."""

    pass


class ConfidenceLevel(Enum):
    """Рівні впевненості у рішенні."""

    LOW = 0.33
    MEDIUM = 0.66
    HIGH = 0.99


@dataclass
class Decision:
    """Рішення, яке приймає система."""

    id: str
    action: str
    confidence: float
    reasoning: str
    priority: int
    estimated_impact: str
    risks: list[str]
    metadata: dict[str, Any] | None = None


class ReasoningEngine:
    """Engine для логіки рішень на основі аналізу кодової бази."""

    def __init__(self, llm_client: Any) -> None:
        """Ініціалізувати Reasoning Engine.

        Args:
            llm_client: LLMClient для отримання аналізу ШІ
        """
        self.llm_client = llm_client
        self.decision_history: list[Decision] = []

    async def analyze_code_quality(
        self, file_metrics: dict[str, Any]
    ) -> Decision:
        """Проаналізувати якість коду та прийняти рішення.

        Args:
            file_metrics: Метрики якості файлу

        Returns:
            Рішення про покращення

        Raises:
            ReasoningError: Якщо помилка рішення
        """
        try:
            maintainability = file_metrics.get("maintainability_index", 50)
            complexity = file_metrics.get("cyclomatic_complexity", 1)
            documentation_pct = file_metrics.get("documented_percentage", 0)

            # Визначити рівень впевненості
            confidence = 0.0
            if maintainability > 80:
                confidence = 0.9
            elif maintainability > 60:
                confidence = 0.7
            elif maintainability > 40:
                confidence = 0.5
            else:
                confidence = 0.3

            action = self._determine_action(maintainability, complexity)
            risks = self._identify_risks(file_metrics)

            decision = Decision(
                id=f"dec_qa_{file_metrics.get('file_path', 'unknown')}",
                action=action,
                confidence=confidence,
                reasoning=f"Індекс підтримки: {maintainability:.1f}, Циклічна складність: {complexity}",
                priority=self._calculate_priority(maintainability),
                estimated_impact="Покращення читаємості та якості коду",
                risks=risks,
                metadata={"maintainability": maintainability, "complexity": complexity},
            )

            self.decision_history.append(decision)
            return decision

        except Exception as e:
            raise ReasoningError(f"Помилка аналізу якості: {str(e)}") from e

    async def analyze_security_issues(
        self, code_analysis: dict[str, Any]
    ) -> Decision:
        """Проаналізувати потенційні проблеми безпеки.

        Args:
            code_analysis: Результати аналізу коду

        Returns:
            Рішення щодо безпеки

        Raises:
            ReasoningError: Якщо помилка рішення
        """
        try:
            # Спрощений аналіз (в реальному світі використовував би semgrep, bandit)
            confidence = 0.7
            action = "Провести аудит безпеки"
            risks = ["Потенційні SQL injection", "XSS вразливості"]

            decision = Decision(
                id="dec_sec_audit",
                action=action,
                confidence=confidence,
                reasoning="Виявлені потенційні вразливості",
                priority=1,  # Найвища пріоритет
                estimated_impact="Покращення безпеки системи",
                risks=risks,
                metadata={"analysis_type": "security"},
            )

            self.decision_history.append(decision)
            return decision

        except Exception as e:
            raise ReasoningError(f"Помилка аналізу безпеки: {str(e)}") from e

    async def suggest_refactoring(
        self, dependencies: dict[str, Any]
    ) -> Decision:
        """Запропонувати рефакторинг на основі залежностей.

        Args:
            dependencies: Граф залежностей

        Returns:
            Рішення про рефакторинг

        Raises:
            ReasoningError: Якщо помилка рішення
        """
        try:
            nodes = dependencies.get("nodes", {})
            cycles = dependencies.get("cycles", [])

            action = "Рефакторинг архітектури" if cycles else "Оптимізація структури"
            confidence = 0.8 if cycles else 0.6

            decision = Decision(
                id="dec_refactor",
                action=action,
                confidence=confidence,
                reasoning=f"Знайдено {len(cycles)} циклічних залежностей",
                priority=2 if cycles else 3,
                estimated_impact="Поліпшення архітектури та тестованості",
                risks=["Потребує перевірки тестів"],
                metadata={
                    "cycle_count": len(cycles),
                    "node_count": len(nodes),
                },
            )

            self.decision_history.append(decision)
            return decision

        except Exception as e:
            raise ReasoningError(f"Помилка рефакторингу: {str(e)}") from e

    @staticmethod
    def _determine_action(maintainability: float, complexity: int) -> str:
        """Визначити дію на основі метрик."""
        if maintainability < 40:
            return "Критичний рефакторинг"
        elif maintainability < 60:
            return "Значний рефакторинг"
        elif complexity > 10:
            return "Зменшити циклічну складність"
        else:
            return "Поточна якість задовільна"

    @staticmethod
    def _calculate_priority(maintainability: float) -> int:
        """Розрахувати пріоритет дії."""
        if maintainability < 40:
            return 1  # Найвисший
        elif maintainability < 60:
            return 2
        else:
            return 3  # Найнизший

    @staticmethod
    def _identify_risks(file_metrics: dict[str, Any]) -> list[str]:
        """Виявити ризики в коді."""
        risks = []
        if file_metrics.get("cyclomatic_complexity", 1) > 10:
            risks.append("Висока циклічна складність")
        if file_metrics.get("documented_percentage", 0) < 50:
            risks.append("Низька документованість")
        if file_metrics.get("lines_of_code", 0) > 500:
            risks.append("Великий файл")
        return risks

    def get_decision_history(self) -> list[Decision]:
        """Отримати історію рішень.

        Returns:
            Список всіх рішень
        """
        return self.decision_history

    def clear_history(self) -> None:
        """Очистити історію рішень."""
        self.decision_history.clear()
