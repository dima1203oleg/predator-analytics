from __future__ import annotations

import asyncio
import os
import sys

# Ensure backend modules can be imported
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

try:
    from app.services.diagnostics_service import DiagnosticsService
except ImportError:
    # If standard import fails, try relative path adjustments mostly for script execution context
    sys.path.append('/home/dima/Predator_21/backend')
    from app.services.diagnostics_service import DiagnosticsService

async def main():
    service = DiagnosticsService()

    await service.run_full_diagnostics()

    service.generate_report()


if __name__ == "__main__":
    asyncio.run(main())
