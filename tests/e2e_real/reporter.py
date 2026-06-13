import json
import os
from datetime import datetime

REPORT_PATH = "e2e_report.md"

def generate_report(test_results):
    """
    Генерує фінальний автоматичний звіт (Пункт 13 ТЗ) 
    на основі результатів pytest JSON output.
    """
    total = len(test_results.get("tests", []))
    passed = len([t for t in test_results.get("tests", []) if t["outcome"] == "passed"])
    failed = len([t for t in test_results.get("tests", []) if t["outcome"] == "failed"])
    
    success_rate = (passed / total * 100) if total > 0 else 0
    
    report_md = f"""# E2E Автоматизований Звіт PREDATOR Analytics
**Дата:** {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
**Статус Імпорту:** {'✅ Успішно' if success_rate >= 99 else '❌ Провалено'}
**Відсоток успішності:** {success_rate:.1f}%

## Результати Перевірок
- Всього тестів: {total}
- Пройдено: {passed}
- Провалено: {failed}

### Деталі:
"""
    for test in test_results.get("tests", []):
        icon = "✅" if test["outcome"] == "passed" else ("⚠️" if test["outcome"] == "skipped" else "❌")
        report_md += f"- {icon} **{test['name']}**: {test['outcome']}\n"
        
    with open(REPORT_PATH, "w") as f:
        f.write(report_md)
        
    print(f"Звіт згенеровано: {REPORT_PATH}")

if __name__ == "__main__":
    if os.path.exists(".report.json"):
        with open(".report.json") as f:
            data = json.load(f)
            generate_report(data)
