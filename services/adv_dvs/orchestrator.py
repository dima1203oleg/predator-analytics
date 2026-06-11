import asyncio
import logging
from typing import Dict, Any
from datetime import datetime, timezone

from .validators import *
from .report_generator import ReportGenerator

logger = logging.getLogger(__name__)

class AdvDvsOrchestrator:
    """
    Головний оркестратор ADV-DVS.
    Відповідає за запуск валідаторів, агрегацію результатів та розрахунок Deployment Readiness Index.
    """
    
    def __init__(self):
        self.validators = {
            1: Level1InfraValidator(),
            2: Level2ContainersValidator(),
            3: Level3DatabasesValidator(),
            4: Level4DOMValidator(),
            5: Level5JourneyValidator(),
            6: Level6ApiValidator(),
            7: Level7EtlValidator(),
            8: Level8TelegramValidator(),
            9: Level9AiValidator(),
            10: Level10ObservabilityValidator(),
            11: Level11SecurityValidator(),
            12: Level12ChaosValidator()
        }
        self.report_gen = ReportGenerator()

    async def run_all(self, chaos_mode: bool = False) -> Dict[str, Any]:
        """Запуск повної перевірки системи."""
        results = {}
        total_score = 0.0
        max_score = 120.0 # 12 рівнів по 10 балів (або ваги)
        
        # Виконання рівнів 1-3 паралельно (інфра)
        tasks_infra = [
            self.validators[1].validate(),
            self.validators[2].validate(),
            self.validators[3].validate()
        ]
        
        infra_res = await asyncio.gather(*tasks_infra, return_exceptions=True)
        for i, level in enumerate([1, 2, 3]):
            results[level] = infra_res[i] if not isinstance(infra_res[i], Exception) else {"level": level, "status": "error", "error": str(infra_res[i])}
            
        # Інші рівні можна запускати теж паралельно або послідовно (DOM/Journey краще послідовно для стабільності)
        for level in range(4, 13):
            if level == 12 and not chaos_mode:
                results[level] = await self.validators[12].validate() # поверне warning/skip
                continue
                
            try:
                res = await self.validators[level].validate()
                results[level] = res
            except Exception as e:
                results[level] = {"level": level, "status": "error", "error": str(e)}

        # Розрахунок Deployment Readiness Index (DRI)
        for level, res in results.items():
            status = res.get("status", "error")
            if status == "pass":
                total_score += 10.0
            elif status == "warning":
                total_score += 5.0
            elif status == "skip":
                max_score -= 10.0 # Виключаємо з підрахунку
                
        dri = (total_score / max_score * 100) if max_score > 0 else 0
        
        # Перевірка критерію успіху (100% критичних працюють, DRI >= 95%)
        critical_passed = all(results[L].get("status") in ["pass", "warning", "skip"] for L in [1,2,3,6])
        is_ready = critical_passed and dri >= 95.0
        
        final_report = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "deployment_readiness_index": round(dri, 2),
            "is_ready": is_ready,
            "overall_status": "PREDATOR Analytics повністю працездатна" if is_ready else "PREDATOR Analytics не готова до експлуатації",
            "levels": results
        }
        
        # Генерація файлів звіту
        await self.report_gen.generate_reports(final_report)
        
        return final_report

    async def run_level(self, level: int) -> Dict[str, Any]:
        """Запуск перевірки конкретного рівня."""
        if level not in self.validators:
            raise ValueError(f"Unknown level: {level}")
        return await self.validators[level].validate()
