from __future__ import annotations

import ast
import logging
import os
from typing import Any, Dict, List

from app.libs.core.structured_logger import get_logger


logger = get_logger("service.code_quality")

class CodeQualityAnalyzer:
    """Autonomous Code Quality Analyzer (v45.0).
    Scans the codebase for complexity, functions size, and potential issues using AST.
    """

    def __init__(self, root_dir: str = "/app"):
        # Default to current working dir if /app doesn't exist (local dev)
        self.root_dir = root_dir if os.path.exists(root_dir) else os.getcwd()
        self.ignore_dirs = {'.git', '__pycache__', '.venv', 'node_modules', 'tests', 'migrations'}

    def analyze_codebase(self) -> dict[str, Any]:
        """Scans all Python files in the root directory.
        Returns aggregate metrics and top offenders.
        """
        logger.info("starting_codebase_analysis", root=self.root_dir)

        total_files = 0
        total_lines = 0
        total_complexity = 0
        files_analyzed = []

        for root, dirs, files in os.walk(self.root_dir):
            # Filtering ignored directories
            dirs[:] = [d for d in dirs if d not in self.ignore_dirs]

            for file in files:
                # Skip Mac metadata files and other non-source files
                if file.startswith(("._", ".AppleDouble")) or file == ".DS_Store":
                    continue
                # Skip hidden files that are not __init__.py
                if file.startswith(".") and file != "__init__.py":
                    continue

                if file.endswith(".py"):
                    full_path = os.path.join(root, file)
                    try:
                        # Quick binary check - skip files with null bytes
                        with open(full_path, 'rb') as bf:
                            chunk = bf.read(512)
                            if b'\x00' in chunk:
                                continue  # Binary file, skip

                        metrics = self._analyze_file(full_path)
                        if metrics:
                            files_analyzed.append(metrics)
                            total_files += 1
                            total_lines += metrics['loc']
                            total_complexity += metrics['complexity']
                    except Exception as e:
                        logger.warning("failed_to_analyze_file", file=file, error=str(e))

        # Sort by complexity to find candidates for refactoring
        top_complex = sorted(files_analyzed, key=lambda x: x['complexity'], reverse=True)[:10]
        top_large = sorted(files_analyzed, key=lambda x: x['loc'], reverse=True)[:10]

        avg_complexity = total_complexity / total_files if total_files > 0 else 0

        logger.info("codebase_analysis_completed", files=total_files, avg_complexity=avg_complexity)

        return {
            "summary": {
                "total_files": total_files,
                "total_lines": total_lines,
                "total_complexity": total_complexity,
                "avg_complexity": round(avg_complexity, 2),
                "avg_lines_per_file": round(total_lines / total_files if total_files else 0, 1)
            },
            "top_offenders_complexity": top_complex,
            "top_offenders_size": top_large
        }

    def _analyze_file(self, file_path: str) -> dict[str, Any]:
        try:
            with open(file_path, encoding="utf-8") as f:
                content = f.read()
        except UnicodeDecodeError:
            # Skip binary/non-UTF-8 files
            return None

        lines = content.splitlines()
        loc = len([l for l in lines if l.strip() and not l.strip().startswith("#")])

        complexity = 0
        functions = 0
        classes = 0

        try:
            tree = ast.parse(content)

            # Simple complexity estimator: count branching nodes
            for node in ast.walk(tree):
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    functions += 1
                elif isinstance(node, ast.ClassDef):
                    classes += 1
                elif isinstance(node, (ast.If, ast.For, ast.While, ast.Try, ast.ExceptHandler)):
                    complexity += 1
                elif isinstance(node, ast.BoolOp):
                    complexity += len(node.values) - 1

        except SyntaxError:
            # Can happen if parsing different python version syntax or broken file
            return None

        # Calculate relative path for reporting
        rel_path = os.path.relpath(file_path, self.root_dir)

        return {
            "file": rel_path,
            "loc": loc,
            "complexity": complexity,
            "functions": functions,
            "classes": classes,
            "score": round(complexity / loc * 100, 2) if loc > 0 else 0 # Density of complexity
        }

    async def generate_improvements(self) -> list[dict[str, Any]]:
        """Generates TODO tasks based on analysis."""
        analysis = self.analyze_codebase()
        tasks = []

        # 1. High Complexity Check
        for file in analysis['top_offenders_complexity']:
            if file['complexity'] > 20: # Arbitrary threshold
                tasks.append({
                    "title": f"Refactor High Complexity: {file['file']}",
                    "description": f"File has complexity score of {file['complexity']}. Break down large functions or split classes.",
                    "priority": "high" if file['complexity'] > 40 else "medium",
                    "type": "refactor",
                    "metrics": file
                })

        # 2. Large File Check
        for file in analysis['top_offenders_size']:
            if file['loc'] > 300:
                tasks.append({
                    "title": f"Split Large File: {file['file']}",
                    "description": f"File has {file['loc']} lines of code. Consider modularizing.",
                    "priority": "low",
                    "type": "cleanup",
                    "metrics": file
                })

        return tasks

code_quality_analyzer = CodeQualityAnalyzer()
