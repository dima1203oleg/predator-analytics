from __future__ import annotations

import asyncio
import os
import sys


# Setup paths to import from app
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), "services/api-gateway"))

from app.services.remote_server import remote_server


async def check():
    print("Checking connection to NVIDIA server...")
    success, message = await remote_server.check_connection()
    print(f"Result: {success}")
    print(f"Message: {message}")

    if success:
        print("\nFetching remote status...")
        status = await remote_server.get_remote_status()
        import json
        print(json.dumps(status, indent=2))

if __name__ == "__main__":
    asyncio.run(check())
