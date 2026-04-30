"""Code Metrics Collector для збору метрик якості коду."""
from __future__ import annotations

import ast
from pathlib import Path
from typing import Any


class MetricsError(Exception):
    """Базова помилка для операцій метрик."""

    pass


class CodeMetricsCollector:
    """Колекціонер метрик якості Python коду."""

    def __init__(self) -> None:
        """Ініціалізувати колекціонер метрик."""
        self.metrics: dict[str, dict[str, Any]] = {}

    def analyze_file(self, file_path: str | Path, content: str) -> dict[str, Any]:
        """Проаналізувати файл та зібрати метрики.

        Args:
            file_path: Шлях до файлу
            content: Вміст файлу

        Returns:
            Словник метрик

        Raises:
            MetricsError: Якщо помилка аналізу
        """
        file_path = str(file_path)
        try:
            tree = ast.parse(content)
            lines = content.splitlines()

            metrics = {
                "file_path": file_path,
                "lines_of_code": len(lines),
                "blank_lines": sum(1 for line in lines if line.strip() == ""),
                "comment_lines": sum(1 for line in lines if line.strip().startswith("#")),
                "functions": self._count_functions(tree),
                "classes": self._count_classes(tree),
                "avg_function_length": self._avg_function_length(tree, lines),
                "imports": self._count_imports(tree),
                "cyclomatic_complexity": self._calculate_cyclomatic_complexity(tree),
                "maintainability_index": 0.0,
                "documented_functions": self._count_documented_functions(tree),
                "has_type_hints": self._check_type_hints(tree),
            }

            # Розрахувати индекс підтримки
            metrics["maintainability_index"] = self._calculate_maintainability_index(metrics)

            self.metrics[file_path] = metrics
            return metrics

        except SyntaxError as e:
            raise MetricsError(f"Помилка синтаксису: {str(e)}") from e
        except Exception as e:
            raise MetricsError(f"Помилка аналізу: {str(e)}") from e

    @staticmethod
    def _count_functions(tree: ast.AST) -> int:
        """Підрахувати функції в AST дереві."""
        return sum(
            1 for node in ast.walk(tree)
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))
        )

    @staticmethod
    def _count_classes(tree: ast.AST) -> int:
        """Підрахувати класи в AST дереві."""
        return sum(1 for node in ast.walk(tree) if isinstance(node, ast.ClassDef))

    @staticmethod
    def _count_imports(tree: ast.AST) -> int:
        """Підрахувати імпорти в AST дереві."""
        count = 0
        for node in ast.walk(tree):
            if isinstance(node, (ast.Import, ast.ImportFrom)):
                count += 1
        return count

    @staticmethod
    def _avg_function_length(tree: ast.AST, lines: list[str]) -> float:
        """Розрахувати середню довжину функції."""
        functions = [
            node for node in ast.walk(tree)
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))
        ]
        if not functions:
            return 0.0

        total_lines = 0
        for func in functions:
            if hasattr(func, "body"):
                func_lines = (func.end_lineno or len(lines)) - func.lineno
                total_lines += func_lines

        return total_lines / len(functions)

    @staticmethod
    def _calculate_cyclomatic_complexity(tree: ast.AST) -> int:
        """Розрахувати циклічну складність."""
        complexity = 1
        for node in ast.walk(tree):
            if isinstance(node, (ast.If, ast.While, ast.For, ast.ExceptHandler)):
                complexity += 1
            elif isinstance(node, ast.BoolOp):
                complexity += len(node.values) - 1
        return complexity

    @staticmethod
    def _count_documented_functions(tree: ast.AST) -> int:
        """Підрахувати задокументовані функції."""
        count = 0
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                if ast.get_docstring(node):
                    count += 1
        return count

    @staticmethod
    def _check_type_hints(tree: ast.AST) -> bool:
        """Перевірити чи є type hints в коді."""
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                if node.returns or any(arg.annotation for arg in node.args.args):
                    return True
        return False

    @staticmethod
    def _calculate_maintainability_index(metrics: dict[str, Any]) -> float:
        """Розрахувати індекс підтримки (0-100)."""
        loc = metrics["lines_of_code"]
        cc = metrics["cyclomatic_complexity"]
        doc_funcs = metrics["documented_functions"]
        total_funcs = metrics["functions"] or 1

        if loc == 0:
            return 100.0

        halstead_volume = loc * (loc ** 0.5)  # Спрощена формула
        mi = 171 - 5.2 * (halstead_volume ** 0.4) - 0.23 * cc - 16.2 * (
            1 - doc_funcs / total_funcs
        )

        return max(0.0, min(100.0, mi))

    def get_summary(self) -> dict[str, Any]:
        """Отримати зведену статистику по всім файлам.

        Returns:
            Словник зведеної статистики

        Raises:
            MetricsError: Якщо немає аналізованих файлів
        """
        if not self.metrics:
            raise MetricsError("Немає аналізованих файлів")

        summary = {
            "total_files": len(self.metrics),
            "total_lines": sum(m["lines_of_code"] for m in self.metrics.values()),
            "total_functions": sum(m["functions"] for m in self.metrics.values()),
            "total_classes": sum(m["classes"] for m in self.metrics.values()),
            "avg_maintainability": sum(
                m["maintainability_index"] for m in self.metrics.values()
            ) / len(self.metrics),
            "avg_complexity": sum(
                m["cyclomatic_complexity"] for m in self.metrics.values()
            ) / len(self.metrics),
            "documented_percentage": (
                sum(m["documented_functions"] for m in self.metrics.values()) /
                (sum(m["functions"] for m in self.metrics.values()) or 1)
            ) * 100,
        }

        return summary
