from __future__ import annotations

import asyncio
import json
import os

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
                print("--- DATA SAMPLE START ---")
                print(json.dumps(data, indent=2))
                print("--- DATA SAMPLE END ---")

                # Check for risk_score
                if isinstance(data, dict):
                    print(f"Direct keys: {list(data.keys())}")
                    if "data" in data and isinstance(data["data"], dict):
                        print(f"Keys inside 'data': {list(data['data'].keys())}")
            except Exception as e:
                print(f"JSON Parse Error: {e}")
        else:
            print("No data found.")

if __name__ == "__main__":
    asyncio.run(inspect_data())
