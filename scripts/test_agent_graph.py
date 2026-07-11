from __future__ import annotations

import asyncio
import logging
from pathlib import Path
import sys

# Add project root to sys.path
sys.path.append(str(Path(__file__).resolve().parents[1]))

from libs.agents.graph import create_agent_graph

# Setup basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_agent")

async def test_agent():

    # 1. Create Graph
    try:
        graph = create_agent_graph()
    except Exception:
        return

    # 2. Define Test Input
    user_query = "List the contents of the current directory."
    initial_state = {
        "messages": [{"role": "user", "content": user_query}],
        "context": {
            "original_request": user_query
        },
        "current_step": "START",
        "error": None
    }


    # 3. Invoke Graph
    try:
        final_state = await graph.ainvoke(initial_state)


        if final_state.get("error"):
            pass
        else:
            final_state.get("last_output", {})

    except Exception:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_agent())
