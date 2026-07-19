#!/usr/bin/env python3
"""
🚀 PREDATOR Diagnostics Suite v61.0-ELITE
Запускає всі валідатори по черзі для повної перевірки системи.
"""
import asyncio
import json
import logging
import os
import sys
from datetime import datetime

# Додаємо шлях до проекту, щоб імпорти працювали
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, PROJECT_ROOT)
sys.path.insert(0, os.path.join(PROJECT_ROOT, "services", "_adv_dvs_archived"))

# Встановлюємо NVIDIA сервер як ціль для валідаторів
os.environ["TARGET_HOST"] = "194.177.1.240"

# Налаштування логування
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("diagnostics_runner")

# Кольори для виводу
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_header():
    """Друкує заголовок."""
    print(f"{Colors.BOLD}{Colors.RED}{'='*80}")
    print("🛡️  PREDATOR DIAGNOSTICS SUITE v61.0-ELITE")
    print(f"{'='*80}{Colors.ENDC}")
    print(f"Запущено: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

def print_summary(results: list, total_time: float):
    """Друкує фінальний звіт."""
    print(f"\n{Colors.BOLD}{Colors.HEADER}{'='*80}")
    print("🏁 ДІАГНОСТИКУ ЗАВЕРШЕНО")
    print(f"{'='*80}{Colors.ENDC}")

    total_checks = sum(r['total_checks'] for r in results)
    total_passed = sum(r['passed'] for r in results)
    total_failed = sum(r['failed'] for r in results)
    
    overall_status = "✅ HEALTHY"
    if total_failed > 0:
        critical_failures = any(r['status'] == 'fail' for r in results)
        overall_status = "❌ CRITICAL" if critical_failures else "⚠️ DEGRADED"

    print(f"\n{Colors.BOLD}Загальний статус системи: {overall_status}{Colors.ENDC}")
    print(f"Загальний час виконання: {total_time:.2f}с")
    print(f"Перевірок виконано: {total_checks} (Пройдено: {Colors.GREEN}{total_passed}{Colors.ENDC}, Провалено: {Colors.RED}{total_failed}{Colors.ENDC})")

    if total_failed > 0:
        print(f"\n{Colors.YELLOW}Проблемні модулі:{Colors.ENDC}")
        for r in results:
            if r['status'] != 'pass':
                icon = "❌" if r['status'] == 'fail' else "⚠️"
                print(f"  {icon} {r['name']}: {r['failed']} з {r['total_checks']} перевірок провалено")
                for error_msg in r['errors'][:3]: # Show first 3 errors
                    print(f"    - {error_msg}")

async def main():
    """Головна функція для запуску валідаторів."""
    print_header()
    
    try:
        from services._adv_dvs_archived.validators import VALIDATORS
    except ImportError as e:
        logger.error(f"Не вдалося імпортувати валідатори: {e}")
        logger.error("Переконайтесь, що ви запускаєте скрипт з кореневої папки проекту або що шляхи налаштовані правильно.")
        return

    full_report = []
    start_time = datetime.now()

    for validator_class in VALIDATORS:
        validator_instance = validator_class()
        result = await validator_instance.validate()
        full_report.append(result)

    end_time = datetime.now()
    total_duration = (end_time - start_time).total_seconds()

    # Збереження звіту
    report_dir = os.path.join(PROJECT_ROOT, "reports")
    os.makedirs(report_dir, exist_ok=True)
    report_path = os.path.join(report_dir, f"diagnostics_report_{start_time.strftime('%Y%m%d_%H%M%S')}.json")
    
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(full_report, f, indent=2, ensure_ascii=False)

    print_summary(full_report, total_duration)
    logger.info(f"Повний звіт збережено у: {report_path}")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("\nДіагностику перервано користувачем.")