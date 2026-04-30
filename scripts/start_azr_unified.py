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
from pathlib import Path
import sys

# ⚜️ ETERNAL RUNTIME GUARD

# Add project root to path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))


async def main():
    parser = argparse.ArgumentParser(description="🏛️ AZR Unified Launcher")
    parser.add_argument("--hours", type=int, default=24, help="Duration in hours")
    parser.add_argument("--aggressive", action="store_true", help="Enable aggressive mode")
    parser.add_argument("--security-check", action="store_true", help="Run security audit first")
    args = parser.parse_args()


    # Import AZR
    from libs.core.azr_unified import AZRUnifiedOrganism, get_azr_organism

    # Get organism
    organism: AZRUnifiedOrganism = get_azr_organism(PROJECT_ROOT)

    # Set aggressive mode
    if args.aggressive:
        organism._cycle_interval = 30

    # Initialize
    success = await organism.initialize()
    if not success:
        return 1

    # Security check
    if args.security_check:
        audit = await organism.run_security_audit()
        if audit['vulnerability_score'] > 5.0:
            for _rec in audit['recommendations']:
                pass

    # Print status
    organism.get_status()

    # Start

    try:
        await organism.start(args.hours)

        # Keep running
        while organism._running:
            await asyncio.sleep(10)

            # Print periodic status
            if organism._cycle_count > 0 and organism._cycle_count % 10 == 0:
                organism.get_status()

    except KeyboardInterrupt:
        await organism.stop()

    # Final status
    organism.get_status()

    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
