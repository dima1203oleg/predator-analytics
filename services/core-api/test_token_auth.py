import asyncio
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.core.config import settings

async def main():
    print(f"ENV is {settings.ENV}")

if __name__ == "__main__":
    asyncio.run(main())
