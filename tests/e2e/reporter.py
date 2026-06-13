import pytest
from datetime import datetime, UTC
import json
import os

class DRI_Reporter:
    def __init__(self):
        self.results = {
            "timestamp": datetime.now(UTC).isoformat(),
            "tests": [],
            "summary": {
                "passed": 0,
                "failed": 0,
                "skipped": 0,
                "total": 0,
                "dri": 0.0
            }
        }

    @pytest.hookimpl(hookwrapper=True)
    def pytest_runtest_makereport(self, item, call):
        outcome = yield
        report = outcome.get_result()
        
        if report.when == "call":
            self.results["tests"].append({
                "name": item.name,
                "nodeid": item.nodeid,
                "outcome": report.outcome,
                "duration": round(report.duration, 2)
            })
            
            self.results["summary"]["total"] += 1
            if report.outcome == "passed":
                self.results["summary"]["passed"] += 1
            elif report.outcome == "failed":
                self.results["summary"]["failed"] += 1
            elif report.outcome == "skipped":
                self.results["summary"]["skipped"] += 1

    def pytest_sessionfinish(self, session, exitstatus):
        total = self.results["summary"]["total"]
        if total > 0:
            passed = self.results["summary"]["passed"]
            self.results["summary"]["dri"] = round((passed / total) * 100, 2)
            
        # Запис у JSON
        os.makedirs("reports", exist_ok=True)
        with open("reports/e2e_final_report.json", "w", encoding="utf-8") as f:
            json.dump(self.results, f, indent=2, ensure_ascii=False)
            
        # Генерація HTML
        self._generate_html()

    def _generate_html(self):
        dri = self.results["summary"]["dri"]
        is_ready = dri >= 99.0
        
        html = f"""
        <html>
        <head>
            <title>PREDATOR Analytics — Final E2E Audit Report</title>
            <style>
                body {{ font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 20px; }}
                .container {{ max-width: 900px; margin: auto; background: #1e293b; padding: 20px; border-radius: 8px; }}
                h1, h2 {{ color: #38bdf8; }}
                .dri {{ font-size: 3em; text-align: center; color: {'#4ade80' if is_ready else '#f87171'}; }}
                .status-ready {{ color: #4ade80; text-align: center; font-size: 1.5em; font-weight: bold; margin-bottom: 20px; }}
                .status-not-ready {{ color: #f87171; text-align: center; font-size: 1.5em; font-weight: bold; margin-bottom: 20px; }}
                table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
                th, td {{ padding: 10px; border-bottom: 1px solid #334155; text-align: left; }}
                .passed {{ color: #4ade80; font-weight: bold; }}
                .failed {{ color: #f87171; font-weight: bold; }}
                .skipped {{ color: #fbbf24; font-weight: bold; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Наскрізний аудит життєвого циклу даних (E2E)</h1>
                <div class="dri">{dri}% DRI</div>
                <div class="{'status-ready' if is_ready else 'status-not-ready'}">
                    {'СИСТЕМА ГОТОВА ДО ПРОДУКЦІЇ' if is_ready else 'СИСТЕМА НЕ ГОТОВА (DRI < 99%)'}
                </div>
                
                <p>Усього тестів: {self.results['summary']['total']}</p>
                <p>Успішно: <span class="passed">{self.results['summary']['passed']}</span></p>
                <p>Провалено: <span class="failed">{self.results['summary']['failed']}</span></p>
                
                <h2>Деталізація перевірок</h2>
                <table>
                    <tr><th>Назва тесту</th><th>Результат</th><th>Тривалість (с)</th></tr>
        """
        
        for t in self.results["tests"]:
            html += f"""
                    <tr>
                        <td>{t['name']}</td>
                        <td class="{t['outcome']}">{t['outcome'].upper()}</td>
                        <td>{t['duration']}</td>
                    </tr>
            """
            
        html += """
                </table>
            </div>
        </body>
        </html>
        """
        
        with open("reports/e2e_final_report.html", "w", encoding="utf-8") as f:
            f.write(html)

def pytest_configure(config):
    config.pluginmanager.register(DRI_Reporter(), "dri_reporter")
