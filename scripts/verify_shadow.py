from __future__ import annotations

import asyncio
import os
import sys

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ua-sources")))

from app.services.shadow_service import shadow_service


async def main():

    # 1. List
    docs = shadow_service.list_classified_docs()

    # 2. Decrypt
    target = "omega_directive"
    if target in docs:
        doc = shadow_service.reveal_document(target)
        if doc:
            pass
        else:
            pass

    # 3. Encrypt New
    shadow_service.seal_document("verify_test", {
        "title": "Verification Run",
        "content": "Shadow logic is operational.",
        "clearance": "LOW"
    })

if __name__ == "__main__":
    asyncio.run(main())
