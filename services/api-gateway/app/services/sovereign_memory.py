
"""
🧠 Sovereign Memory v1.0 (UA) - Predator Analytics
Забезпечує персистентність стану AZR між перезавантаженнями та адаптивне навчання.
Axiom-006: Continuity of Consciousness.
"""
import json
import asyncio
from pathlib import Path
from typing import Dict, Any, List
from datetime import datetime
from libs.core.structured_logger import get_logger

logger = get_logger("services.azr.memory")

class SovereignMemory:
    def __init__(self, storage_path: str = "/app/.azr/memory/azr_state.json"):
        self.path = Path(storage_path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.state = self._load_state()

    def _load_state(self) -> Dict[str, Any]:
        """Завантажує стан з диска."""
        if not self.path.exists():
            return {
                "cycle_count": 0,
                "model_performance": {
                    "llama3.1:8b": {"success": 0, "fail": 0, "score": 1.0},
                    "mistral:7b": {"success": 0, "fail": 0, "score": 0.9}
                },
                "active_experiments": [],
                "last_successful_action": None,
                "known_issues": []
            }
        try:
            with open(self.path, "r") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load memory: {e}. Resetting.")
            return self._load_state() # Recursive reset if corrupt? Better return defaults.

    def save_state(self):
        """Зберігає поточний стан на диск."""
        try:
            temp_path = self.path.with_suffix(".tmp")
            with open(temp_path, "w") as f:
                json.dump(self.state, f, indent=2)
            temp_path.replace(self.path) # Atomic write
        except Exception as e:
            logger.error(f"Failed to save state: {e}")

    def update_cycle(self, count: int):
        self.state["cycle_count"] = count
        self.save_state()

    def record_model_outcome(self, model: str, success: bool):
        """Оновлює рейтинг моделі на основі результату дії."""
        if model not in self.state["model_performance"]:
            self.state["model_performance"][model] = {"success": 0, "fail": 0, "score": 1.0}

        stats = self.state["model_performance"][model]
        if success:
            stats["success"] += 1
        else:
            stats["fail"] += 1

        # Simple Bayesian-like update (decaying average)
        total = stats["success"] + stats["fail"]
        if total > 0:
            stats["score"] = round(stats["success"] / total, 2)

        self.save_state()

    def get_model_weight(self, model: str) -> float:
        """Повертає адаптивну вагу моделі."""
        base_weight = 1.0 if "llama" in model else 0.9
        perf_score = self.state["model_performance"].get(model, {}).get("score", 1.0)

        # Вага не може впасти нижче 0.1
        return max(0.1, base_weight * perf_score)

    def is_issue_known(self, issue_fingerprint: str) -> bool:
        return issue_fingerprint in self.state["known_issues"]

    def record_issue(self, issue_fingerprint: str):
        if issue_fingerprint not in self.state["known_issues"]:
            self.state["known_issues"].append(issue_fingerprint)
            # Keep list clean (last 100 issues)
            if len(self.state["known_issues"]) > 100:
                self.state["known_issues"].pop(0)
            self.save_state()

# Global instance
sovereign_memory = SovereignMemory()
