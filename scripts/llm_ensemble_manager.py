#!/usr/bin/env python3

# 🤖 LLM Ensemble Manager — Динамічний вибір моделей для агентів

import yaml
import random
import time
from typing import Dict, List, Optional

# Завантаження конфігурації
CONFIG_PATH = "/Users/Shared/Predator_60/llm_ensemble_config.yaml"

with open(CONFIG_PATH, "r") as f:
    config = yaml.safe_load(f)

# Статистика моделей
model_stats = {model["name"]: {
    "success_rate": 1.0,
    "response_time": 0.0,
    "last_used": 0,
} for model in config["models"]}


def select_best_model(agent_name: str) -> Optional[Dict]:
    """
    Вибирає найкращу модель для агента на основі конфігурації.
    """
    allowed_models = config["agents"][agent_name]["allowed_models"]
    available_models = [model for model in config["models"] if model["name"] in allowed_models]
    
    # Фільтрація за надійністю
    available_models = [
        model for model in available_models 
        if model["reliability_score"] >= config["selection_strategy"]["min_reliability_score"]
    ]
    
    if not available_models:
        return None
    
    # Вибір моделі на основі пріоритету та надійності
    available_models.sort(key=lambda x: (-x["reliability_score"], x["priority"]))
    best_model = available_models[0]
    
    # Оновлення статистики
    model_stats[best_model["name"]]["last_used"] = time.time()
    return best_model


def update_model_stats(model_name: str, success: bool, response_time: float):
    """
    Оновлює статистику моделі після запиту.
    """
    stats = model_stats[model_name]
    stats["success_rate"] = (stats["success_rate"] * 0.9) + (1.0 if success else 0.0) * 0.1
    stats["response_time"] = (stats["response_time"] * 0.9) + response_time * 0.1


def get_fallback_model(current_model: str) -> Optional[Dict]:
    """
    Повертає fallback модель, якщо поточна модель недоступна.
    """
    available_models = [model for model in config["models"] if model["name"] != current_model]
    available_models.sort(key=lambda x: x["priority"])
    return available_models[0] if available_models else None


def main():
    """
    Демонстрація роботи LLM Ensemble Manager.
    """
    agent_name = "mega_agent"
    best_model = select_best_model(agent_name)
    
    if best_model:
        print(f"🎯 Найкраща модель для {agent_name}: {best_model['name']} (пріоритет: {best_model['priority']})")
        print(f"📊 Надійність: {best_model['reliability_score']}, Вартість: ${best_model['cost_per_1k_tokens'] * 1000:.4f}")
    else:
        print("❌ Немає доступних моделей для агента.")


if __name__ == "__main__":
    main()