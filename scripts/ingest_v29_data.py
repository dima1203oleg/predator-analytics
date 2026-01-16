import asyncio
import os
import sys

# Додаємо шлях до сервісів
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../services"))

from orchestrator.agents.training_manager import TrainingManager

async def main():
    print("🚀 [PREDATOR DATA INGESTION] Starting...")
    manager = TrainingManager()

    # Шлях до згенерованих даних v29
    synth_dir = "data/training/synthetic_v29"

    if not os.path.exists(synth_dir):
        print(f"❌ Directory {synth_dir} not found. Run scripts/expand_knowledge_base.py first.")
        return

    print(f"📥 Ingesting data from {synth_dir}...")
    ingested = await manager.ingest_synthesized_directory(synth_dir)

    if ingested:
        print(f"✅ Successfully ingested {ingested} records into training set.")

        # Перевіряємо розмір фінального файлу
        if os.path.exists(manager.training_data_path):
            with open(manager.training_data_path, 'r') as f:
                lines = f.readlines()
                print(f"📊 Total dataset size: {len(lines)} records.")
    else:
        print("⚠️ No data was ingested.")

if __name__ == "__main__":
    asyncio.run(main())
