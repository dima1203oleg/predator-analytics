from __future__ import annotations

import asyncio
import os
import sys

# Setup paths to import from app
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), "services/api_gateway"))

from app.services.remote_server import remote_server


async def check():
    success, _message = await remote_server.check_connection()

    if success:
        await remote_server.get_remote_status()

if __name__ == "__main__":
    asyncio.run(check())
