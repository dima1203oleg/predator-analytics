import os
import json
import time
import asyncio
import logging
import sys

from predator_common.ai.deepseek_core import DeepSeekCore

# Встановлюємо шляхи
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(PROJECT_ROOT, "services", "synthetic-data-engine", "data")
HISTORY_FILE = os.path.join(DATA_DIR, "known_blueprints.json")
SEED_FILE = os.path.join(DATA_DIR, "seed_blueprints.txt")

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] CLL: %(message)s', handlers=[logging.StreamHandler(sys.stdout)])
logger = logging.getLogger("CLL")

async def run_loop():
    logger.info("🚀 Запуск Continuous Learning Loop (v2.0)")
    
    os.makedirs(DATA_DIR, exist_ok=True)
    
    # Load Seed
    seed_context = ""
    if os.path.exists(SEED_FILE):
        with open(SEED_FILE, "r", encoding="utf-8") as f:
            seed_context = f.read()
    else:
        logger.warning(f"Не знайдено {SEED_FILE}! Генерація буде без початкового контексту.")

    # Load History
    history = []
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                history = json.load(f)
        except Exception:
            history = []

    core = DeepSeekCore()
    iteration = len(history) + 101

    while True:
        logger.info(f"🔄 Початок ітерації {iteration}")
        
        # 1. Generate Novel Blueprint
        logger.info("🧠 Звернення до DeepSeek R1 для генерації нової ідеї...")
        blueprint = await core.generate_novel_blueprint(context_seed=seed_context, history=[h["decision"] for h in history])
        
        logger.info(f"✅ Згенеровано ідею: {blueprint.decision}")
        logger.info(f"📝 Опис: {blueprint.rationale}")
        logger.info(f"⚙️ Параметри: {json.dumps(blueprint.parameters, ensure_ascii=False)}")
        
        if blueprint.decision == "ERROR":
            logger.error("❌ Помилка API. Пауза 60 секунд перед повторною спробою...")
            time.sleep(60)
            continue
            
        # 2. Save to History
        history.append({
            "iteration": iteration,
            "decision": blueprint.decision,
            "rationale": blueprint.rationale,
            "parameters": blueprint.parameters,
            "timestamp": time.time()
        })
        with open(HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(history, f, ensure_ascii=False, indent=2)
            
        logger.info("💾 Ідею збережено в базу знань.")
        
        # 3. Dummy pipeline integration (Here we would call LLMSyntheticGenerator and AutoTrainer)
        logger.info("⚙️ (Заглушка) Синтез даних та тренування моделі...")
        await asyncio.sleep(2)
        
        # 4. Explain Results
        logger.info("🧠 Запит на генерацію фінального аналітичного інсайту...")
        dummy_shap = {"feature_A": 0.5, "feature_B": -0.2}
        dummy_preds = [0.9, 0.1, 0.8]
        explanation = await core.explain_results(shap_values=dummy_shap, predictions=dummy_preds)
        
        logger.info("📊 Фінальний Інсайт:")
        logger.info(explanation)
        
        iteration += 1
        
        logger.info("⏳ Пауза 10 секунд для охолодження GPU...")
        time.sleep(10)

if __name__ == "__main__":
    asyncio.run(run_loop())
