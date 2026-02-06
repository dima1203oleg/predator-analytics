from __future__ import annotations


#!/usr/bin/env python3
"""
📊 AZR MONITOR - Real-time Sovereign Dashboard
==============================================

Displays the live status of the AZR Unified Organism.

Usage:
    python3 scripts/monitor_azr.py
"""

import asyncio
from datetime import datetime
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
                print("⏳ Waiting for AZR logs to appear...")
                time.sleep(2)
                continue

            try:
                status = get_status()

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
                print("=" * 60)
                print(f"🏛️  AZR UNIFIED ORGANISM v{status['version']} (SOVEREIGN)")
                print("=" * 60)

                print("\n📊 STATUS")
                print(f"  • Running:      {'✅ Yes' if status['running'] else '❌ No'}")
                print(f"  • Phase:        {status['phase'].upper()}")
                print(f"  • Cycles:       {status['cycle_count']}")
                print(f"  • Ledger Size:  {status['truth_ledger']['entries']} entries")
                print(f"  • Integrity:    {'✅ Valid' if status['truth_ledger']['valid'] else '❌ Invalid'}")

                print(f"\n🩺 HEALTH {get_health_emoji(status['health']['score'])}")
                print(f"  • Overall:      {status['health']['score']:.1f}%")
                print(f"  • CPU:          {status['health']['cpu']:.1f}%")
                print(f"  • Memory:       {status['health']['memory']:.1f}%")

                print(f"\n🧠 CAPABILITIES ({len(status['capabilities'])})")
                print(f"  • {' | '.join(status['capabilities'][:4])}...")

                print("\n⚡ LATEST DECISIONS")
                if not decisions:
                    print("  (No recent decisions)")
                for d in decisions[:5]:
                    print(f"  • {d}")

                print("\n📈 METRICS")
                print(f"  • Executed: {status['metrics']['executed']}")
                print(f"  • Blocked:  {status['metrics']['blocked']}")
                print(f"  • Rollbacks:{status['metrics']['rollbacks']}")

                print("\n" + "=" * 60)
                print(f"🕒 Last Update: {datetime.now().strftime('%H:%M:%S')} (Press Ctrl+C to exit)")

            except Exception as e:
                print(f"Error reading status: {e}")

            time.sleep(2)

    except KeyboardInterrupt:
        print("\n👋 Monitor closed.")

if __name__ == "__main__":
    main()
