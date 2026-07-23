import asyncio
from app.core.security import get_current_user_payload
import os

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDEiLCJyb2xlIjoidmlwIiwidGVuYW50X2lkIjoiYTAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAxIiwiZXhwIjoxODE2MzE5NzQ5fQ.4qkw97Q-a38TluMWNzt_vJcyUs8tllNGqc44rOPO-NI"

async def test():
    try:
        res = await get_current_user_payload(token)
        print("Success:", res)
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(test())
