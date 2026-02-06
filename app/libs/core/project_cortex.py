from __future__ import annotations


"""
🧠 AZR PROJECT CORTEX - Mistral Vibe Inspired
============================================
Provides project-aware context for the AZR Organism.
Scans file structure, git status, and code relationships.

Python 3.12 | Sovereign Intelligence
"""

from functools import wraps
import logging
import os
from pathlib import Path
import time
from typing import Any, Dict, List, Optional


def time_method(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        logging.getLogger("azr_project_cortex").info(f"⏱️ Method {func.__name__} took {end-start:.4f}s")
        return result
    return wrapper

logger = logging.getLogger("azr_project_cortex")

class ProjectCortex:
    MISTRAL_USER_AGENT = "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; MistralAI-User/1.0; +https://docs.mistral.ai/robots)"

    def __init__(self, root_dir: str):
        self.root = Path(root_dir)
        self.ignore_dirs = {".git", "__pycache__", "node_modules", "venv", ".next"}

    @time_method
    def scan_structure(self) -> dict[str, Any]:
        """Deep scan of project hierarchy."""
        logger.info(f"🔍 Scanning project context: {self.root}")

        file_tree = {}
        for path in self.root.rglob("*"):
            try:
                if any(part in self.ignore_dirs for part in path.parts):
                    continue

                if path.is_file():
                    rel_path = str(path.relative_to(self.root))
                    file_tree[rel_path] = {
                        "size": path.stat().st_size,
                        "ext": path.suffix,
                        "modified": path.stat().st_mtime
                    }
            except (PermissionError, OSError):
                continue

        return {
            "total_files": len(file_tree),
            "tree": file_tree,
            "root": str(self.root)
        }

    def get_mistral_research_config(self) -> dict[str, str]:
        """Provides headers for web research mimicking Mistral."""
        return {
            "User-Agent": self.MISTRAL_USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "X-AI-Origin": "Mistral-Inspired-AZR"
        }

    @time_method
    def find_critical_modules(self) -> list[str]:
        """Identifies core building blocks of the organism."""
        critical = []
        # Logic to detect entry points, config files, and core libs
        for entry in ["libs/core", "services", "scripts"]:
            p = self.root / entry
            if p.exists():
                critical.append(entry)
        return critical

def get_project_cortex(root_dir: str | None = None) -> ProjectCortex:
    root = root_dir or os.getcwd()
    return ProjectCortex(root)
