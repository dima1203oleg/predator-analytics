"""
Генератор звітів UTOS.
Збирає дані з різних шарів та формує комплексні звіти.
"""

import json
from datetime import datetime
from typing import Dict, Any, List

class ReportEngine:
    def __init__(self):
        pass

    async def generate_system_report(self, orchestrator_results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Генерує повний звіт про стан системи на основі даних оркестратора.
        """
        status = orchestrator_results.get("overall_status", "UNKNOWN")
        score = orchestrator_results.get("readiness_index", 0.0)
        
        recommendations = self._generate_recommendations(orchestrator_results)

        report = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "utos_version": "61.0-ELITE",
            "status": status,
            "readiness_score": score,
            "layers": orchestrator_results.get("steps", {}),
            "recommendations": recommendations,
            "is_production_ready": score >= 90.0 and status == "PASSED"
        }
        
        return report

    def _generate_recommendations(self, results: Dict[str, Any]) -> List[str]:
        recs = []
        steps = results.get("steps", {})
        for layer, passed in steps.items():
            if not passed:
                recs.append(f"🔴 Критично: Шар '{layer}' не пройшов валідацію. Ініціюйте CicdHealer для відновлення.")
        
        if results.get("readiness_index", 0.0) < 100.0:
            recs.append("⚠️ Деякі некритичні тести пропущені. Перегляньте логи UTOS Orchestrator.")
        else:
            recs.append("✅ Система працює ідеально. Жодних дій не потрібно.")
            
        return recs

report_engine = ReportEngine()
