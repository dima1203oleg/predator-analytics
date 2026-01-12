import asyncio
import logging
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.append(str(Path(__file__).resolve().parents[1]))

from libs.agents.graph import create_agent_graph

# Setup basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_agent")

async def test_agent():
    print("\n--- Testing Predator Agent Graph (Lite) ---\n")

    # 1. Create Graph
    try:
        graph = create_agent_graph()
        print("✅ Agent Graph compiled successfully.")
    except Exception as e:
        print(f"❌ Failed to compile graph: {e}")
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

    print(f"Testing Query: '{user_query}'")

    # 3. Invoke Graph
    try:
        final_state = await graph.ainvoke(initial_state)

        print("\n--- Execution Finished ---")
        print(f"Final Step: {final_state.get('current_step')}")

        if final_state.get("error"):
            print(f"❌ Error: {final_state['error']}")
        else:
            last_out = final_state.get("last_output", {})
            print("✅ Success!")
            print(f"Result: {last_out}")

    except Exception as e:
        print(f"❌ Runtime Exception: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_agent())
