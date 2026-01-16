import asyncio
import os
import sys

# Додаємо шлях до сервісів
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../services"))

from orchestrator.agents.training_manager import TrainingManager

async def main():
    print("🚀 [PREDATOR TRAINING CYCLE] Starting...")
    manager = TrainingManager()

    # Перевіряємо скільки даних у нас є
    current_size = 0
    if os.path.exists(manager.training_data_path):
        with open(manager.training_data_path, 'r') as f:
            current_size = len(f.readlines())

    print(f"📊 Current dataset size: {current_size} records.")

    # Запускаємо цикл перевірки та навчання
    # Передаємо current_size, TrainingManager сам вирішить чи тренувати (поріг 50)
    success = await manager.check_data_and_train(current_size)

    if success:
        print("🏆 Training cycle COMPLETED and model PROMOTED.")
    else:
        print("⚠️ Training cycle finished (either threshold not met or model not better).")

if __name__ == "__main__":
    asyncio.run(main())
