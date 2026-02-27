#!/usr/bin/env python3.12
"""🏛️ AZR UNIFIED LAUNCHER - Start the Sovereign System
=====================================================

This script starts the AZR Unified Organism with all v40 components.

Usage:
    python3 scripts/start_azr_unified.py [--hours 24] [--aggressive]

Options:
    --hours N       : Run for N hours (default: 24)
    --aggressive    : Enable aggressive mode (faster cycles)
    --security-check: Run security audit before starting

Python 3.12 | Ukrainian Documentation
"""

from __future__ import annotations

import argparse
import asyncio
import os
from pathlib import Path
import sys


# ⚜️ ETERNAL RUNTIME GUARD
if sys.version_info < (3, 12):
    print("\n" + "!"*80, file=sys.stderr)
    print("❌ FATAL: RUNTIME VERSION MISMATCH", file=sys.stderr)
    print("   PREDATOR ANALYTICS v45+ STRICTLY REQUIRES PYTHON 3.12.", file=sys.stderr)
    print(f"   DETECTED: {sys.version}", file=sys.stderr)
    print("!"*80 + "\n", file=sys.stderr)
    sys.exit(1)

# Add project root to path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))


async def main():
    parser = argparse.ArgumentParser(description="🏛️ AZR Unified Launcher")
    parser.add_argument("--hours", type=int, default=24, help="Duration in hours")
    parser.add_argument("--aggressive", action="store_true", help="Enable aggressive mode")
    parser.add_argument("--security-check", action="store_true", help="Run security audit first")
    args = parser.parse_args()

    print("=" * 60)
    print("🏛️ AZR UNIFIED ORGANISM v40.0.0 (SOVEREIGN)")
    print("=" * 60)

    # Import AZR
    from libs.core.azr_unified import AZRUnifiedOrganism, get_azr_organism

    # Get organism
    organism: AZRUnifiedOrganism = get_azr_organism(PROJECT_ROOT)

    # Set aggressive mode
    if args.aggressive:
        organism._cycle_interval = 30
        print("⚡ Aggressive mode enabled (30s cycles)")

    # Initialize
    print("\n🔧 Initializing...")
    success = await organism.initialize()
    if not success:
        print("❌ Failed to initialize AZR")
        return 1

    # Security check
    if args.security_check:
        print("\n🔐 Running security audit...")
        audit = await organism.run_security_audit()
        print(f"  Vulnerability Score: {audit['vulnerability_score']}/10.0")
        print(f"  Block Rate: {audit['block_rate']}")
        if audit['vulnerability_score'] > 5.0:
            print("⚠️  HIGH VULNERABILITY SCORE - Review recommendations!")
            for rec in audit['recommendations']:
                print(f"    • {rec}")

    # Print status
    print("\n📊 Initial Status:")
    status = organism.get_status()
    print(f"  Version: {status['version']}")
    print(f"  Health Score: {status['health']['score']:.1f}%")
    print(f"  Capabilities: {len(status['capabilities'])}")
    print(f"  Truth Ledger Entries: {status['truth_ledger']['entries']}")

    # Start
    print(f"\n🚀 Starting AZR for {args.hours} hours...")
    print("  Press Ctrl+C to stop\n")

    try:
        await organism.start(args.hours)

        # Keep running
        while organism._running:
            await asyncio.sleep(10)

            # Print periodic status
            if organism._cycle_count > 0 and organism._cycle_count % 10 == 0:
                status = organism.get_status()
                print(f"[Cycle {organism._cycle_count}] "
                      f"Health: {status['health']['score']:.1f}% | "
                      f"Executed: {status['metrics']['executed']} | "
                      f"Blocked: {status['metrics']['blocked']}")

    except KeyboardInterrupt:
        print("\n\n🛑 Stopping AZR...")
        await organism.stop()

    # Final status
    print("\n📋 Final Status:")
    status = organism.get_status()
    print(f"  Cycles Completed: {status['cycle_count']}")
    print(f"  Actions Executed: {status['metrics']['executed']}")
    print(f"  Actions Blocked: {status['metrics']['blocked']}")
    print(f"  Ledger Entries: {status['truth_ledger']['entries']}")
    print(f"  Ledger Valid: {status['truth_ledger']['valid']}")

    print("\n✅ AZR Unified shutdown complete")
    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
