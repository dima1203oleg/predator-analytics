from __future__ import annotations


"""
📡 AZR SELF-SCANNER v1.0
========================
Initializes the "Self-Awareness" of the Organism by mapping its own codebase.
Uses ProjectCortex to scan and KnowledgeGraph to remember.

Python 3.12 | Sovereign Engineering
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
from libs.core.azr import get_azr
from libs.core.graph_rag_memory import EdgeType, NodeType, get_knowledge_graph
from libs.core.project_cortex import get_project_cortex


logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("self_scan")

async def run_self_scan():
    logger.info("🚀 INITIALIZING SELF-SCAN PROTOCOL...")

    # 1. Start Project Cortex
    cortex = get_project_cortex(str(PROJECT_ROOT))
    scan_result = cortex.scan_structure()
    logger.info(f"📊 Scan Complete: {scan_result['total_files']} files detected.")

    # 2. Access Knowledge Graph
    kg = get_knowledge_graph()

    # 3. Create Project Root Node
    root_node = kg.add_node(
        NodeType.ENTITY,
        "PREDATOR_21_ROOT",
        {"path": str(PROJECT_ROOT), "scan_time": datetime.now().isoformat()}
    )

    # 4. Map files to KG
    logger.info("🧠 Mapping codebase to Knowledge Graph...")
    count = 0
    for rel_path, info in scan_result['tree'].items():
        # Create node for file
        file_node = kg.add_node(
            NodeType.ENTITY,
            rel_path,
            {
                "type": "source_code",
                "size": info["size"],
                "ext": info["ext"],
                "last_modified": datetime.fromtimestamp(info["modified"]).isoformat()
            }
        )

        # Link to root
        kg.add_edge(root_node.node_id, file_node.node_id, EdgeType.CAUSED, {"relation": "contains"})
        count += 1

        if count % 100 == 0:
            logger.info(f"   Indexed {count} files...")

    # 5. Identify Critical Modules
    critical = cortex.find_critical_modules()
    for mod in critical:
        mod_node = kg.add_node(NodeType.PATTERN, f"CORE_MODULE_{mod.upper()}", {"important": True})
        kg.add_edge(root_node.node_id, mod_node.node_id, EdgeType.RESULTED_IN, {"status": "critical"})

    # 6. Record Truth
    azr = get_azr()
    await azr.initialize()
    azr.truth_ledger.append(
        "AZR_SELF_AWARENESS_INITIALIZED",
        {"files_mapped": count, "critical_modules": critical},
        {"actor": "self_scanner"}
    )

    logger.info("✅ SELF-AWARENESS LOADED. SYSTEM NOW KNOWS ITS OWN STRUCTURE.")

if __name__ == "__main__":
    try:
        asyncio.run(run_self_scan())
    except KeyboardInterrupt:
        pass
    except Exception as e:
        logger.error(f"❌ Scan failed: {e}")
