from __future__ import annotations


#!/usr/bin/env python3
"""
🦅 AZR IMMORTALITY PROTOCOL - System Service Installer
======================================================

Installs AZR Unified Organism as a native system daemon (LaunchAgent).
This ensures AZR automatically starts when the system boots/recovers from power loss.

Usage:
    sudo python3 scripts/install_immortality.py

Features:
- Auto-start on boot
- Auto-restart on crash (KeepAlive)
- Standard Output/Error logging to /tmp/azr_logs
- Environment variable preservation
"""

import os
from pathlib import Path
import plistlib
import sys


def main():
    print("🦅 AZR IMMORTALITY PROTOCOL")
    print("==========================")

    # 1. Detect paths
    project_root = Path(__file__).parent.parent.resolve()
    python_path = sys.executable
    script_path = project_root / "scripts" / "start_azr_unified.py"

    label = "com.predator21.azr.sovereign"
    plist_path = Path.home() / "Library/LaunchAgents" / f"{label}.plist"

    print(f"📍 Project Root: {project_root}")
    print(f"🐍 Python:       {python_path}")
    print(f"📜 Script:       {script_path}")

    # 2. Create PLIST content
    plist_content = {
        "Label": label,
        "ProgramArguments": [
            str(python_path),
            str(script_path),
            "--hours", "8760",  # Run for a year
            "--aggressive"      # Enable aggressive mode
        ],
        "WorkingDirectory": str(project_root),
        "EnvironmentVariables": {
            "PYTHONPATH": f"{project_root}:$PYTHONPATH",
            "AZR_ROOT": str(project_root),
            "SOVEREIGN_AUTO_APPROVE": "true",
            "LANG": "en_US.UTF-8"
        },
        "RunAtLoad": True,      # Start immediately on load/boot
        "KeepAlive": True,      # Restart if crashes/killed
        "StandardOutPath": "/tmp/azr_logs/azr_daemon.out",
        "StandardErrorPath": "/tmp/azr_logs/azr_daemon.err"
    }

    # 3. Write PLIST
    print(f"\n📝 Generating {plist_path}...")
    plist_path.parent.mkdir(parents=True, exist_ok=True)

    with open(plist_path, "wb") as f:
        plistlib.dump(plist_content, f)

    print("✅ Service definition created.")

    # 4. Instructions
    print("\n⚡ ACTIVATION REQUIRED")
    print("To grant immortality, run these commands:")
    print(f"  launchctl unload {plist_path} 2>/dev/null")
    print(f"  launchctl load -w {plist_path}")
    print("\nTo monitor:")
    print("  tail -f /tmp/azr_logs/azr_daemon.out")
    print("\nTo stop:")
    print(f"  launchctl unload {plist_path}")

if __name__ == "__main__":
    main()
