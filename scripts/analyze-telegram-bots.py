#!/usr/bin/env python3
"""
🤖 Telegram Bots Consolidation Recommendation

Аналіз дубльованих Telegram botів та рекомендації по консолідації.
"""

from pathlib import Path

PROJECT_ROOT = Path("/Users/Shared/Predator_60")

print("🤖 Telegram Bots Analysis\n")
print("=" * 60)

# Analyze both bots
bots = {
    "telegram-bot": PROJECT_ROOT / "apps" / "telegram-bot",
    "trinity_bot": PROJECT_ROOT / "apps" / "trinity_bot",
}

for name, path in bots.items():
    print(f"\n📁 {name}/")
    print(f"   Location: {path}")
    
    if path.exists():
        # Count files
        py_files = list(path.rglob("*.py"))
        print(f"   Python files: {len(py_files)}")
        
        # Check for Dockerfile
        dockerfile = path / "Dockerfile"
        if dockerfile.exists():
            print(f"   ✓ Has Dockerfile")
        
        # Check for requirements
        requirements = path / "requirements.txt"
        pyproject = path / "pyproject.toml"
        if requirements.exists():
            print(f"   ✓ Has requirements.txt")
        if pyproject.exists():
            print(f"   ✓ Has pyproject.toml")
        
        # List main directories
        subdirs = [d.name for d in path.iterdir() if d.is_dir() and not d.name.startswith('.')]
        print(f"   Subdirectories: {', '.join(subdirs)}")

print("\n" + "=" * 60)
print("\n💡 RECOMMENDATION:")
print("\n1. KEEP: apps/predator-analytics-ui/ (main frontend)")
print("2. CONSOLIDATE: Choose ONE telegram bot:")
print("   - Option A: Keep 'telegram-bot' (more complete)")
print("   - Option B: Keep 'trinity_bot' (newer architecture)")
print("   - Delete the other one")
print("\n3. ARCHIVE: Move unused bot to apps/archive/")
print("\n4. OTHER APPS:")
print("   - backend/ → Check if still needed (might be deprecated)")
print("   - ingestion-api/ → Keep if used")
print("   - self-improve-orchestrator/ → Keep if active")
print("   - worker-excel/ → Archive if not used")

print("\n" + "=" * 60)
print("\n🎯 Suggested Action:")
print("   python3 scripts/consolidate-telegram-bots.py")
