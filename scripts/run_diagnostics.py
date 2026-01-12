
import asyncio
import sys
import os

# Ensure backend modules can be imported
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

try:
    from app.services.diagnostics_service import DiagnosticsService
except ImportError:
    # If standard import fails, try relative path adjustments mostly for script execution context
    sys.path.append('/home/dima/Predator_21/backend')
    from app.services.diagnostics_service import DiagnosticsService

async def main():
    print("🤖 --- STARTING AUTOMATED DIAGNOSTICS ---")
    print("1️⃣  Initializing Service...")
    service = DiagnosticsService()

    print("2️⃣  Running Full Suite (Infra -> AI Brain)...")
    results = await service.run_full_diagnostics()

    print("3️⃣  Generating Report...")
    report = service.generate_report()

    print("\n" + "="*40)
    print(report)
    print("="*40)

if __name__ == "__main__":
    asyncio.run(main())
