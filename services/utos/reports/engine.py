"""Генератор звітів UTOS.
Збирає дані з різних шарів та формує комплексні звіти.
"""

from datetime import datetime
from typing import Any

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
except ImportError:
    pass

try:
    from openpyxl import Workbook
except ImportError:
    pass

class ReportEngine:
    def __init__(self):
        pass

    async def generate_system_report(self, orchestrator_results: dict[str, Any]) -> dict[str, Any]:
        """Генерує повний звіт про стан системи на основі даних оркестратора.
        """
        status = orchestrator_results.get("overall_status", "UNKNOWN")
        score = orchestrator_results.get("readiness_index", 0.0)

        recommendations = self._generate_recommendations(orchestrator_results)

        report = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "utos_version": "61.0-ELITE",
            "status": status,
            "readiness_score": score,
            "layers": orchestrator_results.get("steps", {}),
            "recommendations": recommendations,
            "is_production_ready": score >= 90.0 and status == "PASSED"
        }

        return report

    def _generate_recommendations(self, results: dict[str, Any]) -> list[str]:
        recs = []
        steps = results.get("steps", {})
        for layer, passed in steps.items():
            if not passed:
                recs.append(f"🔴 Критично: Шар '{layer}' не пройшов валідацію. Ініціюйте CicdHealer для відновлення.")

        if results.get("readiness_index", 0.0) < 100.0:
            recs.append("⚠️ Деякі некритичні тести пропущені. Перегляньте логи UTOS Orchestrator.")
        else:
            recs.append("✅ Система працює ідеально. Жодних дій не потрібно.")

        return recs

    def generate_pdf(self, report: dict[str, Any], filepath: str) -> str:
        """Генерує PDF версію звіту."""
        try:
            c = canvas.Canvas(filepath, pagesize=letter)
            width, height = letter

            c.setFont("Helvetica-Bold", 16)
            c.drawString(50, height - 50, "PREDATOR UTOS - Diagnostic Report")

            c.setFont("Helvetica", 12)
            c.drawString(50, height - 80, f"Timestamp: {report.get('timestamp')}")
            c.drawString(50, height - 100, f"Version: {report.get('utos_version')}")
            c.drawString(50, height - 120, f"Status: {report.get('status')}")
            c.drawString(50, height - 140, f"Readiness Score: {report.get('readiness_score')}%")

            y = height - 170
            c.setFont("Helvetica-Bold", 14)
            c.drawString(50, y, "Layers Validation Details:")
            y -= 20

            c.setFont("Helvetica", 12)
            for layer, passed in report.get("layers", {}).items():
                status_text = "PASSED" if passed else "FAILED"
                c.drawString(70, y, f"- {layer}: {status_text}")
                y -= 20
                if y < 50:
                    c.showPage()
                    y = height - 50

            y -= 10
            c.setFont("Helvetica-Bold", 14)
            c.drawString(50, y, "Recommendations:")
            y -= 20

            c.setFont("Helvetica", 10)
            for rec in report.get("recommendations", []):
                # ASCII encode/decode or wrap text if needed, here just basic writing
                # Note: reportlab standard fonts don't support Cyrillic well without custom fonts.
                # Since this is a basic stub, we replace non-ascii chars to avoid crashes
                # or we could register a TrueType font. We'll simplify for now.
                safe_rec = rec.encode('ascii', 'ignore').decode('ascii')
                c.drawString(70, y, f"- {safe_rec}")
                y -= 15
                if y < 50:
                    c.showPage()
                    y = height - 50

            c.save()
            return filepath
        except Exception as e:
            raise RuntimeError(f"Failed to generate PDF: {e}")

    def generate_xlsx(self, report: dict[str, Any], filepath: str) -> str:
        """Генерує XLSX версію звіту."""
        try:
            wb = Workbook()
            ws = wb.active
            ws.title = "UTOS Report"

            # Header
            ws.append(["Parameter", "Value"])
            ws.append(["Timestamp", report.get("timestamp")])
            ws.append(["Version", report.get("utos_version")])
            ws.append(["Status", report.get("status")])
            ws.append(["Readiness Score", report.get("readiness_score")])

            ws.append([])
            ws.append(["Layer", "Validation Status"])
            for layer, passed in report.get("layers", {}).items():
                ws.append([layer, "PASSED" if passed else "FAILED"])

            ws.append([])
            ws.append(["Recommendations"])
            for rec in report.get("recommendations", []):
                ws.append([rec])

            wb.save(filepath)
            return filepath
        except Exception as e:
            raise RuntimeError(f"Failed to generate XLSX: {e}")

report_engine = ReportEngine()
