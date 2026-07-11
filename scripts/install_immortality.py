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

from pathlib import Path
import plistlib
import sys


def main():

    # 1. Detect paths
    project_root = Path(__file__).parent.parent.resolve()
    python_path = sys.executable
    script_path = project_root / "scripts" / "start_azr_unified.py"

    label = "com.predator21.azr.sovereign"
    plist_path = Path.home() / "Library/LaunchAgents" / f"{label}.plist"


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
    plist_path.parent.mkdir(parents=True, exist_ok=True)

    with open(plist_path, "wb") as f:
        plistlib.dump(plist_content, f)


    # 4. Instructions

if __name__ == "__main__":
    main()
