"""Модуль для самовідновлення (Self-Healing) та інтеграції з CI/CD.
"""
import logging
import subprocess
from typing import Any

logger = logging.getLogger(__name__)

class CicdHealer:
    def __init__(self):
        pass

    async def trigger_recovery(self, service: str, error_context: dict[str, Any]) -> bool:
        """Запускає процес відновлення для сервісу.
        """
        logger.warning(f"🔧 Ініційовано автоматичне відновлення для {service}. Контекст: {error_context}")

        try:
            # Спроба перезапустити контейнер через Helm або kubectl
            # Для Autonomous Factory це може бути запуск recovery скрипта
            cmd = f"kubectl rollout restart deployment {service} -n predator"
            proc = subprocess.run(cmd, shell=True, capture_output=True, text=True)

            if proc.returncode == 0:
                logger.info(f"✅ Успішне відновлення {service}")
                return True
            else:
                logger.error(f"❌ Помилка відновлення {service}: {proc.stderr}")
                # Fallback: rollback
                return await self.rollback_deployment(service)
        except Exception as e:
            logger.error(f"🔥 Критична помилка під час відновлення {service}: {e}")
            return False

    async def rollback_deployment(self, service: str) -> bool:
        """Відкат до попередньої стабільної версії через Helm/ArgoCD.
        """
        logger.warning(f"⏪ Виконується відкат (rollback) для {service}")
        try:
            # Команда відкату Helm (спрощено)
            cmd = "helm rollback predator -n predator"
            proc = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            return proc.returncode == 0
        except Exception as e:
            logger.error(f"Критична помилка відкату: {e}")
            return False

healer = CicdHealer()
