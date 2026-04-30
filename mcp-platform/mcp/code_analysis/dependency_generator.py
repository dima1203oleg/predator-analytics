"""Dependency Graph Generator для побудови графу залежностей."""
from __future__ import annotations

import ast
from collections import defaultdict
from pathlib import Path
from typing import Any


class DependencyError(Exception):
    """Базова помилка для операцій залежностей."""

    pass


class DependencyGraphGenerator:
    """Генератор графу залежностей для Python коду."""

    def __init__(self) -> None:
        """Ініціалізувати генератор графу залежностей."""
        self.graph: dict[str, list[str]] = defaultdict(list)
        self.nodes: dict[str, dict[str, Any]] = {}
        self.edges: list[tuple[str, str, str]] = []

    def add_file(self, file_path: str | Path, content: str) -> None:
        """Додати файл до графу.

        Args:
            file_path: Шлях до файлу
            content: Вміст файлу Python

        Raises:
            DependencyError: Якщо помилка парсингу
        """
        file_path = str(file_path)
        try:
            tree = ast.parse(content)
            self.nodes[file_path] = {
                "type": "file",
                "path": file_path,
                "functions": [],
                "classes": [],
            }

            for node in ast.walk(tree):
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    func_name = f"{file_path}::{node.name}"
                    self.nodes[func_name] = {
                        "type": "function",
                        "name": node.name,
                        "file": file_path,
                        "async": isinstance(node, ast.AsyncFunctionDef),
                    }
                    self.nodes[file_path]["functions"].append(node.name)
                    self._extract_function_calls(func_name, node)

                elif isinstance(node, ast.ClassDef):
                    class_name = f"{file_path}::{node.name}"
                    self.nodes[class_name] = {
                        "type": "class",
                        "name": node.name,
                        "file": file_path,
                        "methods": [],
                    }
                    self.nodes[file_path]["classes"].append(node.name)

                    for item in node.body:
                        if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)):
                            method_name = f"{class_name}::{item.name}"
                            self.nodes[class_name]["methods"].append(item.name)
                            self._extract_function_calls(method_name, item)

        except SyntaxError as e:
            raise DependencyError(f"Помилка синтаксису у {file_path}: {str(e)}") from e
        except Exception as e:
            raise DependencyError(f"Помилка обробки {file_path}: {str(e)}") from e

    def _extract_function_calls(self, source_node: str, func_node: ast.AST) -> None:
        """Витягти виклики функцій з вузла.

        Args:
            source_node: Назва вузла-джерела
            func_node: AST вузол функції/методу
        """
        for node in ast.walk(func_node):
            if isinstance(node, ast.Call):
                if isinstance(node.func, ast.Name):
                    target = node.func.id
                    self.edges.append((source_node, target, "calls"))
                elif isinstance(node.func, ast.Attribute):
                    target = node.func.attr
                    self.edges.append((source_node, target, "calls"))

    def get_graph(self) -> dict[str, Any]:
        """Отримати повний граф залежностей.

        Returns:
            Словник з вузлами та ребрами
        """
        return {
            "nodes": self.nodes,
            "edges": self.edges,
            "graph": self.graph,
        }

    def get_dependencies_for(self, node_name: str) -> list[str]:
        """Отримати залежності для вузла.

        Args:
            node_name: Назва вузла

        Returns:
            Список залежностей

        Raises:
            DependencyError: Якщо вузел не знайден
        """
        if node_name not in self.nodes:
            raise DependencyError(f"Вузол не знайден: {node_name}")

        return self.graph.get(node_name, [])

    def find_circular_dependencies(self) -> list[list[str]]:
        """Знайти циклічні залежності.

        Returns:
            Список циклічних залежностей
        """
        cycles = []
        visited: set[str] = set()
        rec_stack: set[str] = set()

        def dfs(node: str, path: list[str]) -> None:
            visited.add(node)
            rec_stack.add(node)
            path.append(node)

            for neighbor in self.graph.get(node, []):
                if neighbor not in visited:
                    dfs(neighbor, path.copy())
                elif neighbor in rec_stack:
                    cycle = path[path.index(neighbor):] + [neighbor]
                    if cycle not in cycles:
                        cycles.append(cycle)

            rec_stack.discard(node)

        for node in self.nodes:
            if node not in visited:
                dfs(node, [])

        return cycles

    def find_dead_code(self) -> list[str]:
        """Знайти неживий код (вузли без залежностей).

        Returns:
            Список вузлів без залежностей
        """
        dead_code = []
        for node in self.nodes:
            if node not in self.graph and not self.graph.get(node):
                dead_code.append(node)

        return dead_code

    def find_entry_points(self) -> list[str]:
        """Знайти точки входу (вузли, які не залежать від інших).

        Returns:
            Список точок входу
        """
        all_sources = set(self.graph.keys())
        all_targets = set()
        for targets in self.graph.values():
            all_targets.update(targets)

        entry_points = [node for node in self.nodes if node in all_sources and node not in all_targets]
        return entry_points
