import os
import json
import time
import asyncio
import logging
import sys

from predator_common.ai.deepseek_core import DeepSeekCore
import pandas as pd
from services.synthetic_data_engine.app.engine import DatasetGeneratorTrainer
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
        
        # 3. Реальний пайплайн: генеруємо синтетичні дані та тренуємо модель
        logger.info("⚙️ Синтез даних та тренування моделі...")
        
        # Створюємо мапер схеми
        def map_deepseek_schema_to_faker(schema_or_list):
            faker_schema = {}
            keys = schema_or_list if isinstance(schema_or_list, list) else (schema_or_list.keys() if isinstance(schema_or_list, dict) else ["feature_A", "feature_B"])
            for k in keys:
                k_lower = str(k).lower()
                if "id" in k_lower:
                    faker_schema[k] = "uuid4"
                elif "дата" in k_lower or "date" in k_lower or "час" in k_lower:
                    faker_schema[k] = "date_this_year"
                elif "компанія" in k_lower or "назва" in k_lower or "ім'я" in k_lower:
                    faker_schema[k] = "company"
                elif "сума" in k_lower or "вартість" in k_lower or "amount" in k_lower or "value" in k_lower:
                    faker_schema[k] = "pyfloat:min_value=100,max_value=500000"
                elif "країна" in k_lower or "country" in k_lower:
                    faker_schema[k] = "country"
                elif "код" in k_lower or "code" in k_lower or "edrpou" in k_lower:
                    faker_schema[k] = "numerify:########"
                elif "ризик" in k_lower or "risk" in k_lower or "score" in k_lower:
                    faker_schema[k] = "random_int:min=0,max=100"
                else:
                    faker_schema[k] = "word"
            if "risk_score" not in faker_schema:
                faker_schema["risk_score"] = "random_int:min=0,max=1" # binary classification
            return faker_schema

        custom_schema = map_deepseek_schema_to_faker(blueprint.parameters)
        
        engine = DatasetGeneratorTrainer()
        zero_shot_result = await engine.zero_shot(domain="custom", num_rows=100, custom_schema=custom_schema)
        
        synthetic_path = zero_shot_result["dataset_path"]
        logger.info(f"💾 Синтетичні дані згенеровано: {synthetic_path}")
        
        synthetic_df = pd.read_parquet(synthetic_path)
        
        # Оскільки у нас ще немає реальних даних для гібриду, робимо "гібрид" на базі самої синтетики
        hybrid_result = await engine.hybrid_pipeline(
            real_data=synthetic_df,
            target_column="risk_score",
            synthetic_ratio=0.5
        )
        
        logger.info(f"✅ Модель натреновано! Model Card: {hybrid_result['model_card_path']}")
        
        # 4. Explain Results
        logger.info("🧠 Запит на генерацію фінального аналітичного інсайту...")
        metrics = hybrid_result["metrics"]
        dummy_shap = {"top_feature": 0.8, "secondary_feature": -0.3}
        dummy_preds = [0.9, 0.1, 0.8]
        explanation = await core.explain_results(shap_values=dummy_shap, predictions=dummy_preds)
        
        logger.info("📊 Фінальний Інсайт:")
        logger.info(explanation)
        
        iteration += 1
        
        logger.info("⏳ Пауза 10 секунд для охолодження GPU...")
        time.sleep(10)

if __name__ == "__main__":
    asyncio.run(run_loop())
