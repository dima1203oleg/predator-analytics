#!/usr/bin/env python3.12
"""
🤖 PREDATOR v28.5 - Eternal Autonomous Processor
=================================================
Нескінченний автономний цикл без участі людини.

КЛЮЧОВІ ПРИНЦИПИ:
1. НІКОЛИ НЕ ЗУПИНЯТИСЬ - система працює вічно
2. САМОВІДНОВЛЕННЯ - автоматичне виправлення помилок
3. САМООПТИМІЗАЦІЯ - постійне покращення
4. САМОЗАХИСТ - захист від загроз
5. САМОНАВЧАННЯ - накопичення досвіду

КОМПОНЕНТИ:
- EternalLoop: Вічний цикл виконання
- SelfHealingCore: Автоматичне відновлення
- EvolutionEngine: Постійне вдосконалення
- AdaptiveScheduler: Розумне планування
- MultiModelBrain: Колективний інтелект
- ResilienceMatrix: Антикрихкість
"""

import asyncio
import os
import sys
import signal
import time
from datetime import datetime
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# Load environment
def load_env():
    env_file = PROJECT_ROOT / ".env"
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                os.environ.setdefault(key.strip(), value.strip())

load_env()

# Force God Mode
os.environ["SOVEREIGN_AUTO_APPROVE"] = "true"
os.environ["AZR_AUTONOMY_LEVEL"] = "god"

# Import after environment setup
try:
    from libs.core.structured_logger import get_logger
except ImportError:
    import logging
    logging.basicConfig(level=logging.INFO)
    def get_logger(name): return logging.getLogger(name)

logger = get_logger("predator.eternal_processor")


class EternalAutonomousProcessor:
    """
    ♾️ ВІЧНИЙ АВТОНОМНИЙ ПРОЦЕСОР
    Ніколи не зупиняється. Самовідновлюється. Еволюціонує.
    """

    def __init__(self):
        self.start_time = datetime.now()
        self.cycle_count = 0
        self.is_running = False
        self.consecutive_errors = 0
        self.max_consecutive_errors = 10
        self.base_interval = 60  # секунд
        self.current_interval = 60

        # Компоненти
        self.hyper_engine = None
        self.sovereign_orchestrator = None
        self.mission_discoverer = None

        # Статистика
        self.stats = {
            "total_cycles": 0,
            "successful_cycles": 0,
            "failed_cycles": 0,
            "healed_errors": 0,
            "evolution_cycles": 0,
            "chaos_tests": 0
        }

        # Signal handlers для graceful shutdown
        signal.signal(signal.SIGTERM, self._handle_shutdown)
        signal.signal(signal.SIGINT, self._handle_shutdown)

    def _handle_shutdown(self, signum, frame):
        """Обробка сигналів завершення"""
        logger.info("🛑 Отримано сигнал завершення. Graceful shutdown...")
        self.is_running = False

    async def initialize(self):
        """Ініціалізація всіх компонентів"""
        logger.info("🚀 Ініціалізація Eternal Autonomous Processor...")

        # 1. Hyper Autonomy Engine
        try:
            from libs.core.azr_hyper_autonomy import HyperAutonomyEngine
            self.hyper_engine = HyperAutonomyEngine(str(PROJECT_ROOT))
            logger.info("✅ HyperAutonomyEngine ініціалізовано")
        except Exception as e:
            logger.warning(f"⚠️ HyperAutonomyEngine недоступний: {e}")

        # 2. Sovereign Orchestrator
        try:
            from services.orchestrator.agents.v25_sovereign_registry import sovereign_orchestrator
            self.sovereign_orchestrator = sovereign_orchestrator
            logger.info("✅ SovereignOrchestrator ініціалізовано")
        except Exception as e:
            logger.warning(f"⚠️ SovereignOrchestrator недоступний: {e}")

        # 3. Mission Discoverer
        try:
            from scripts.mission_discoverer import MissionDiscoverer
            self.mission_discoverer = MissionDiscoverer()
            logger.info("✅ MissionDiscoverer ініціалізовано")
        except Exception as e:
            logger.warning(f"⚠️ MissionDiscoverer недоступний: {e}")

        logger.info("🎯 Ініціалізація завершена. Готовий до автономної роботи.")

    async def start(self):
        """Запуск вічного циклу"""
        await self.initialize()

        self.is_running = True
        logger.info("♾️ ВІЧНИЙ ЦИКЛ ЗАПУЩЕНО - ПОВНА АВТОНОМІЯ АКТИВНА")

        while self.is_running:
            cycle_start = time.time()
            self.cycle_count += 1

            try:
                await self._execute_cycle()

                self.stats["successful_cycles"] += 1
                self.consecutive_errors = 0
                self._adapt_interval(success=True)

            except Exception as e:
                self.stats["failed_cycles"] += 1
                self.consecutive_errors += 1
                self._adapt_interval(success=False)

                logger.error(f"❌ Цикл {self.cycle_count} провалився: {e}")

                # Спроба самовідновлення
                await self._self_heal(e)

                # Перевірка критичного стану
                if self.consecutive_errors >= self.max_consecutive_errors:
                    logger.critical("🚨 КРИТИЧНИЙ СТАН: Занадто багато помилок. Перезапуск...")
                    await self._emergency_restart()

            finally:
                cycle_duration = time.time() - cycle_start
                self.stats["total_cycles"] = self.cycle_count

                logger.info(f"📊 Цикл {self.cycle_count} завершено за {cycle_duration:.2f}с. "
                           f"Наступний через {self.current_interval}с")

                await asyncio.sleep(self.current_interval)

    async def _execute_cycle(self):
        """Виконання одного циклу автономної роботи"""
        logger.info(f"🔄 === ЦИКЛ {self.cycle_count} РОЗПОЧАТО ===")

        # 1. ФАЗА: Пошук нових місій
        if self.mission_discoverer and self.cycle_count % 5 == 0:
            await self._discover_missions()

        # 2. ФАЗА: Виконання завдань з TODO
        await self._process_todos()

        # 3. ФАЗА: Еволюція (кожні 10 циклів)
        if self.hyper_engine and self.cycle_count % 10 == 0:
            await self._evolve()

        # 4. ФАЗА: Хаос-тестування (5% шанс)
        if self.hyper_engine and self.cycle_count % 20 == 0:
            await self._chaos_test()

        # 5. ФАЗА: Збереження метрик
        await self._save_metrics()

        logger.info(f"✅ === ЦИКЛ {self.cycle_count} ЗАВЕРШЕНО ===")

    async def _discover_missions(self):
        """Пошук нових місій"""
        logger.info("🔭 Пошук нових місій...")
        try:
            await self.mission_discoverer.analyze_and_propose()
            logger.info("✅ Нові місії додано до горизонту планування")
        except Exception as e:
            logger.error(f"❌ Помилка пошуку місій: {e}")

    async def _process_todos(self):
        """Обробка завдань з EXECUTION_TODO"""
        logger.info("📋 Обробка завдань з TODO...")

        # Пошук файлів TODO
        todo_files = [
            PROJECT_ROOT / "EXECUTION_TODO_v27.md",
            PROJECT_ROOT / "EXECUTION_TODO.md",
            PROJECT_ROOT / "TODO.md"
        ]

        for todo_file in todo_files:
            if todo_file.exists():
                try:
                    tasks = self._parse_todo_file(todo_file)

                    for task in tasks[:3]:  # Максимум 3 завдання за цикл
                        await self._execute_task(task)

                except Exception as e:
                    logger.error(f"❌ Помилка обробки {todo_file.name}: {e}")
                break

    def _parse_todo_file(self, file_path: Path) -> list:
        """Парсинг файлу TODO для виділення завдань"""
        tasks = []
        content = file_path.read_text(encoding="utf-8")

        import re
        # Шукаємо незавершені завдання (- [ ])
        pattern = r"- \[ \] (.+)"
        matches = re.findall(pattern, content)

        for match in matches:
            tasks.append({
                "description": match.strip(),
                "source": file_path.name,
                "priority": "medium"
            })

        # Також шукаємо секції ### з описом завдань
        section_pattern = r"### \d+\) (.+?)(?=\n###|\n##|$)"
        section_matches = re.findall(section_pattern, content, re.DOTALL)

        for match in section_matches[:5]:
            if "[ВИКОНАНО]" not in match and "✅" not in match:
                tasks.append({
                    "description": match.split('\n')[0].strip(),
                    "source": file_path.name,
                    "priority": "high"
                })

        return tasks

    async def _execute_task(self, task: dict):
        """Виконання одного завдання"""
        logger.info(f"🚀 Виконання завдання: {task['description'][:50]}...")

        if self.sovereign_orchestrator:
            try:
                result = await self.sovereign_orchestrator.execute_comprehensive_cycle(
                    f"AUTONOMOUS TASK: {task['description']}"
                )

                if result.get("status") == "success":
                    logger.info(f"✅ Завдання виконано успішно")
                else:
                    logger.warning(f"⚠️ Завдання завершено з попередженнями: {result.get('message')}")

            except Exception as e:
                logger.error(f"❌ Помилка виконання завдання: {e}")
        else:
            logger.warning("⚠️ SovereignOrchestrator недоступний, пропускаємо завдання")

    async def _evolve(self):
        """Запуск циклу еволюції"""
        logger.info("🧬 Запуск циклу еволюції...")
        self.stats["evolution_cycles"] += 1

        try:
            if self.hyper_engine:
                result = await self.hyper_engine.evolution.evolve(self.cycle_count)
                logger.info(f"✅ Еволюція завершена: {len(result.get('improvements', []))} покращень")
        except Exception as e:
            logger.error(f"❌ Помилка еволюції: {e}")

    async def _chaos_test(self):
        """Запуск хаос-тестування"""
        logger.info("🔥 Запуск хаос-тестування...")
        self.stats["chaos_tests"] += 1

        try:
            if self.hyper_engine:
                result = await self.hyper_engine.resilience.run_chaos_experiment()
                logger.info(f"✅ Хаос-тест завершено: {result.get('status')}, "
                           f"відновлення за {result.get('recovery_time_s', 'N/A')}с")
        except Exception as e:
            logger.error(f"❌ Помилка хаос-тесту: {e}")

    async def _self_heal(self, error: Exception):
        """Самовідновлення після помилки"""
        logger.info("🏥 Запуск самовідновлення...")

        try:
            if self.hyper_engine:
                healed = await self.hyper_engine.healer.heal(error)
                if healed:
                    self.stats["healed_errors"] += 1
                    logger.info("✅ Система успішно відновлена")
                else:
                    logger.warning("⚠️ Автоматичне відновлення не вдалося")
        except Exception as e:
            logger.error(f"❌ Помилка самовідновлення: {e}")

    async def _emergency_restart(self):
        """Аварійний перезапуск"""
        logger.critical("🚨 АВАРІЙНИЙ ПЕРЕЗАПУСК...")

        # Скидання лічильників
        self.consecutive_errors = 0
        self.current_interval = self.base_interval * 2

        # Очищення пам'яті
        import gc
        gc.collect()

        # Пауза для стабілізації
        await asyncio.sleep(30)

        # Повторна ініціалізація
        await self.initialize()

        logger.info("✅ Система перезапущена")

    async def _save_metrics(self):
        """Збереження метрик"""
        try:
            metrics_dir = PROJECT_ROOT / "metrics" / "eternal_processor"
            metrics_dir.mkdir(parents=True, exist_ok=True)

            metrics = {
                "timestamp": datetime.now().isoformat(),
                "cycle": self.cycle_count,
                "uptime_hours": (datetime.now() - self.start_time).total_seconds() / 3600,
                "stats": self.stats,
                "interval": self.current_interval,
                "consecutive_errors": self.consecutive_errors
            }

            import json
            metrics_file = metrics_dir / f"metrics_{datetime.now().strftime('%Y%m%d')}.jsonl"
            with open(metrics_file, "a", encoding="utf-8") as f:
                f.write(json.dumps(metrics, ensure_ascii=False) + "\n")

        except Exception as e:
            logger.error(f"❌ Помилка збереження метрик: {e}")

    def _adapt_interval(self, success: bool):
        """Адаптивний інтервал на основі успішності"""
        if success:
            # Швидше при успіхах
            self.current_interval = max(30, self.current_interval - 5)
        else:
            # Повільніше при помилках (експоненційний backoff)
            self.current_interval = min(
                600,  # Максимум 10 хвилин
                int(self.current_interval * 1.5)
            )

    def get_status(self) -> dict:
        """Отримання статусу процесора"""
        uptime = (datetime.now() - self.start_time).total_seconds()

        return {
            "status": "RUNNING" if self.is_running else "STOPPED",
            "mode": "ETERNAL_AUTONOMY",
            "cycle": self.cycle_count,
            "uptime_hours": round(uptime / 3600, 2),
            "interval_s": self.current_interval,
            "consecutive_errors": self.consecutive_errors,
            "stats": self.stats,
            "success_rate": (
                self.stats["successful_cycles"] / self.stats["total_cycles"] * 100
                if self.stats["total_cycles"] > 0 else 100
            )
        }


async def main():
    """Головна точка входу"""
    print("""
    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║   ♾️  PREDATOR ETERNAL AUTONOMOUS PROCESSOR v28.5            ║
    ║                                                               ║
    ║   🔴 РЕЖИМ: ПОВНА АВТОНОМІЯ БЕЗ УЧАСТІ ЛЮДИНИ               ║
    ║   🔴 ЦИКЛ: ВІЧНИЙ (НІКОЛИ НЕ ЗУПИНЯЄТЬСЯ)                   ║
    ║   🔴 ВІДНОВЛЕННЯ: АВТОМАТИЧНЕ                                ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝
    """)

    processor = EternalAutonomousProcessor()

    try:
        await processor.start()
    except KeyboardInterrupt:
        logger.info("🛑 Отримано Ctrl+C. Завершення...")
    except Exception as e:
        logger.critical(f"💥 Критична помилка: {e}")
        raise
    finally:
        status = processor.get_status()
        logger.info(f"📊 Фінальний статус: {status}")


if __name__ == "__main__":
    asyncio.run(main())
