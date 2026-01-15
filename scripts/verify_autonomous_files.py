#!/usr/bin/env python3
"""
Швидка перевірка файлів Autonomous Intelligence v2.0
Перевіряє наявність всіх створених файлів
"""
import os
from pathlib import Path

def check_file(path, description):
    """Перевірити наявність файлу"""
    if os.path.exists(path):
        size = os.path.getsize(path)
        print(f"✅ {description}")
        print(f"   📄 {path}")
        print(f"   📊 Розмір: {size:,} bytes")
        return True
    else:
        print(f"❌ {description}")
        print(f"   📄 {path}")
        return False

def main():
    print("="*70)
    print("🔍 ПЕРЕВІРКА AUTONOMOUS INTELLIGENCE V2.0 FILES")
    print("="*70)

    project_root = Path(__file__).parent.parent

    files_to_check = [
        # Код
        (
            project_root / "services/api-gateway/app/services/autonomous_intelligence_v2.py",
            "Autonomous Intelligence v2.0 - Основний код"
        ),
        (
            project_root / "services/api-gateway/app/api/v25_routes.py",
            "API Routes - Endpoints для AI v2.0"
        ),
        (
            project_root / "services/api-gateway/app/main.py",
            "Main Application - Інтеграція AI v2.0"
        ),

        # Workflows
        (
            project_root / ".agent/workflows/ultra_autonomous.md",
            "Ultra Autonomous Workflow"
        ),

        # Документація
        (
            project_root / "AUTONOMY_ANALYSIS_v26.md",
            "Детальний аналіз автономії"
        ),
        (
            project_root / "AUTONOMY_UPGRADE_SUMMARY.md",
            "Короткий summary"
        ),
        (
            project_root / "AUTONOMY_FINAL_REPORT.md",
            "Фінальний звіт"
        ),
        (
            project_root / "AUTONOMOUS_INTELLIGENCE_README.md",
            "README для швидкого старту"
        ),
        (
            project_root / "AUTONOMY_COMPLETE.md",
            "Інструкції запуску"
        ),

        # Тести та скрипти
        (
            project_root / "tests/test_autonomous_intelligence_v2.py",
            "Тести для AI v2.0"
        ),
        (
            project_root / "scripts/check_autonomous_system.py",
            "Скрипт перевірки системи"
        ),
        (
            project_root / "scripts/demo_autonomous_intelligence.py",
            "Демонстраційний скрипт"
        ),
    ]

    print(f"\n📁 Перевірка {len(files_to_check)} файлів...\n")

    found = 0
    total_size = 0

    for file_path, description in files_to_check:
        if check_file(file_path, description):
            found += 1
            total_size += os.path.getsize(file_path)
        print()

    print("="*70)
    print("📊 ПІДСУМОК")
    print("="*70)
    print(f"\n✅ Знайдено файлів: {found}/{len(files_to_check)}")
    print(f"📊 Загальний розмір: {total_size:,} bytes ({total_size/1024:.1f} KB)")

    if found == len(files_to_check):
        print("\n🎉 ВСІ ФАЙЛИ НА МІСЦІ!")
        print("\n📚 Документація:")
        print("   - Швидкий старт: AUTONOMOUS_INTELLIGENCE_README.md")
        print("   - Інструкції: AUTONOMY_COMPLETE.md")
        print("   - Детальний аналіз: AUTONOMY_ANALYSIS_v26.md")
        print("\n🚀 Наступні кроки:")
        print("   1. Запустити backend: cd services/api-gateway && python -m uvicorn app.main:app --reload")
        print("   2. Перевірити статус: curl http://localhost:8000/system/autonomy/status")
        print("   3. Моніторити роботу через API endpoints")
    else:
        print(f"\n⚠️  Відсутні файли: {len(files_to_check) - found}")

    print("\n" + "="*70)

if __name__ == "__main__":
    main()
