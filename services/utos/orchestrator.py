"""
Оркестратор UTOS v61.0-ELITE.
Координує виконання всіх 8 шарів тестування, обчислює загальний зважений UTOS Score
та будує фінальний звіт у форматі JSON/Markdown.
"""
import asyncio
import time
import logging
from typing import Dict, Any, List

from utos.config import SCORE_WEIGHTS
from utos.layers.infra import InfraLayer
from utos.layers.data import DataLayer
from utos.layers.ai import AiLayer
from utos.layers.api import ApiLayer
from utos.layers.frontend import FrontendLayer
from utos.layers.dom import DomLayer
from utos.layers.security import SecurityLayer
from utos.layers.performance import PerformanceLayer

logger = logging.getLogger(__name__)


class UtosOrchestrator:
    """Керуючий центр UTOS, який об'єднує всі шари валідації."""

    def __init__(self):
        # Реєструємо всі шари відповідно до затверджених ваг
        self.layers = [
            InfraLayer(),
            DataLayer(),
            AiLayer(),
            ApiLayer(),
            FrontendLayer(),
            DomLayer(),
            SecurityLayer(),
            PerformanceLayer(),
        ]

    async def execute_all(self) -> Dict[str, Any]:
        """Запускає паралельну чи послідовну валідацію всіх шарів."""
        logger.info("⚡ Початок повного циклу валідації UTOS...")
        start_time = time.time()

        # Запускаємо всі шари паралельно для швидкості
        tasks = [layer.validate() for layer in self.layers]
        results_list = await asyncio.gather(*tasks)

        elapsed = time.time() - start_time
        logger.info(f"🏁 Валідація всіх шарів завершена за {elapsed:.2f}с")

        # Агрегуємо результати та обчислюємо зважений показник UTOS Score
        results_map = {res["name"]: res for res in results_list}
        
        weighted_score = 0.0
        total_weight_used = 0.0

        for name, layer_res in results_map.items():
            weight = SCORE_WEIGHTS.get(name, 0.0)
            score = layer_res["layer_score"]  # 0.0–1.0
            
            weighted_score += score * weight
            total_weight_used += weight

        # Нормалізуємо фінальний скор до 100-бальної шкали
        final_score = 0.0
        if total_weight_used > 0:
            final_score = (weighted_score / total_weight_used) * 100.0

        # Визначаємо глобальний статус системи
        status = "HEALTHY"
        critical_failed = 0
        total_failed = 0
        total_checks = 0

        for r in results_list:
            total_failed += r["failed"]
            total_checks += r["total_checks"]
            if r["status"] == "fail":
                critical_failed += 1

        if critical_failed > 0:
            status = "CRITICAL"
        elif total_failed > 0:
            status = "WARNING"

        report = {
            "utos_version": "61.0-ELITE",
            "timestamp": time.time(),
            "status": status,
            "utos_score": round(final_score, 2),
            "elapsed_seconds": round(elapsed, 2),
            "total_checks": total_checks,
            "failed_checks": total_failed,
            "critical_layers_failed": critical_failed,
            "layers": results_map
        }

        # Збереження звіту на диск
        import os
        import json
        from utos.config import UTOS_REPORT_DIR
        
        os.makedirs(UTOS_REPORT_DIR, exist_ok=True)
        report_path = os.path.join(UTOS_REPORT_DIR, "latest_report.json")
        try:
            with open(report_path, "w", encoding="utf-8") as f:
                json.dump(report, f, ensure_ascii=False, indent=2)
            logger.info(f"Звіт успішно збережено у {report_path}")
        except Exception as e:
            logger.error(f"Помилка збереження звіту: {e}")

        logger.info(f"📊 Фінальний результат UTOS: Score={report['utos_score']}/100, Статус={status}")
        return report
