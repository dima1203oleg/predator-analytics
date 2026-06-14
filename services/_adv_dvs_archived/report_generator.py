import json
import logging
from typing import Dict, Any
from pathlib import Path
import pandas as pd
from jinja2 import Environment, BaseLoader

logger = logging.getLogger(__name__)

# Basic HTML template for the report
HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>Deployment Audit Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .pass { color: green; }
        .fail { color: red; font-weight: bold; }
        .warning { color: orange; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>Deployment Readiness Audit</h1>
    <p><strong>Status:</strong> <span class="{{ 'pass' if report.is_ready else 'fail' }}">{{ report.overall_status }}</span></p>
    <p><strong>Deployment Readiness Index:</strong> {{ report.deployment_readiness_index }}%</p>
    <p><strong>Timestamp:</strong> {{ report.timestamp }}</p>

    <h2>Level Details</h2>
    <table>
        <tr><th>Level</th><th>Name</th><th>Status</th><th>Details</th></tr>
        {% for lvl, res in report.levels.items() %}
        <tr>
            <td>{{ lvl }}</td>
            <td>{{ res.name }}</td>
            <td class="{{ res.status }}">{{ res.status | upper }}</td>
            <td>{{ res.details | tojson }}</td>
        </tr>
        {% endfor %}
    </table>
</body>
</html>
"""

class ReportGenerator:
    """
    Відповідає за генерацію звітів (JSON, HTML, PDF, XLSX).
    """
    
    def __init__(self, output_dir: str = "./reports"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        self.env = Environment(loader=BaseLoader())
        self.env.filters['tojson'] = lambda v: json.dumps(v, indent=2)
        
    async def generate_reports(self, report_data: Dict[str, Any]):
        try:
            # 1. JSON
            json_path = self.output_dir / "deployment_audit.json"
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(report_data, f, indent=4, ensure_ascii=False)
                
            # 2. HTML
            html_path = self.output_dir / "deployment_audit.html"
            template = self.env.from_string(HTML_TEMPLATE)
            html_content = template.render(report=report_data)
            with open(html_path, "w", encoding="utf-8") as f:
                f.write(html_content)
                
            # 3. PDF (WeasyPrint)
            try:
                from weasyprint import HTML
                pdf_path = self.output_dir / "deployment_audit.pdf"
                HTML(string=html_content).write_pdf(pdf_path)
            except Exception as e:
                logger.error(f"Failed to generate PDF: {e}")
                
            # 4. XLSX (Pandas)
            try:
                xlsx_path = self.output_dir / "deployment_audit.xlsx"
                
                rows = []
                for lvl, res in report_data.get("levels", {}).items():
                    rows.append({
                        "Level": lvl,
                        "Name": res.get("name"),
                        "Status": res.get("status"),
                        "Details": json.dumps(res.get("details"))
                    })
                    
                df = pd.DataFrame(rows)
                df.to_excel(xlsx_path, index=False)
            except Exception as e:
                logger.error(f"Failed to generate XLSX: {e}")
                
        except Exception as e:
            logger.error(f"Error generating reports: {e}")
