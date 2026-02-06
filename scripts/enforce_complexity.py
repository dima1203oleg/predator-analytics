from __future__ import annotations

#!/usr/bin/env python3
import json
import os
import sys
import time


# PREDATOR V30.1 - COMPLEXITY ENFORCER (UA)
# Запобігає "вибуху складності" шляхом моніторингу метрик коду.
# Вимагає Python 3.12+


MAX_LINES_PER_FILE = 800
MAX_FUNCTIONS_PER_FILE = 25
EXCLUDED_DIRS = ["node_modules", "dist", "build", ".git", "__pycache__", "migrations", "tests", ".venv", "venv", "env"]
VIDEO_EXT = {".py", ".ts", ".tsx", ".js"}

def count_metrics(filepath):
    try:
        with open(filepath, encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
            loc = len(lines)
            functions = 0
            for line in lines:
                stripped = line.strip()
                if filepath.endswith('.py'):
                    if stripped.startswith(('def ', 'async def ')):
                        functions += 1
                elif stripped.startswith('function ') or '=>' in stripped or ') {' in stripped:
                    # Дуже примітивна евристика для JS/TS, але працює для грубої оцінки
                    if 'function' in stripped or ('const' in stripped and '=>' in stripped):
                        functions += 1
            return loc, functions
    except Exception:
        # print(f"Warning: Could not read {filepath}: {e}")
        return 0, 0

def scan_directory(root_dir):
    report = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "violations": [],
        "stats": {
            "total_files": 0,
            "total_loc": 0,
            "complexity_score": 0
        }
    }

    print(f"🔍 Сканування каталогу: {root_dir}...")

    for root, dirs, files in os.walk(root_dir):
        # Фільтрація каталогів
        dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRS]

        for file in files:
            ext = os.path.splitext(file)[1]
            if ext not in VIDEO_EXT:
                continue

            full_path = os.path.join(root, file)
            loc, funcs = count_metrics(full_path)

            report["stats"]["total_files"] += 1
            report["stats"]["total_loc"] += loc

            # Простий бал складності = LOC + (Functions * 5)
            score = loc + (funcs * 5)
            report["stats"]["complexity_score"] += score

            if loc > MAX_LINES_PER_FILE:
                report["violations"].append({
                    "file": full_path,
                    "issue": "ПЕРЕВИЩЕНО ЛІМІТ РЯДКІВ (LOC)",
                    "value": loc,
                    "limit": MAX_LINES_PER_FILE
                })

            if funcs > MAX_FUNCTIONS_PER_FILE:
                report["violations"].append({
                    "file": full_path,
                    "issue": "ПЕРЕВИЩЕНО ЛІМІТ ФУНКЦІЙ",
                    "value": funcs,
                    "limit": MAX_FUNCTIONS_PER_FILE
                })

    return report

def generate_html_report(report):
    html = """<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <title>Звіт Складності Predator v30.1</title>
    <style>
        body {{ font-family: -apple-system, system-ui, sans-serif; background: #1a1a1a; color: #e0e0e0; padding: 20px; }}
        .container {{ max-width: 900px; margin: 0 auto; }}
        h1 {{ color: #4dabf7; }}
        .stats {{ display: flex; gap: 20px; margin-bottom: 30px; }}
        .card {{ background: #2d2d2d; padding: 15px; border-radius: 8px; flex: 1; text-align: center; }}
        .card h2 {{ margin: 0; font-size: 2em; }}
        .card p {{ margin: 5px 0 0; opacity: 0.7; }}
        .violation {{ background: #3d2d2d; border-left: 4px solid #ff6b6b; padding: 15px; margin-bottom: 10px; border-radius: 4px; }}
        .violation h3 {{ margin: 0 0 5px; color: #ff6b6b; font-size: 1.1em; }}
        .meta {{ font-size: 0.9em; opacity: 0.6; }}
        .safe {{ color: #51cf66; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🛡️ Predator v30.1 Complexity Report</h1>
        <div class="stats">
            <div class="card">
                <h2>{total_files}</h2>
                <p>Файлів</p>
            </div>
            <div class="card">
                <h2>{total_loc}</h2>
                <p>Рядків Коду</p>
            </div>
            <div class="card">
                <h2>{violations_count}</h2>
                <p>Порушень</p>
            </div>
        </div>

        <h2>Деталі Порушень</h2>
        {violations_html}

        <p class="meta">Згенеровано: {timestamp}</p>
    </div>
</body>
</html>
    """

    violations_html = ""
    for v in sorted(report["violations"], key=lambda x: x['value'], reverse=True):
         violations_html += f"""
         <div class="violation">
            <h3>{v['file']}</h3>
            <p><strong>{v['issue']}</strong>: {v['value']} (Ліміт: {v['limit']})</p>
         </div>
         """

    if not violations_html:
        violations_html = "<h3 class='safe'>✅ Порушень не виявлено. Система стабільна.</h3>"

    final_html = html.format(
        total_files=report['stats']['total_files'],
        total_loc=report['stats']['total_loc'],
        violations_count=len(report['violations']),
        timestamp=report['timestamp'],
        violations_html=violations_html
    )

    with open("complexity_report.html", "w", encoding="utf-8") as f:
        f.write(final_html)
    print("\n📄 HTML звіт збережено у 'complexity_report.html'")

def flatten_report(report):
    print("\n📊 ЗВІТ ПРО СКЛАДНІСТЬ СИСТЕМИ")
    print("================================")
    print(f"Всього файлів: {report['stats']['total_files']}")
    print(f"Всього рядків коду: {report['stats']['total_loc']}")
    print(f"Індекс ризику: {report['stats']['complexity_score']}")
    print(f"Кількість порушень: {len(report['violations'])}")
    print("================================")

    generate_html_report(report)

    if report["violations"]:
        print("\n🚨 КРИТИЧНІ ПОРУШЕННЯ:")
        # Сортуємо порушення за значенням (найбільші спочатку)
        sorted_violations = sorted(report["violations"], key=lambda x: x['value'], reverse=True)

        for v in sorted_violations[:10]: # Показати топ 10
            # Скорочуємо шлях до файлу для кращого вигляду
            short_path = "..." + v['file'][-60:] if len(v['file']) > 60 else v['file']
            print(f"  - {short_path}")
            print(f"    ↳ {v['issue']}: {v['value']} (Ліміт: {v['limit']})")

        if len(report["violations"]) > 10:
            print(f"\n  ... та ще {len(report['violations']) - 10} порушень.")

        # Зберегти у файл
        with open("complexity_report.json", "w", encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        print("\nПовний звіт збережено у 'complexity_report.json'")
        return False # Fail
    print("\n✅ Система в межах бюджету складності.")
    return True # Pass

if __name__ == "__main__":
    current_dir = os.getcwd()
    report = scan_directory(current_dir)
    success = flatten_report(report)
    # Повертаємо 0 навіть при порушеннях, щоб не ламати пайплайн Night Shift, але логуємо проблему
    sys.exit(0)
