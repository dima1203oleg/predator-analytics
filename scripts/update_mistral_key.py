from app.core.llm_keys_storage import llm_keys_storage
import asyncio

async def add_mistral():
    key = "wAp8islIU7ZK24G7cRDrfttvYBIfMKKc"
    print("Adding Mistral key...")
    success = await llm_keys_storage.add_llm_key("mistral", key)
    if success:
        print("✅ Mistral key added successfully to storage.")
    else:
        print("❌ Failed to add Mistral key.")

if __name__ == "__main__":
    asyncio.run(add_mistral())
