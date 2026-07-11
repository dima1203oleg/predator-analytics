#!/usr/bin/env python3
"""🤖 Telegram Bots Consolidation Recommendation

Аналіз дубльованих Telegram botів та рекомендації по консолідації.
"""

from pathlib import Path

PROJECT_ROOT = Path("/Users/Shared/Predator_60")


# Analyze both bots
bots = {
    "telegram-bot": PROJECT_ROOT / "apps" / "telegram-bot",
    "trinity_bot": PROJECT_ROOT / "apps" / "trinity_bot",
}

for _name, path in bots.items():

    if path.exists():
        # Count files
        py_files = list(path.rglob("*.py"))

        # Check for Dockerfile
        dockerfile = path / "Dockerfile"
        if dockerfile.exists():
            pass

        # Check for requirements
        requirements = path / "requirements.txt"
        pyproject = path / "pyproject.toml"
        if requirements.exists():
            pass
        if pyproject.exists():
            pass

        # List main directories
        subdirs = [d.name for d in path.iterdir() if d.is_dir() and not d.name.startswith('.')]


