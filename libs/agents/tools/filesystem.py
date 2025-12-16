import os
import logging
from pathlib import Path
from .registry import registry

logger = logging.getLogger("tools.fs")

# Current working directory as root
ROOT_DIR = Path(os.getcwd()).resolve()

def _resolve_path(path: str) -> Path:
    return (ROOT_DIR / path).resolve()

@registry.register(name="read_file", description="Read file content. Args: path (string)")
def read_file(path: str) -> str:
    """Read contents of a file"""
    try:
        target = _resolve_path(path)
        if not target.exists():
            return f"Error: File {path} does not exist."
        if target.is_dir():
            return f"Error: {path} is a directory."

        # Safety: Limit size to 500KB
        if target.stat().st_size > 500_000:
            return f"Error: File too large (>500KB). Cannot read entirely."

        return target.read_text(encoding="utf-8")
    except Exception as e:
        logger.error(f"FS Read Error: {e}")
        return f"Error reading file: {e}"

@registry.register(name="list_directory", description="List files in directory. Args: path (string)")
def list_directory(path: str = ".") -> str:
    """List contents of a directory"""
    try:
        target = _resolve_path(path)
        if not target.exists():
            return "Error: Directory not found"
        if not target.is_dir():
            return f"Error: {path} is not a directory"

        items = []
        for item in target.iterdir():
            # Skip hidden files
            if item.name.startswith("."): continue

            type_label = "[DIR] " if item.is_dir() else "      "
            items.append(f"{type_label}{item.name}")
        return "\n".join(sorted(items))
    except Exception as e:
        return f"Error listing directory: {e}"

@registry.register(name="write_file", description="Write content to file. Args: path (string), content (string)")
def write_file(path: str, content: str) -> str:
    """Write or overwrite file content"""
    try:
        target = _resolve_path(path)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")
        logger.info(f"💾 File written: {path}")
        return f"Success: File {path} saved."
    except Exception as e:
        logger.error(f"FS Write Error: {e}")
        return f"Error writing file: {e}"
