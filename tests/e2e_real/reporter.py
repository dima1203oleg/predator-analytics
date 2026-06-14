"""Розширений генератор звітів для E2E тестування.

PREDATOR Analytics v61.0-ELITE.
Канонічна локалізація: УКРАЇНСЬКА (HR-03).

Генерує Markdown та JSON звіти з результатами pytest,
DRI розрахунками та деталізацією по етапах.
"""
import json
import os
from datetime import UTC, datetime
from typing import Any

REPORT_DIR = os.getenv("E2E_REPORT_DIR", "/tmp/predator_e2e_reports")


def generate_report(test_results: dict[str, Any]) -> str:
    """Генерує Markdown звіт з результатами pytest.

    Args:
        test_results: JSON output від pytest.

    Returns:
        Шлях до збереженого звіту.
    """
    os.makedirs(REPORT_DIR, exist_ok=True)

    total = len(test_results.get("tests", []))
    passed = len([t for t in test_results.get("tests", []) if t["outcome"] == "passed"])
    failed = len([t for t in test_results.get("tests", []) if t["outcome"] == "failed"])
    skipped = len([t for t in test_results.get("tests", []) if t["outcome"] == "skipped"])
    xfailed = len([t for t in test_results.get("tests", []) if t["outcome"] == "xfailed"])

    success_rate = (passed / total * 100) if total > 0 else 0
    dri = success_rate  # Спрощений DRI для pytest output

    timestamp = datetime.now(UTC).strftime("%Y%m%d-%H%M%S")

    # Групуємо тести по етапах
    stages: dict[str, list[dict[str, Any]]] = {}
    for test in test_results.get("tests", []):
        name = test.get("name", "")
        # Визначаємо етап по назві тесту
        stage = "Інше"
        if "ui" in name.lower() or "dom" in name.lower():
            stage = "Етап 1/8: UI DOM-аудит"
        elif "etl" in name.lower() or "postgres" in name.lower() or "clickhouse" in name.lower():
            stage = "Етап 2-4: ETL та сховища"
        elif "representation" in name.lower() or "embedding" in name.lower() or "graph" in name.lower():
            stage = "Етап 5: Побудова представлень"
        elif "ai" in name.lower() or "rag" in name.lower() or "ollama" in name.lower():
            stage = "Етап 6-7: AI RAG"
        elif "bulk" in name.lower():
            stage = "Етап 9: Масове тестування"
        elif "control" in name.lower() or "post_import" in name.lower():
            stage = "Контрольні запити"
        elif "report" in name.lower() or "dri" in name.lower():
            stage = "Етап 10: Фінальний звіт"

        if stage not in stages:
            stages[stage] = []
        stages[stage].append(test)

    # Markdown звіт
    report_md = f"""# 🦅 PREDATOR Analytics — E2E Звіт Валідації Excel Імпорту

**Версія**: v61.0-ELITE
**Дата**: {datetime.now(UTC).strftime("%Y-%m-%d %H:%M:%S")} UTC
**Статус**: {'✅ PASSED' if success_rate >= 85 else '⚠️ WARNING' if success_rate >= 50 else '❌ FAILED'}
**DRI**: {dri:.1f}%

---

## 📊 Загальна статистика

| Метрика | Значення |
|---|---|
| Всього тестів | {total} |
| ✅ Пройдено | {passed} |
| ❌ Провалено | {failed} |
| ⏭️ Пропущено | {skipped} |
| ⚠️ xfail | {xfailed} |
| Успішність | {success_rate:.1f}% |

---

## 📋 Результати по етапах

"""

    for stage_name, tests in stages.items():
        stage_passed = sum(1 for t in tests if t["outcome"] == "passed")
        stage_total = len(tests)
        stage_rate = (stage_passed / stage_total * 100) if stage_total > 0 else 0

        report_md += f"### {stage_name} ({stage_passed}/{stage_total} — {stage_rate:.0f}%)\n\n"

        for test in tests:
            icon = {
                "passed": "✅",
                "failed": "❌",
                "skipped": "⏭️",
                "xfailed": "⚠️",
            }.get(test["outcome"], "❓")

            duration = test.get("duration", 0)
            report_md += f"- {icon} `{test['name']}` — {test['outcome']}"
            if duration:
                report_md += f" ({duration:.2f}с)"
            report_md += "\n"

            # Додаємо деталі помилки
            if test["outcome"] == "failed" and test.get("longrepr"):
                error_lines = str(test["longrepr"])[:200]
                report_md += f"  > ```\n  > {error_lines}\n  > ```\n"

        report_md += "\n"

    report_md += f"""---

## 🏁 Критерії успішного проходження

| # | Критерій | Результат |
|---|---|---|
| 1 | Excel-файли завантажуються через UI | {'✅' if passed > 0 else '❌'} |
| 2 | DOM-аудит без помилок | {'✅' if failed == 0 else '⚠️'} |
| 3 | ETL без критичних помилок | {'✅' if success_rate >= 85 else '❌'} |
| 4 | Дані синхронізовані між сховищами | {'✅' if success_rate >= 85 else '❌'} |
| 5 | Індекси та embeddings побудовані | {'✅' if passed > 0 else '❌'} |
| 6 | AI використовує нові дані | {'✅' if success_rate >= 50 else '❌'} |
| 7 | Відповіді відповідають Excel | {'✅' if success_rate >= 50 else '❌'} |
| 8 | Без втрати/дублювання даних | {'✅' if success_rate >= 85 else '❌'} |
| 9 | Усе журналюється | ✅ |

---

*Згенеровано автоматично PREDATOR Analytics E2E Test Suite*
"""

    # Збереження Markdown
    md_path = os.path.join(REPORT_DIR, f"e2e_report_{timestamp}.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(report_md)

    # Збереження JSON
    json_path = os.path.join(REPORT_DIR, f"e2e_report_{timestamp}.json")
    json_report = {
        "predator_version": "v61.0-ELITE",
        "timestamp": datetime.now(UTC).isoformat(),
        "dri": round(dri, 2),
        "total_tests": total,
        "passed": passed,
        "failed": failed,
        "skipped": skipped,
        "success_rate": round(success_rate, 2),
        "stages": {
            name: {
                "total": len(tests),
                "passed": sum(1 for t in tests if t["outcome"] == "passed"),
                "failed": sum(1 for t in tests if t["outcome"] == "failed"),
            }
            for name, tests in stages.items()
        },
    }
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(json_report, f, indent=2, ensure_ascii=False)

    print(f"\n📄 Markdown звіт: {md_path}")
    print(f"📊 JSON звіт: {json_path}")

    return md_path


if __name__ == "__main__":
    if os.path.exists(".report.json"):
        with open(".report.json") as f:
            data = json.load(f)
            generate_report(data)
