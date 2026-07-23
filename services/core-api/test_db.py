import asyncio
from app.services.ukraine_registries import UkraineRegistriesService
from app.services.dossier.ai_profiler import AIProfiler

async def test():
    print("Testing...")
    # we don't actually need DB if ukraine_registries just fetches from APIs?
    # let's just see if we can import
    print("Imports OK")

asyncio.run(test())
