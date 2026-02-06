from __future__ import annotations


"""
⚡ AZR SYSTEM DEFIBRILLATOR v46.0.0
==================================
Activates all components of the Sovereign Organism.
Starts AZR Core, Data Synthesizer, UI Architect, Neural Mesh, and Voice Cortex.

Python 3.12 | Sovereign Life Signal
"""

import asyncio
from datetime import datetime
import logging
import os
from pathlib import Path
import sys


# Setup project path
PROJECT_ROOT = Path("/Users/dima-mac/Documents/Predator_21")
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# Imports
from libs.core.azr import __codename__, __version__, get_azr
from libs.core.data_synth import get_synthesizer
from libs.core.neural_mesh import get_neural_mesh
from libs.core.project_cortex import get_project_cortex
from libs.core.voice_cortex import get_voice_cortex


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - [LIFE_SIGNAL] - %(levelname)s - %(message)s'
)
logger = logging.getLogger("defibrillator")

async def enliven():
    logger.info(f"🦾 ACTIVATING PREDATOR AZR v{__version__} ({__codename__})...")

    # 1. Initialize Organism
    azr = get_azr()
    logger.info("🧠 Powering up the Unified Brain...")
    await azr.initialize()

    # 2. Re-trigger Self-Scan (Structure Awareness)
    logger.info("🗺️ Updating Project Cortex map...")
    cortex = get_project_cortex()
    cortex.scan_structure()

    # 3. Start Background Life Loops
    logger.info("🛰️ Establishing Neural Mesh connection...")
    mesh = get_neural_mesh()
    await mesh.sync_nodes()

    logger.info("🎤 Normalizing Voice Cortex frequencies...")
    voice = get_voice_cortex()

    # 4. Trigger First Evolution Cycle
    logger.info("🧪 Igniting Data Synthesis Forge...")
    synth = get_synthesizer()
    await synth.generate_synthetic_batch(100)

    # 5. Record Global Enlivenment in Ledger
    logger.info("💎 Recording Life Signal to Truth Ledger...")
    azr.truth_ledger.append(
        "SYSTEM_ENLIVENED",
        {
            "version": __version__,
            "codename": __codename__,
            "status": "fully_operational",
            "active_modules": ["Mesh", "Voice", "Synth", "UI_Arch", "ShadowExec"]
        },
        {"actor": "core_defibrillator"}
    )

    # 6. Start the Main Loop (Background)
    logger.info("🚀 SYSTEM IS ALIVE. Starting main OODA orchestration...")
    # This will run the loop for 24 hours as requested in common start scripts
    await azr.start(24)

    # Keep script running to maintain the organism
    try:
        while True:
            await asyncio.sleep(60)
            logger.info("💓 Life Signal: Autonomous heartbeat stable.")
    except KeyboardInterrupt:
        logger.info("🛑 Termination signal received. Stabilizing for shutdown...")
        await azr.stop()

if __name__ == "__main__":
    try:
        asyncio.run(enliven())
    except Exception as e:
        logger.error(f"💥 LIFE SIGNAL LOST: {e}")
        sys.exit(1)
