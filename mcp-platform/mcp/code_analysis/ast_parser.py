"""AST parser для аналізу Python коду."""
from __future__ import annotations

import ast
from typing import Any, Optional
from pathlib import Path


class ASTError(Exception):
    """Базова помилка для AST операцій."""

    pass


class ASTParser:
    """Parser для аналізу абстрактного синтаксичного дерева Python коду."""

    def __init__(self, file_path: str | Path | None = None) -> None:
        """Ініціалізувати AST parser.

        Args:
            file_path: Опціональний шлях до файлу Python
        """
        self.file_path = Path(file_path) if file_path else None
        self.tree: ast.AST | None = None
        self.source: str = ""

    def parse_file(self, file_path: str | Path) -> ast.AST:
        """Спарсити Python файл.

        Args:
            file_path: Шлях до файлу Python

        Returns:
            AST дерево

        Raises:
            ASTError: Якщо помилка під час парсингу
        """
        file_path = Path(file_path)
        if not file_path.exists():
            raise ASTError(f"Файл не знайден: {file_path}")

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                self.source = f.read()
            self.tree = ast.parse(self.source)
            self.file_path = file_path
            return self.tree
        except SyntaxError as e:
            raise ASTError(f"Помилка синтаксису: {str(e)}") from e
        except Exception as e:
            raise ASTError(f"Помилка парсингу: {str(e)}") from e

    def parse_string(self, code: str) -> ast.AST:
        """Спарсити Python код як рядок.

        Args:
            code: Текст Python коду

        Returns:
            AST дерево

        Raises:
            ASTError: Якщо помилка під час парсингу
        """
        try:
            self.source = code
            self.tree = ast.parse(code)
            return self.tree
        except SyntaxError as e:
            raise ASTError(f"Помилка синтаксису: {str(e)}") from e
        except Exception as e:
            raise ASTError(f"Помилка парсингу: {str(e)}") from e

    def get_functions(self) -> list[dict[str, Any]]:
        """Отримати список функцій в коді.

        Returns:
            Список функцій з метаданими

        Raises:
            ASTError: Якщо дерево не спарсено
        """
        if not self.tree:
            raise ASTError("Спочатку потрібно спарсити код")

        functions = []
        for node in ast.walk(self.tree):
            if isinstance(node, ast.FunctionDef):
                func_info = {
                    "name": node.name,
                    "lineno": node.lineno,
                    "args": [arg.arg for arg in node.args.args],
                    "is_async": False,
                    "docstring": ast.get_docstring(node),
                    "decorators": [
                        d.id if isinstance(d, ast.Name) else str(d)
                        for d in node.decorator_list
                    ],
                }
                functions.append(func_info)
            elif isinstance(node, ast.AsyncFunctionDef):
                func_info = {
                    "name": node.name,
                    "lineno": node.lineno,
                    "args": [arg.arg for arg in node.args.args],
                    "is_async": True,
                    "docstring": ast.get_docstring(node),
                    "decorators": [
                        d.id if isinstance(d, ast.Name) else str(d)
                        for d in node.decorator_list
                    ],
                }
                functions.append(func_info)

        return functions

    def get_classes(self) -> list[dict[str, Any]]:
        """Отримати список класів в коді.

        Returns:
            Список класів з метаданами

        Raises:
            ASTError: Якщо дерево не спарсено
        """
        if not self.tree:
            raise ASTError("Спочатку потрібно спарсити код")

        classes = []
        for node in ast.walk(self.tree):
            if isinstance(node, ast.ClassDef):
                class_info = {
                    "name": node.name,
                    "lineno": node.lineno,
                    "bases": [
                        b.id if isinstance(b, ast.Name) else str(b)
                        for b in node.bases
                    ],
                    "methods": [
                        m.name for m in node.body
                        if isinstance(m, (ast.FunctionDef, ast.AsyncFunctionDef))
                    ],
                    "docstring": ast.get_docstring(node),
                }
                classes.append(class_info)

        return classes

    def get_imports(self) -> list[dict[str, str]]:
        """Отримати список імпортів в коді.

        Returns:
            Список імпортів

        Raises:
            ASTError: Якщо дерево не спарсено
        """
        if not self.tree:
            raise ASTError("Спочатку потрібно спарсити код")

        imports = []
        for node in ast.walk(self.tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imports.append({
                        "module": alias.name,
                        "alias": alias.asname,
                        "type": "import",
                    })
            elif isinstance(node, ast.ImportFrom):
                for alias in node.names:
                    imports.append({
                        "module": node.module or "",
                        "name": alias.name,
                        "alias": alias.asname,
                        "type": "from",
                        "level": node.level,
                    })

        return imports

    def get_complexity_metrics(self) -> dict[str, int]:
        """Отримати метрики складності (циклічна складність).

        Returns:
            Метрики складності

        Raises:
            ASTError: Якщо дерево не спарсено
        """
        if not self.tree:
            raise ASTError("Спочатку потрібно спарсити код")

        metrics = {
            "lines_of_code": len(self.source.splitlines()),
            "functions": len(self.get_functions()),
            "classes": len(self.get_classes()),
            "imports": len(self.get_imports()),
            "cyclomatic_complexity": self._calculate_cyclomatic_complexity(),
        }

        return metrics

    def _calculate_cyclomatic_complexity(self) -> int:
        """Розрахувати циклічну складність.

        Returns:
            Циклічна складність
        """
        complexity = 1
        for node in ast.walk(self.tree or ast.Module()):
            if isinstance(node, (ast.If, ast.While, ast.For, ast.ExceptHandler)):
                complexity += 1
            elif isinstance(node, ast.BoolOp):
                complexity += len(node.values) - 1

        return complexity

    def get_stats(self) -> dict[str, Any]:
        """Отримати повну статистику коду.

        Returns:
            Словник з усією статистикою

        Raises:
            ASTError: Якщо дерево не спарсено
        """
        if not self.tree:
            raise ASTError("Спочатку потрібно спарсити код")

        return {
            "file_path": str(self.file_path) if self.file_path else None,
            "functions": self.get_functions(),
            "classes": self.get_classes(),
            "imports": self.get_imports(),
            "metrics": self.get_complexity_metrics(),
        }
