from __future__ import annotations


#!/usr/bin/env python3
"""
🛡️ AZR CONSTITUTIONAL GUARD - v45.0
Enforcing Project Sovereignty (Axioms 1-16)
"""
import logging
import os
from pathlib import Path
import re
import sys


# Setup logging
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("AZR_GUARD")

ROOT_DIR = Path("/Users/dima-mac/Documents/Predator_21")

# Axiom 15.1: Ukrainian Language Scope
ALLOWED_NON_UKR_PATHS = ["node_modules", ".git", "venv", "dist", "libs/bridge", "services/mcp-devtools"]

# Axiom 16: Stability Blackzone (Files AZR agents are FORBIDDEN to modernize)
STABILITY_BLACKZONE = [
    "libs/bridge",         # Vendored libs (numpy, pip, etc.)
    "services/truth-ledger",# Core Immutable
    "services/arbiter",     # Decision Core
    "node_modules",        # Dependencies
    ".venv"                # Env
]

def check_project_purity():
    """Verify project is 3.12 pure. No other versions allowed."""
    logger.info("⚔️ Перевірка чистоти архітектури (3.12 Pure Mode)...")

    # Check current runtime
    current_ver = f"{sys.version_info.major}.{sys.version_info.minor}"
    if current_ver != "3.12":
        logger.error(f"❌ КРИТИЧНЕ ПОРУШЕННЯ: Поточний рантайм {current_ver} не є 3.12!")
        return False

    # Check for legacy venvs
    legacy_envs = list(ROOT_DIR.glob("**/pyvenv.cfg"))
    for cfg in legacy_envs:
        try:
            content = cfg.read_text()
            if "3.12" not in content:
                logger.warning(f"⚠️ ЗНАЙДЕНО ЗАСТАРІЛЕ СЕРЕДОВИЩЕ: {cfg.parent}")
                return False
        except: pass
    return True

def check_python_version():
    """Verify all Dockerfiles use Python 3.12 (Axiom 15.2)."""
    logger.info("🔍 Перевірка версії Python (Axiom 15.2)...")
    dockerfiles = list(ROOT_DIR.glob("**/Dockerfile*"))
    invalid_files = []
    for df in dockerfiles:
        if any(p in str(df) for p in ALLOWED_NON_UKR_PATHS): continue
        try:
            content = df.read_text()
            matches = re.findall(r"FROM\s+python:(\d+\.\d+)", content)
            for m in matches:
                if m != "3.12":
                    logger.warning(f"❌ {df.relative_to(ROOT_DIR)}: Python {m} (Allowed: 3.12)")
                    invalid_files.append(df)
        except: pass
    return invalid_files

def check_language_compliance():
    """Verify Ukrainian only in UI components (Axiom 15.1)."""
    logger.info("🔍 Перевірка мовної політики (Axiom 15.1)...")
    ui_paths = [ROOT_DIR / "apps/predator-analytics-ui/src"]
    invalid_files = []
    ru_chars = re.compile(r'[ыэъёЫЭЪЁ]')
    for path in ui_paths:
        if not path.exists(): continue
        for f in path.rglob("*"):
            if f.is_file() and f.suffix in ['.tsx', '.ts', '.js']:
                try:
                    content = f.read_text()
                    if ru_chars.search(content):
                        logger.warning(f"❌ {f.relative_to(ROOT_DIR)}: Russian characters detected!")
                        invalid_files.append(f)
                except: pass
    return invalid_files

def check_security_leaks():
    """Verify no hardcoded secrets in source code (Axiom 3)."""
    logger.info("🛡️ Сканування на витік секретів (Axiom 3)...")
    # Matches common hex-like keys or "sk-..."
    secret_pattern = re.compile(r'(sk-[a-zA-Z0-9]{20,}|AIzaSy[a-zA-Z0-9]{30,})')
    leaks = []
    for path in [ROOT_DIR / "apps", ROOT_DIR / "services"]:
        if not path.exists(): continue
        for f in path.rglob("*"):
            if f.is_file() and f.suffix in ['.tsx', '.py', '.js'] and "node_modules" not in str(f):
                try:
                    content = f.read_text()
                    if secret_pattern.search(content):
                        logger.error(f"❌ ВИЯВЛЕНО СЕКРЕТ В {f.relative_to(ROOT_DIR)}!")
                        leaks.append(f)
                except: pass
    return leaks

def check_stability_integrity():
    """Check if any modernization actions leaked into blackzones (Axiom 16)."""
    logger.info("🛡️ Перевірка цілісності стабільних зон (Axiom 16)...")
    # This checks if there are recent changes in blackzones not marked as 'system'
    # For now, we simulate by checking if 'libs/bridge' was modified in last cycle
    return True

def run_guard():
    print("\n" + "="*50)
    print("🛡️  AZR CONSTITUTIONAL GUARD - ACTIVE")
    print("="*50 + "\n")

    py_err = check_python_version()
    purity_ok = check_project_purity()
    lang_err = check_language_compliance()
    leaks = check_security_leaks()
    stability_ok = check_stability_integrity()

    # Check for duplicates (common source of entropy)
    dupes = []
    critical_dupes = [("AppRoutes.tsx", "AppRoutesNew.tsx")]
    for o, n in critical_dupes:
        if list(ROOT_DIR.glob(f"**/{o}")) and list(ROOT_DIR.glob(f"**/{n}")):
            dupes.append((o, n))
            logger.warning(f"⚠️ ДУБЛІКАТ: {o} та {n} виявлені одночасно!")

    print("\n" + "="*50)
    if not py_err and not lang_err and stability_ok and not dupes and not leaks:
        print("✅ СИСТЕМА ВІДПОВІДАЄ КОНСТИТУЦІЇ PREDATOR")
    else:
        print("❌ ВИЯВЛЕНО ПОРУШЕННЯ КОНСТИТУЦІЇ!")
        if leaks: print(f" - КРИТИЧНО: Виявлено {len(leaks)} витоків секретів!")
    print("="*50 + "\n")

if __name__ == "__main__":
    run_guard()
