#!/usr/bin/env python3.12
"""
📊 PREDATOR EVOLUTION TRACKER v27.0
------------------------------------
Відстежує метрики еволюції системи та зберігає їх для аналізу.
"""

import asyncio
import json
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List
import subprocess

from libs.core.structured_logger import get_logger

logger = get_logger("predator.evolution_tracker")

METRICS_DIR = Path("metrics/evolution")
METRICS_DIR.mkdir(parents=True, exist_ok=True)

class EvolutionTracker:
    def __init__(self):
        self.start_time = time.time()
        self.metrics_history: List[Dict] = []

    async def collect_metrics(self) -> Dict:
        """Збір всіх метрик системи"""
        metrics = {
            "timestamp": datetime.utcnow().isoformat(),
            "code_quality": await self._analyze_code_quality(),
            "git_stats": await self._get_git_stats(),
            "system_health": await self._check_system_health(),
            "ai_performance": await self._get_ai_performance(),
        }

        self.metrics_history.append(metrics)
        return metrics

    async def _analyze_code_quality(self) -> Dict:
        """Аналіз якості коду"""
        try:
            # Підрахунок рядків коду
            result = subprocess.run(
                ["find", ".", "-name", "*.py", "-not", "-path", "*/venv/*", "-not", "-path", "*/.venv/*", "-exec", "wc", "-l", "{}", "+"],
                capture_output=True,
                text=True,
                cwd=Path.cwd()
            )

            total_lines = 0
            if result.returncode == 0:
                lines = result.stdout.strip().split('\n')
                if lines:
                    last_line = lines[-1].strip()
                    total_lines = int(last_line.split()[0]) if last_line else 0

            # Підрахунок файлів
            py_files = list(Path.cwd().rglob("*.py"))
            py_files = [f for f in py_files if "venv" not in str(f) and ".venv" not in str(f)]

            return {
                "total_lines": total_lines,
                "total_files": len(py_files),
                "avg_lines_per_file": total_lines // len(py_files) if py_files else 0,
            }
        except Exception as e:
            logger.error(f"Помилка аналізу коду: {e}")
            return {"error": str(e)}

    async def _get_git_stats(self) -> Dict:
        """Статистика Git"""
        try:
            # Кількість коммітів за останні 24 години
            result = subprocess.run(
                ["git", "log", "--since=24.hours.ago", "--oneline"],
                capture_output=True,
                text=True,
                cwd=Path.cwd()
            )

            commits_24h = len(result.stdout.strip().split('\n')) if result.stdout.strip() else 0

            # Загальна кількість коммітів
            result_total = subprocess.run(
                ["git", "rev-list", "--count", "HEAD"],
                capture_output=True,
                text=True,
                cwd=Path.cwd()
            )

            total_commits = int(result_total.stdout.strip()) if result_total.returncode == 0 else 0

            # Кількість авторів
            result_authors = subprocess.run(
                ["git", "log", "--format=%an"],
                capture_output=True,
                text=True,
                cwd=Path.cwd()
            )

            authors = set(result_authors.stdout.strip().split('\n')) if result_authors.stdout.strip() else set()

            return {
                "commits_last_24h": commits_24h,
                "total_commits": total_commits,
                "unique_authors": len(authors),
                "autonomous_commits": commits_24h,  # Припускаємо, що всі останні коміти автономні
            }
        except Exception as e:
            logger.error(f"Помилка Git статистики: {e}")
            return {"error": str(e)}

    async def _check_system_health(self) -> Dict:
        """Перевірка здоров'я системи"""
        try:
            # Перевірка існування ключових файлів
            critical_files = [
                "services/api-gateway/app/main.py",
                "services/som/app/main.py",
                "apps/predator-analytics-ui/src/App.tsx",
                "docker-compose.yml",
            ]

            files_ok = sum(1 for f in critical_files if Path(f).exists())

            # Перевірка логів на помилки
            log_files = list(Path("logs").glob("*.log")) if Path("logs").exists() else []

            error_count = 0
            for log_file in log_files:
                try:
                    content = log_file.read_text(encoding="utf-8")
                    error_count += content.lower().count("error")
                except:
                    pass

            return {
                "critical_files_present": files_ok,
                "total_critical_files": len(critical_files),
                "health_score": (files_ok / len(critical_files)) * 100,
                "recent_errors": error_count,
            }
        except Exception as e:
            logger.error(f"Помилка перевірки здоров'я: {e}")
            return {"error": str(e)}

    async def _get_ai_performance(self) -> Dict:
        """Метрики AI агентів"""
        try:
            # Читаємо логи автономного процесора
            log_file = Path("logs/autonomous_processor.log")
            if not log_file.exists():
                return {"status": "no_data"}

            content = log_file.read_text(encoding="utf-8")

            # Підрахунок успішних завдань
            completed_tasks = content.count("completed successfully")
            failed_tasks = content.count("failed")

            # Підрахунок циклів
            cycles = content.count("comprehensive_cycle_completed")

            return {
                "completed_tasks": completed_tasks,
                "failed_tasks": failed_tasks,
                "success_rate": (completed_tasks / (completed_tasks + failed_tasks) * 100) if (completed_tasks + failed_tasks) > 0 else 0,
                "total_cycles": cycles,
            }
        except Exception as e:
            logger.error(f"Помилка AI метрик: {e}")
            return {"error": str(e)}

    async def save_snapshot(self, metrics: Dict):
        """Зберігає snapshot метрик"""
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        snapshot_file = METRICS_DIR / f"snapshot_{timestamp}.json"

        snapshot_file.write_text(json.dumps(metrics, indent=2, ensure_ascii=False), encoding="utf-8")
        logger.info(f"📸 Snapshot збережено: {snapshot_file.name}")

    async def generate_report(self) -> str:
        """Генерує звіт про еволюцію"""
        if not self.metrics_history:
            return "Немає даних для звіту"

        latest = self.metrics_history[-1]

        report = f"""
╔══════════════════════════════════════════════════════════════╗
║           📊 PREDATOR EVOLUTION REPORT v27.0                ║
╚══════════════════════════════════════════════════════════════╝

⏰ Час збору: {latest['timestamp']}

🔧 ЯКІСТЬ КОДУ
  • Всього рядків: {latest['code_quality'].get('total_lines', 'N/A')}
  • Всього файлів: {latest['code_quality'].get('total_files', 'N/A')}
  • Середньо рядків/файл: {latest['code_quality'].get('avg_lines_per_file', 'N/A')}

📝 GIT СТАТИСТИКА
  • Коммітів за 24h: {latest['git_stats'].get('commits_last_24h', 'N/A')}
  • Всього коммітів: {latest['git_stats'].get('total_commits', 'N/A')}
  • Автономних коммітів: {latest['git_stats'].get('autonomous_commits', 'N/A')}

🏥 ЗДОРОВ'Я СИСТЕМИ
  • Оцінка здоров'я: {latest['system_health'].get('health_score', 'N/A'):.1f}%
  • Критичних файлів: {latest['system_health'].get('critical_files_present', 'N/A')}/{latest['system_health'].get('total_critical_files', 'N/A')}
  • Помилок в логах: {latest['system_health'].get('recent_errors', 'N/A')}

🤖 AI ПРОДУКТИВНІСТЬ
  • Завершених завдань: {latest['ai_performance'].get('completed_tasks', 'N/A')}
  • Провалених завдань: {latest['ai_performance'].get('failed_tasks', 'N/A')}
  • Успішність: {latest['ai_performance'].get('success_rate', 'N/A'):.1f}%
  • Всього циклів: {latest['ai_performance'].get('total_cycles', 'N/A')}

╚══════════════════════════════════════════════════════════════╝
        """

        return report

    async def run_continuous_tracking(self, interval_seconds: int = 300):
        """Безперервне відстеження метрик"""
        logger.info(f"🚀 Запуск Evolution Tracker (інтервал: {interval_seconds}s)")

        while True:
            try:
                metrics = await self.collect_metrics()
                await self.save_snapshot(metrics)

                report = await self.generate_report()
                print(report)
                logger.info("✅ Метрики зібрано та збережено")

            except Exception as e:
                logger.error(f"❌ Помилка збору метрик: {e}")

            await asyncio.sleep(interval_seconds)

async def main():
    tracker = EvolutionTracker()

    # Одноразовий збір метрик
    metrics = await tracker.collect_metrics()
    await tracker.save_snapshot(metrics)

    report = await tracker.generate_report()
    print(report)

    # Опціонально: запустити безперервне відстеження
    # await tracker.run_continuous_tracking(interval_seconds=300)

if __name__ == "__main__":
    asyncio.run(main())
