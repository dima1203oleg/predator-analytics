"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

Генератор звітів (JSON, HTML, PDF, Excel)
"""

import json
from typing import Dict, Any
from datetime import datetime
import logging

from core.validator import DeploymentReport


logger = logging.getLogger(__name__)


class ReportGenerator:
    """Генератор звітів"""
    
    def __init__(self, report: DeploymentReport):
        self.report = report
    
    def generate_json(self, filename: str = None) -> str:
        """Генерація JSON звіту"""
        if filename is None:
            filename = f'deployment_audit_{self.report.deployment_id}.json'
        
        report_dict = self.report.to_dict()
        
        with open(filename, 'w') as f:
            json.dump(report_dict, f, indent=2)
        
        logger.info(f"JSON report generated: {filename}")
        return filename
    
    def generate_html(self, filename: str = None) -> str:
        """Генерація HTML звіту"""
        if filename is None:
            filename = f'deployment_audit_{self.report.deployment_id}.html'
        
        html_content = self._generate_html_content()
        
        with open(filename, 'w') as f:
            f.write(html_content)
        
        logger.info(f"HTML report generated: {filename}")
        return filename
    
    def _generate_html_content(self) -> str:
        """Генерація HTML контенту"""
        status_colors = {
            'passed': '#22c55e',
            'failed': '#ef4444',
            'warning': '#f59e0b',
            'skipped': '#6b7280'
        }
        
        html = f"""
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PREDATOR Analytics Deployment Audit</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #0a0a0f;
            color: #ffffff;
            margin: 0;
            padding: 20px;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: #1a1a2e;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }}
        h1 {{
            color: #e11d48;
            border-bottom: 2px solid #e11d48;
            padding-bottom: 10px;
        }}
        .header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
        }}
        .readiness-index {{
            font-size: 48px;
            font-weight: bold;
            color: {status_colors.get(self.report.overall_status.value, '#ffffff')};
        }}
        .readiness-label {{
            font-size: 14px;
            color: #9ca3af;
            text-transform: uppercase;
        }}
        .section {{
            margin-bottom: 30px;
        }}
        .section-title {{
            font-size: 20px;
            font-weight: bold;
            color: #e11d48;
            margin-bottom: 15px;
        }}
        .result-item {{
            background: #16213e;
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 5px;
            border-left: 4px solid {status_colors.get(self.report.overall_status.value, '#ffffff')};
        }}
        .result-name {{
            font-weight: bold;
            font-size: 16px;
        }}
        .result-status {{
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            margin-left: 10px;
        }}
        .status-passed {{ background: #22c55e; color: white; }}
        .status-failed {{ background: #ef4444; color: white; }}
        .status-warning {{ background: #f59e0b; color: white; }}
        .status-skipped {{ background: #6b7280; color: white; }}
        .result-details {{
            margin-top: 10px;
            font-size: 14px;
            color: #9ca3af;
        }}
        .errors {{
            color: #ef4444;
            margin-top: 5px;
        }}
        .warnings {{
            color: #f59e0b;
            margin-top: 5px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div>
                <h1>PREDATOR Analytics Deployment Audit</h1>
                <p>Deployment ID: {self.report.deployment_id}</p>
                <p>Timestamp: {self.report.timestamp.strftime('%Y-%m-%d %H:%M:%S')}</p>
            </div>
            <div style="text-align: right;">
                <div class="readiness-label">Deployment Readiness Index</div>
                <div class="readiness-index">{self.report.readiness_index:.1f}%</div>
                <div class="readiness-label">Overall Status: {self.report.overall_status.value.upper()}</div>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">Validation Results</div>
"""
        
        for result in self.report.results:
            status_class = f"status-{result.status.value}"
            html += f"""
            <div class="result-item">
                <div>
                    <span class="result-name">{result.name}</span>
                    <span class="result-status {status_class}">{result.status.value}</span>
                </div>
                <div class="result-details">
                    Duration: {result.duration:.2f}s
                </div>
"""
            
            if result.errors:
                html += f'<div class="errors">Errors: {", ".join(result.errors)}</div>'
            
            if result.warnings:
                html += f'<div class="warnings">Warnings: {", ".join(result.warnings)}</div>'
            
            html += '</div>'
        
        html += """
        </div>
    </div>
</body>
</html>
"""
        
        return html
    
    def generate_pdf(self, filename: str = None) -> str:
        """Генерація PDF звіту"""
        if filename is None:
            filename = f'deployment_audit_{self.report.deployment_id}.pdf'
        
        # Спочатку генеруємо HTML
        html_filename = self.generate_html()
        
        # Конвертація HTML в PDF
        try:
            import pdfkit
            pdfkit.from_file(html_filename, filename)
            logger.info(f"PDF report generated: {filename}")
        except ImportError:
            logger.warning("pdfkit not installed, skipping PDF generation")
            return None
        except Exception as e:
            logger.error(f"PDF generation error: {str(e)}")
            return None
        
        return filename
    
    def generate_excel(self, filename: str = None) -> str:
        """Генерація Excel звіту"""
        if filename is None:
            filename = f'deployment_audit_{self.report.deployment_id}.xlsx'
        
        try:
            import pandas as pd
            
            # Підготовка даних
            data = []
            for result in self.report.results:
                data.append({
                    'Level': result.level.name,
                    'Name': result.name,
                    'Status': result.status.value,
                    'Duration (s)': result.duration,
                    'Errors': ', '.join(result.errors) if result.errors else '',
                    'Warnings': ', '.join(result.warnings) if result.warnings else ''
                })
            
            df = pd.DataFrame(data)
            df.to_excel(filename, index=False)
            
            logger.info(f"Excel report generated: {filename}")
            return filename
        except ImportError:
            logger.warning("pandas not installed, skipping Excel generation")
            return None
        except Exception as e:
            logger.error(f"Excel generation error: {str(e)}")
            return None
    
    def generate_all(self) -> Dict[str, str]:
        """Генерація всіх звітів"""
        reports = {}
        
        reports['json'] = self.generate_json()
        reports['html'] = self.generate_html()
        reports['pdf'] = self.generate_pdf()
        reports['excel'] = self.generate_excel()
        
        return reports
