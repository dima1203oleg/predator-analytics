from __future__ import annotations

import asyncio
import json

from sqlalchemy import select

from libs.core.database import get_db_ctx
from libs.core.models.entities import AugmentedDataset


async def inspect_data():
    async with get_db_ctx() as sess:
        stmt = select(AugmentedDataset.content).limit(1)
        result = await sess.execute(stmt)
        content = result.scalars().first()

        if content:
            try:
                data = json.loads(content)

                # Check for risk_score
                if isinstance(data, dict):
                    if "data" in data and isinstance(data["data"], dict):
                        pass
            except Exception:
                pass
        else:
            pass

if __name__ == "__main__":
    asyncio.run(inspect_data())
