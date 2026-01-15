
import sys
import os
import asyncio
import logging
from datetime import datetime

print("Script started...")

# Add project root and api-gateway to path
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), "services/api-gateway"))

# Configure logging to verify structured logger integration
from libs.core.structured_logger import get_logger, log_business_event

logger = get_logger("verify_azr")

async def verify_azr():
    print("--- 🔍 Verifying AZR (Sovereign Orchestrator) Status ---")

    try:
        from services.orchestrator.agents.v25_sovereign_registry import sovereign_orchestrator

        status = sovereign_orchestrator.get_agent_status()

        print(f"\n✅ AZR Initialized Successfully")
        print(f"   Workspace: {status['workspace']}")
        print(f"   Cycle Count: {status['cycle_count']}")

        print("\n🤖 Agent Status:")
        agents = status['agents']
        active_count = 0
        for agent, is_active in agents.items():
            status_icon = "🟢" if is_active else "🔴"
            print(f"   {status_icon} {agent}: {'Active' if is_active else 'Inactive'}")
            if is_active:
                active_count += 1

        print(f"\n📊 Summary: {active_count}/{len(agents)} Agents Active")

        # Check models
        print("\n🧠 AI Models Configuration:")
        models = status.get('available_models', {})
        for category, model_list in models.items():
            print(f"   - {category}: {', '.join(model_list)}")

        if active_count == 0:
             print("\n⚠️ WARNING: No agents are active. Check API keys in .env")
        else:
             print("\n🚀 AZR is functional and ready for autonomous cycles.")

        # Log a test event to verify structured logging works in this context
        logger.info("azr_verification_completed", active_agents=active_count, status="success")

    except ImportError as e:
        print(f"\n❌ ImportError: {e}")
        print("   Make sure you are running from the project root and PYTHONPATH is set.")
    except Exception as e:
        print(f"\n❌ Error verifying AZR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(verify_azr())
