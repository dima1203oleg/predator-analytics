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
            1: InfraValidator(),
            2: BackendValidator(),
            3: FrontendValidator(),
            4: SyncValidator(),
            5: DatabasesValidator(),
            6: EtlValidator(),
            7: ParsersValidator(),
            8: IntegrationsValidator(),
            9: DatasetsValidator(),
            10: AutoMLValidator(),
            11: LlmValidator(),
            12: AiPipelinesValidator(),
            13: DataFlowValidator(),
            14: PerformanceValidator(),
            15: SecurityValidator(),
            16: BackupValidator(),
            17: E2eValidator()
        }
        self.report_gen = ReportGenerator()

    async def run_all(self, chaos_mode: bool = False) -> Dict[str, Any]:
        """Запуск повної перевірки системи."""
        results = {}
        total_score = 0.0
        max_score = len(self.validators) * 10.0 # 17 рівнів по 10 балів
        
        # Виконання рівнів 1-2 паралельно (інфра, backend)
        tasks_infra = [
            self.validators[1].validate(),
            self.validators[2].validate(),
        ]
        
        infra_res = await asyncio.gather(*tasks_infra, return_exceptions=True)
        for i, level in enumerate([1, 2]):
            results[level] = infra_res[i] if not isinstance(infra_res[i], Exception) else {"level": level, "status": "error", "error": str(infra_res[i])}
            
        # Інші рівні запускаємо послідовно для стабільності
        for level in range(3, 18):
            if level == 14 and not chaos_mode: # Performance testing can be optional/skipped if not chaos_mode
                results[level] = await self.validators[14].validate()
                continue
                
            try:
                res = await self.validators[level].validate()
                results[level] = res
            except Exception as e:
                results[level] = {"level": level, "status": "error", "error": str(e)}

        # Розрахунок Deployment Readiness Index (DRI)
        # pass = 10 балів, warning = 5 балів, fail/error = 0
        for level, res in results.items():
            status = res.get("status", "error")
            if status == "pass":
                total_score += 10.0
            elif status == "warning":
                total_score += 5.0
            elif status == "skip":
                max_score -= 10.0  # Виключаємо з підрахунку

        dri = (total_score / max_score * 100.0) if max_score > 0 else 0.0

        # Критичні рівні: інфраструктура(1), бекенд(2), БД(5), безпека(15)
        critical_levels = [1, 2, 5, 15]
        critical_passed = all(
            results.get(lvl, {}).get("status") in ("pass", "warning")
            for lvl in critical_levels
        )

        is_ready = dri >= 80.0 and critical_passed

        if is_ready and dri == 100.0:
            overall_status = "PREDATOR Analytics повністю працездатна"
        elif is_ready:
            overall_status = f"PREDATOR Analytics готова з обмеженнями (DRI: {round(dri, 1)}%)"
        else:
            overall_status = f"PREDATOR Analytics НЕ готова до експлуатації (DRI: {round(dri, 1)}%)"

        final_report = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "deployment_readiness_index": round(dri, 2),
            "is_ready": is_ready,
            "critical_levels_ok": critical_passed,
            "overall_status": overall_status,
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
