from __future__ import annotations
from abc import ABC, abstractmethod
from pathlib import Path
import os
import json
from typing import Any

class StorageProvider(ABC):
    """Abstract interface for all persistent storage operations."""
    
    @abstractmethod
    def append_line(self, relative_path: str, data: dict[str, Any]) -> None:
        """Append a JSON line to a file-like resource."""
        pass

    @abstractmethod
    def write_text(self, relative_path: str, content: str) -> None:
        """Write string content to a resource."""
        pass

    @abstractmethod
    def read_text(self, relative_path: str) -> str | None:
        """Read string content from a resource."""
        pass

    @abstractmethod
    def write_lines(self, relative_path: str, lines: list[dict]) -> None:
        """Overwrite resource with multiple JSON lines."""
        pass

    @abstractmethod
    def copy(self, src_rel_path: str, dst_rel_path: str) -> bool:
        """Copy a resource."""
        pass

    @abstractmethod
    def exists(self, relative_path: str) -> bool:
        """Check if resource exists."""
        pass

class FileStorageProvider(StorageProvider):
    """Standard filesystem implementation with lazy directory creation."""
    
    def __init__(self, base_path: Path):
        self.base_path = base_path

    def _ensure_dir(self, file_path: Path):
        file_path.parent.mkdir(parents=True, exist_ok=True)

    def append_line(self, relative_path: str, data: dict[str, Any]) -> None:
        target = self.base_path / relative_path
        self._ensure_dir(target)
        with open(target, "a", encoding="utf-8") as f:
            f.write(json.dumps(data, ensure_ascii=False) + "\n")

    def write_text(self, relative_path: str, content: str) -> None:
        target = self.base_path / relative_path
        self._ensure_dir(target)
        target.write_text(content, encoding="utf-8")

    def read_text(self, relative_path: str) -> str | None:
        target = self.base_path / relative_path
        if not target.exists():
            return None
        return target.read_text(encoding="utf-8")

    def write_lines(self, relative_path: str, lines: list[dict]) -> None:
        target = self.base_path / relative_path
        self._ensure_dir(target)
        with open(target, "w", encoding="utf-8") as f:
            for line in lines:
                f.write(json.dumps(line, ensure_ascii=False) + "\n")
            f.flush()
            os.fsync(f.fileno())

    def copy(self, src_rel_path: str, dst_rel_path: str) -> bool:
        src = self.base_path / src_rel_path
        dst = self.base_path / dst_rel_path
        if not src.exists():
            return False
        import shutil
        self._ensure_dir(dst)
        shutil.copy(src, dst)
        return True

    def exists(self, relative_path: str) -> bool:
        return (self.base_path / relative_path).exists()
