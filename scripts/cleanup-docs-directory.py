#!/usr/bin/env python3
"""
📚 Documentation Cleanup для PREDATOR Analytics v56.1.4

Архівує застарілі технічні специфікації та залишає тільки актуальну документацію.
"""

import shutil
from pathlib import Path

PROJECT_ROOT = Path("/Users/Shared/Predator_60")
DOCS_DIR = PROJECT_ROOT / "docs"
ARCHIVE_DIR = DOCS_DIR / "archive"

# Актуальна документація (ЗАЛИШИТИ)
KEEP_DOCS = {
    # Головні гайди
    "QUICK_START.md",
    "USER_GUIDE.md",
    
    # Архітектура
    "ARCHITECTURE_ANALYSIS.md",
    
    # OSINT
    "ukraine_osint_data_sources.md",
    
    # Deployment
    "KUBERNETES_DEPLOYMENT.md",
    "CLOUDFLARE_TUNNEL_SETUP.md",
    
    # CLI Tools
    "CLI_TOOLS_INTEGRATION.md",
    "CLI_TOOLS_QUICKSTART.md",
    
    # Linting
    "LINTING_GUIDE.md",
    
    # Logging
    "STRUCTURED_LOGGING_MIGRATION.md",
}

# Патерни для архівації (старі версії)
ARCHIVE_PATTERNS = [
    # Старі версії специфікацій
    "*v25*",
    "*v26*",
    "*v27*",
    "*v28*",
    "*v29*",
    "*v30*",
    "*V2_*",
    "*V25*",
    "*V26*",
    "*V27*",
    "*V28*",
    "*V29*",
    "*V30*",
    
    # TZ (технічні завдання - вже імплеметовані)
    "TZ_*.md",
    "*_TZ.md",
    "*TECH_SPEC*.md",
    "*SPECIFICATION*.md",
    "*MASTER_TZ*.md",
    
    # Старі звіти
    "*REPORT*.md",
    "*ANALYSIS*.md",
    "*AUDIT*.md",
    "*STATUS*.md",
    "*PROGRESS*.md",
    
    # Implementation plans (вже виконані)
    "*IMPLEMENTATION_PLAN*.md",
    "*INTEGRATION_PLAN*.md",
    "*DETAILED_*PLAN*.md",
    
    # Old architecture docs
    "*ARCHITECTURE*.md",
    "*PREDATOR_V*.md",
    
    # Session reports
    "SESSION_REPORT*.txt",
    
    # UI concepts (вже імплеметовано)
    "*UI_CONCEPT*.md",
    "*DIMENSIONAL_UI*.md",
    "*WEB_UI*.md",
    
    # Server setup (вже завершено)
    "*SERVER_SETUP*.md",
    "*SERVER_WORKFLOW*.md",
    "*QUICK_SERVER*.md",
    
    # Telegram bot (якщо не використовується)
    "*TELEGRAM*.md",
    
    # Self-improvement specs
    "*SELF_IMPROVEMENT*.md",
    
    # OSINT detailed specs (занадто детальні)
    "OSINT_*.md",
    "*OSINT*.md",
    
    # RFCs (можна архівувати)
    "RFC_*.md",
    
    # Runbooks
    "EXECUTION_RUNBOOKS.md",
    
    # Optimization reports
    "OPTIMIZATION_REPORT.md",
    
    # Verification suites
    "*VERIFICATION*.md",
    
    # Other outdated
    "BOM_*.md",
    "ANTIGRAVITY_*.md",
    "AZR_*.md",
    "ORCHESTRATOR_*.md",
    "PHASE1_*.md",
    "SUPERVISOR_PROMPT.md",
    "analytical_datasets_*.md",
}


def archive_doc(filepath: Path, reason: str):
    """Move documentation to archive."""
    if not filepath.exists():
        return
    
    try:
        ARCHIVE_DIR.mkdir(exist_ok=True)
        dest = ARCHIVE_DIR / filepath.name
        
        # Add timestamp if exists
        if dest.exists():
            from datetime import datetime
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            dest = ARCHIVE_DIR / f"{filepath.stem}_{timestamp}{filepath.suffix}"
        
        shutil.move(str(filepath), str(dest))
        print(f"✓ Archived: {filepath.name} → archive/ ({reason})")
    except Exception as e:
        print(f"✗ Failed to archive {filepath.name}: {e}")


def cleanup_docs():
    """Main cleanup function."""
    print("📚 Starting documentation cleanup...\n")
    
    archived_count = 0
    kept_count = 0
    
    print("📦 Archiving outdated documentation...")
    for filepath in sorted(DOCS_DIR.iterdir()):
        if not filepath.is_file():
            continue
        
        filename = filepath.name
        
        # Skip if in keep list
        if filename in KEEP_DOCS:
            kept_count += 1
            continue
        
        # Skip if already in archive or subdirectories
        if "archive" in str(filepath) or filepath.suffix != '.md':
            continue
        
        # Check patterns
        should_archive = False
        for pattern in ARCHIVE_PATTERNS:
            if pattern.startswith("*") and pattern.endswith("*"):
                if pattern[1:-1].lower() in filename.lower():
                    should_archive = True
                    break
            elif pattern.startswith("*"):
                if filename.lower().endswith(pattern[1:].lower()):
                    should_archive = True
                    break
            elif pattern.endswith("*"):
                if filename.lower().startswith(pattern[:-1].lower()):
                    should_archive = True
                    break
        
        if should_archive:
            archive_doc(filepath, "outdated version/spec")
            archived_count += 1
    
    print(f"\n✅ Documentation cleanup completed!")
    print(f"\n📊 Summary:")
    print(f"   Documents kept: {kept_count}")
    print(f"   Documents archived: {archived_count}")
    print(f"\n💡 Archived docs are in: docs/archive/")


if __name__ == "__main__":
    cleanup_docs()
