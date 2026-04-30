from __future__ import annotations

#!/usr/bin/env python3
"""
📊 AZR MONITOR - Real-time Sovereign Dashboard
==============================================

Displays the live status of the AZR Unified Organism.

Usage:
    python3 scripts/monitor_azr.py
"""

import json
import os
from pathlib import Path
import sys
import time

# Add project root
sys.path.insert(0, str(Path(__file__).parent.parent))

from libs.core.azr import get_status


def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

def get_health_emoji(score):
    if score >= 90: return "💚"
    if score >= 70: return "💛"
    return "❤️"

def main():
    try:
        while True:
            # Check if logs exist
            if not os.path.exists("/tmp/azr_logs/truth_ledger.jsonl"):
                time.sleep(2)
                continue

            try:
                get_status()

                # Get latest decisions from ledger
                decisions = []
                with open("/tmp/azr_logs/truth_ledger.jsonl") as f:
                    lines = f.readlines()
                    for line in reversed(lines[-10:]):
                        try:
                            entry = json.loads(line)
                            if entry["event_type"] == "AZR_DECISION":
                                d = entry["payload"]
                                decisions.append(f"{entry['timestamp'][11:19]} | {d['action_type']} | {'✅' if d['approved'] else '❌'}")
                        except: pass

                clear_screen()




                if not decisions:
                    pass
                for d in decisions[:5]:
                    pass



            except Exception:
                pass

            time.sleep(2)

    except KeyboardInterrupt:
        pass

if __name__ == "__main__":
    main()
