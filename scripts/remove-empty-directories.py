#!/usr/bin/env python3
"""🗑️ Remove Empty Directories для PREDATOR Analytics v56.1.4

Видаляє всі пусті директорії з проекту.
"""

from pathlib import Path

PROJECT_ROOT = Path("/Users/Shared/Predator_60")

# Пусті директорії для видалення
EMPTY_DIRS = [
    "acp_core",
    "logs",
]

def remove_empty_directory(dirpath: Path):
    """Remove empty directory."""
    try:
        if dirpath.exists() and dirpath.is_dir():
            # Check if truly empty
            contents = list(dirpath.iterdir())
            if not contents:
                dirpath.rmdir()
                return True
    except Exception:
        pass
    return False

def main():
    """Remove all empty directories."""
    removed_count = 0

    for dirname in EMPTY_DIRS:
        dirpath = PROJECT_ROOT / dirname
        if remove_empty_directory(dirpath):
            removed_count += 1

    # Also check for .gitkeep files and remove dirs without them
    for dirpath in PROJECT_ROOT.rglob("*"):
        if dirpath.is_dir() and not any(dirpath.iterdir()):
            # Skip important directories
            if dirpath.name not in [".git", "node_modules", "__pycache__"]:
                if remove_empty_directory(dirpath):
                    removed_count += 1



if __name__ == "__main__":
    main()
