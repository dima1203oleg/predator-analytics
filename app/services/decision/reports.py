"""
📊 Decision Intelligence Reports & Scheduling

Система автоматичних звітів та планування аналізу для Decision Intelligence Engine.
Підтримує:
- Автоматичні звіти (щоденні, щотижневі, щомісячні)
- Планування batch аналізу
- Генерація PDF та Excel звітів
- Email розсилку звітів
- Кастомізація шаблонів звітів

Типи звітів:
- Ризик-моніторинг контрагентів
- Аналіз ринкових тенденцій
- Звіт закупівель та постачальників
- Batch due diligence звіти
- Системні метрики та продуктивність
"""

import asyncio
import logging
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

from app.services.decision import BatchProcessor, get_batch_processor

logger = logging.getLogger("predator.decision.reports")


class ReportType(str, Enum):
    """Типи звітів"""
    RISK_MONITORING = "risk_monitoring"
    MARKET_ANALYSIS = "market_analysis"
    PROCUREMENT_REPORT = "procurement_report"
    BATCH_DUE_DILIGENCE = "batch_due_diligence"
    SYSTEM_METRICS = "system_metrics"
    SUPPLIER_RANKING = "supplier_ranking"


class ReportFormat(str, Enum):
    """Формати звітів"""
    PDF = "pdf"
    EXCEL = "excel"
    JSON = "json"
    HTML = "html"
    CSV = "csv"


class ScheduleFrequency(str, Enum):
    """Частота планування"""
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    CUSTOM = "custom"


@dataclass
class ReportConfig:
    """Конфігурація звіту"""
    id: str
    name: str
    type: ReportType
    format: ReportFormat
    frequency: ScheduleFrequency
    recipients: List[str]
    parameters: Dict[str, Any]
    enabled: bool = True
    template: Optional[str] = None
    custom_schedule: Optional[str] = None


@dataclass
class GeneratedReport:
    """Згенерований звіт"""
    id: str
    config_id: str
    name: str
    type: ReportType
    format: ReportFormat
    file_path: str
    file_size: int
    generated_at: datetime
    metadata: Dict[str, Any]


class ReportGenerator:
    """Генератор звітів"""
    
    def __init__(self, output_dir: str = "/tmp/reports"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.templates_dir = Path(__file__).parent / "templates"
        self.templates_dir.mkdir(exist_ok=True)
    
    async def generate_risk_monitoring_report(
        self,
        edrpou_list: List[str],
        format: ReportFormat = ReportFormat.PDF,
        template: Optional[str] = None,
    ) -> GeneratedReport:
        """
        Генерація звіту моніторингу ризиків
        
        Args:
            edrpou_list: Список ЄДРПОУ для аналізу
            format: Формат звіту
            template: Шаблон звіту
            
        Returns:
            Згенерований звіт
        """
        import uuid
        
        report_id = str(uuid.uuid4())
        timestamp = datetime.now(UTC)
        
        # Аналізуємо компанії
        processor = get_batch_processor(max_concurrent=10)
        results = await processor.analyze_companies(
            edrpou_list=edrpou_list,
            analysis_type="quick_score",
            db=None
        )
        
        report = processor.generate_report(results)
        
        # Формуємо дані для звіту
        report_data = {
            "report_id": report_id,
            "generated_at": timestamp.isoformat(),
            "total_companies": len(edrpou_list),
            "summary": report["summary"],
            "risk_distribution": report["risk_distribution"],
            "high_risk_companies": report.get("high_risk_companies", []),
            "failed_companies": report.get("failed_companies", []),
            "recommendations": self._generate_risk_recommendations(report)
        }
        
        # Генеруємо файл звіту
        file_path = await self._generate_report_file(
            report_data=report_data,
            format=format,
            filename_prefix=f"risk_monitoring_{timestamp.strftime('%Y%m%d_%H%M%S')}",
            template=template
        )
        
        file_size = file_path.stat().st_size
        
        generated_report = GeneratedReport(
            id=report_id,
            config_id="risk_monitoring_auto",
            name="Risk Monitoring Report",
            type=ReportType.RISK_MONITORING,
            format=format,
            file_path=str(file_path),
            file_size=file_size,
            generated_at=timestamp,
            metadata={
                "total_companies": len(edrpou_list),
                "high_risk_count": len(report.get("high_risk_companies", [])),
                "success_rate": report["summary"]["success_rate"]
            }
        )
        
        logger.info("Generated risk monitoring report: %s", report_id)
        return generated_report
    
    async def generate_market_analysis_report(
        self,
        product_codes: List[str],
        format: ReportFormat = ReportFormat.EXCEL,
        template: Optional[str] = None,
    ) -> GeneratedReport:
        """
        Генерація звіту аналізу ринку
        
        Args:
            product_codes: Список кодів товарів
            format: Формат звіту
            template: Шаблон звіту
            
        Returns:
            Згенерований звіт
        """
        import uuid
        
        report_id = str(uuid.uuid4())
        timestamp = datetime.now(UTC)
        
        # Демонстраційні дані ринкового аналізу
        market_data = []
        for code in product_codes:
            market_data.append({
                "product_code": code,
                "market_size": {
                    "total_importers": 100 + len(code) * 10,
                    "total_value_usd": 1000000 + len(code) * 100000,
                    "avg_transaction_value": 10000 + len(code) * 1000,
                },
                "country_ranking": [
                    {"country": "CN", "avg_price": 850 + len(code) * 10, "market_share": 45.2},
                    {"country": "DE", "avg_price": 1200 + len(code) * 20, "market_share": 22.8},
                    {"country": "US", "avg_price": 1450 + len(code) * 30, "market_share": 18.5},
                ],
                "price_analysis": {
                    "market_avg": 1000 + len(code) * 100,
                    "price_range": {"min": 450, "max": 2500},
                    "trend": "stable" if len(code) % 2 == 0 else "growing"
                },
                "recommendations": {
                    "best_country": "CN" if len(code) % 3 == 0 else "DE",
                    "estimated_savings_pct": 15 + len(code) % 10,
                    "market_trend": "growing" if len(code) % 2 == 0 else "stable"
                }
            })
        
        report_data = {
            "report_id": report_id,
            "generated_at": timestamp.isoformat(),
            "total_products": len(product_codes),
            "market_data": market_data,
            "summary": self._generate_market_summary(market_data),
            "recommendations": self._generate_market_recommendations(market_data)
        }
        
        # Генеруємо файл звіту
        file_path = await self._generate_report_file(
            report_data=report_data,
            format=format,
            filename_prefix=f"market_analysis_{timestamp.strftime('%Y%m%d_%H%M%S')}",
            template=template
        )
        
        file_size = file_path.stat().st_size
        
        generated_report = GeneratedReport(
            id=report_id,
            config_id="market_analysis_auto",
            name="Market Analysis Report",
            type=ReportType.MARKET_ANALYSIS,
            format=format,
            file_path=str(file_path),
            file_size=file_size,
            generated_at=timestamp,
            metadata={
                "total_products": len(product_codes),
                "file_size": file_size
            }
        )
        
        logger.info("Generated market analysis report: %s", report_id)
        return generated_report
    
    async def generate_procurement_report(
        self,
        product_code: str,
        months: int = 12,
        format: ReportFormat = ReportFormat.EXCEL,
        template: Optional[str] = None,
    ) -> GeneratedReport:
        """
        Генерація закупівельного звіту
        
        Args:
            product_code: Код товару
            months: Кількість місяців аналізу
            format: Формат звіту
            template: Шаблон звіту
            
        Returns:
            Згенерований звіт
        """
        import uuid
        
        report_id = str(uuid.uuid4())
        timestamp = datetime.now(UTC)
        
        # Демонстраційні дані закупівель
        procurement_data = {
            "product_code": product_code,
            "analysis_period_months": months,
            "country_ranking": [
                {
                    "country": "CN",
                    "country_name": "Китай",
                    "avg_price": 850,
                    "total_value": 45000000,
                    "market_share": 45.2,
                    "supplier_count": 23,
                    "reliability_score": 78
                },
                {
                    "country": "DE", 
                    "country_name": "Німеччина",
                    "avg_price": 1200,
                    "total_value": 28000000,
                    "market_share": 22.8,
                    "supplier_count": 15,
                    "reliability_score": 92
                },
                {
                    "country": "US",
                    "country_name": "США", 
                    "avg_price": 1450,
                    "total_value": 23000000,
                    "market_share": 18.5,
                    "supplier_count": 8,
                    "reliability_score": 88
                }
            ],
            "top_suppliers": [
                {
                    "name": "Tech Solutions Ltd",
                    "country": "CN",
                    "total_value": 12000000,
                    "avg_price": 880,
                    "reliability": 85,
                    "payment_terms": "NET 30"
                },
                {
                    "name": "Global Electronics",
                    "country": "DE", 
                    "total_value": 9500000,
                    "avg_price": 920,
                    "reliability": 92,
                    "payment_terms": "NET 60"
                }
            ],
            "price_trends": {
                "current_avg": 1050,
                "previous_avg": 980,
                "trend_percent": 7.14,
                "volatility": "medium"
            },
            "recommendations": {
                "best_country": "DE",
                "estimated_savings": 150000,
                "risk_factors": ["logistics_costs", "payment_terms"],
                "action_items": [
                    "Неготіювати з німецькими постачальниками",
                    "Розглянути альтернативні країни",
                    "Оптимізувати обсяги закупівель"
                ]
            }
        }
        
        report_data = {
            "report_id": report_id,
            "generated_at": timestamp.isoformat(),
            "procurement_data": procurement_data,
            "summary": self._generate_procurement_summary(procurement_data),
            "recommendations": procurement_data["recommendations"]
        }
        
        # Генеруємо файл звіту
        file_path = await self._generate_report_file(
            report_data=report_data,
            format=format,
            filename_prefix=f"procurement_{product_code}_{timestamp.strftime('%Y%m%d_%H%M%S')}",
            template=template
        )
        
        file_size = file_path.stat().st_size
        
        generated_report = GeneratedReport(
            id=report_id,
            config_id="procurement_auto",
            name="Procurement Analysis Report",
            type=ReportType.PROCUREMENT_REPORT,
            format=format,
            file_path=str(file_path),
            file_size=file_size,
            generated_at=timestamp,
            metadata={
                "product_code": product_code,
                "analysis_months": months
            }
        )
        
        logger.info("Generated procurement report: %s", report_id)
        return generated_report
    
    async def _generate_report_file(
        self,
        report_data: Dict[str, Any],
        format: ReportFormat,
        filename_prefix: str,
        template: Optional[str] = None,
    ) -> Path:
        """Генерація файлу звіту в заданому форматі"""
        
        if format == ReportFormat.JSON:
            return await self._generate_json_report(report_data, filename_prefix)
        elif format == ReportFormat.HTML:
            return await self._generate_html_report(report_data, filename_prefix, template)
        elif format == ReportFormat.CSV:
            return await self._generate_csv_report(report_data, filename_prefix)
        elif format == ReportFormat.EXCEL:
            return await self._generate_excel_report(report_data, filename_prefix)
        elif format == ReportFormat.PDF:
            return await self._generate_pdf_report(report_data, filename_prefix, template)
        else:
            raise ValueError(f"Unsupported format: {format}")
    
    async def _generate_json_report(self, report_data: Dict[str, Any], filename_prefix: str) -> Path:
        """Генерація JSON звіту"""
        import json
        import aiofiles
        
        file_path = self.output_dir / f"{filename_prefix}.json"
        
        async with aiofiles.open(file_path, 'w', encoding='utf-8') as f:
            await f.write(json.dumps(report_data, ensure_ascii=False, indent=2, default=str))
        
        return file_path
    
    async def _generate_html_report(self, report_data: Dict[str, Any], filename_prefix: str, template: Optional[str] = None) -> Path:
        """Генерація HTML звіту"""
        import aiofiles
        
        file_path = self.output_dir / f"{filename_prefix}.html"
        
        if template and (self.templates_dir / template).exists():
            template_path = self.templates_dir / template
            async with aiofiles.open(template_path, 'r', encoding='utf-8') as f:
                template_content = await f.read()
        else:
            template_content = self._get_default_html_template()
        
        # Проста заміна шаблону
        html_content = template_content.replace("{{title}}", report_data.get("report_id", "Report"))
        html_content = html_content.replace("{{content}}", str(report_data))
        
        async with aiofiles.open(file_path, 'w', encoding='utf-8') as f:
            await f.write(html_content)
        
        return file_path
    
    async def _generate_csv_report(self, report_data: Dict[str, Any], filename_prefix: str) -> Path:
        """Генерація CSV звіту"""
        import csv
        import aiofiles
        
        file_path = self.output_dir / f"{filename_prefix}.csv"
        
        async with aiofiles.open(file_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            
            # Проста CSV структура
            writer.writerow(["Key", "Value"])
            for key, value in report_data.items():
                if isinstance(value, (str, int, float)):
                    writer.writerow([key, value])
                elif isinstance(value, dict):
                    for sub_key, sub_value in value.items():
                        writer.writerow([f"{key}.{sub_key}", sub_value])
        
        return file_path
    
    async def _generate_excel_report(self, report_data: Dict[str, Any], filename_prefix: str) -> Path:
        """Генерація Excel звіту"""
        # Імітація генерації Excel (в реальному проекті використовувати openpyxl)
        file_path = self.output_dir / f"{filename_prefix}.xlsx"
        
        # Створюємо простий Excel-файл з даними
        import pandas as pd
        
        # Конвертуємо дані в DataFrame
        df = pd.DataFrame([report_data])
        df.to_excel(file_path, index=False)
        
        return file_path
    
    async def _generate_pdf_report(self, report_data: Dict[str, Any], filename_prefix: str, template: Optional[str] = None) -> Path:
        """Генерація PDF звіту"""
        # Імітація генерації PDF (в реальному проекті використовувати reportlab)
        file_path = self.output_dir / f"{filename_prefix}.pdf"
        
        # Створюємо простий PDF з HTML
        html_path = await self._generate_html_report(report_data, filename_prefix + "_temp", template)
        
        # Конвертуємо HTML в PDF (в реальному проекті використовувати weasyprint)
        import subprocess
        
        try:
            subprocess.run([
                'wkhtmltopdf',
                str(html_path),
                str(file_path)
            ], check=True, capture_output=True)
        except subprocess.CalledProcessError:
            # Якщо wkhtmltopff недоступний, створюємо текстовий файл
            import aiofiles
            async with aiofiles.open(file_path.with_suffix('.txt'), 'w', encoding='utf-8') as f:
                await f.write(str(report_data))
            file_path = file_path.with_suffix('.txt')
        
        # Видаляємо тимчасовий HTML файл
        html_path.unlink(missing_ok=True)
        
        return file_path
    
    def _get_default_html_template(self) -> str:
        """Отримати HTML шаблон за замовчуванням"""
        return """
<!DOCTYPE html>
<html>
<head>
    <title>{{title}}</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 10px; }
        .content { margin-top: 20px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{title}}</h1>
        <p>Generated by Decision Intelligence Engine</p>
    </div>
    <div class="content">
        <pre>{{content}}</pre>
    </div>
</body>
</html>
        """
    
    def _generate_risk_recommendations(self, report: Dict[str, Any]) -> List[str]:
        """Генерація рекомендацій для ризик-звіту"""
        recommendations = []
        
        success_rate = report["summary"]["success_rate"]
        high_risk_count = len(report.get("high_risk_companies", []))
        
        if success_rate < 70:
            recommendations.append("Покращіть якість даних компаній")
        
        if high_risk_count > 0:
            recommendations.append(f"Перевірте {high_risk_count} високоризикових компаній")
        
        if success_rate >= 90 and high_risk_count == 0:
            recommendations.append("База компаній надійна")
        
        return recommendations
    
    def _generate_market_summary(self, market_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Генерація зведення ринкового аналізу"""
        total_products = len(market_data)
        avg_market_size = sum(d["market_size"]["total_value_usd"] for d in market_data) / total_products
        
        return {
            "total_products": total_products,
            "avg_market_size_usd": avg_market_size,
            "growing_markets": sum(1 for d in market_data if d["price_analysis"]["trend"] == "growing"),
            "stable_markets": sum(1 for d in market_data if d["price_analysis"]["trend"] == "stable")
        }
    
    def _generate_market_recommendations(self, market_data: List[Dict[str, Any]]) -> List[str]:
        """Генерація рекомендацій для ринкового аналізу"""
        recommendations = []
        
        growing_markets = [d for d in market_data if d["price_analysis"]["trend"] == "growing"]
        if growing_markets:
            recommendations.append(f"Зосередьтеся на {len(growing_markets}) зростаючих ринках")
        
        high_savings = [d for d in market_data if d["recommendations"]["estimated_savings_pct"] > 20]
        if high_savings:
            recommendations.append(f"Можливі економії до {max(d['recommendations']['estimated_savings_pct'] for d in high_savings)}%")
        
        return recommendations
    
    def _generate_procurement_summary(self, procurement_data: Dict[str, Any]) -> Dict[str, Any]:
        """Генерація зведення закупівельного звіту"""
        return {
            "total_countries": len(procurement_data["country_ranking"]),
            "best_country": procurement_data["recommendations"]["best_country"],
            "estimated_savings": procurement_data["recommendations"]["estimated_savings"],
            "price_trend": procurement_data["price_trends"]["trend_percent"]
        }


class ReportScheduler:
    """Планувальник звітів"""
    
    def __init__(self, report_generator: ReportGenerator):
        self.report_generator = report_generator
        self.scheduled_reports: Dict[str, ReportConfig] = {}
        self.running_tasks: Dict[str, asyncio.Task] = {}
    
    def add_scheduled_report(self, config: ReportConfig):
        """Додати запланований звіт"""
        self.scheduled_reports[config.id] = config
        logger.info("Added scheduled report: %s", config.name)
    
    async def start_scheduler(self):
        """Запустити планувальник"""
        logger.info("Starting report scheduler")
        
        # Запускаємо задачі для кожного запланованого звіту
        for config in self.scheduled_reports.values():
            if config.enabled:
                task = asyncio.create_task(self._run_scheduled_report(config))
                self.running_tasks[config.id] = task
    
    async def stop_scheduler(self):
        """Зупинити планувальник"""
        logger.info("Stopping report scheduler")
        
        # Скасувати всі задачі
        for task in self.running_tasks.values():
            task.cancel()
        
        # Чекаємо завершення
        if self.running_tasks:
            await asyncio.gather(*self.running_tasks.values(), return_exceptions=True)
        
        self.running_tasks.clear()
    
    async def _run_scheduled_report(self, config: ReportConfig):
        """Виконання запланованого звіту"""
        while True:
            try:
                # Розрахунок наступного часу виконання
                next_run = self._calculate_next_run(config)
                wait_seconds = (next_run - datetime.now(UTC)).total_seconds()
                
                if wait_seconds > 0:
                    await asyncio.sleep(wait_seconds)
                
                # Генерація звіту
                if config.type == ReportType.RISK_MONITORING:
                    edrpou_list = config.parameters.get("edrpou_list", [])
                    report = await self.report_generator.generate_risk_monitoring_report(
                        edrpou_list=edrpou_list,
                        format=config.format,
                        template=config.template
                    )
                elif config.type == ReportType.MARKET_ANALYSIS:
                    product_codes = config.parameters.get("product_codes", [])
                    report = await self.report_generator.generate_market_analysis_report(
                        product_codes=product_codes,
                        format=config.format,
                        template=config.template
                    )
                elif config.type == ReportType.PROCUREMENT_REPORT:
                    product_code = config.parameters.get("product_code")
                    months = config.parameters.get("months", 12)
                    report = await self.report_generator.generate_procurement_report(
                        product_code=product_code,
                        months=months,
                        format=config.format,
                        template=config.template
                    )
                else:
                    logger.warning("Unsupported report type: %s", config.type)
                    continue
                
                # Відправка звіту отримувачам
                await self._send_report_to_recipients(report, config.recipients)
                
                logger.info("Generated scheduled report: %s", config.name)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("Error in scheduled report %s: %s", config.name, e)
                await asyncio.sleep(300)  # Чекаємо 5 хвилин перед повторною спробою
    
    def _calculate_next_run(self, config: ReportConfig) -> datetime:
        """Розрахувати наступний час виконання"""
        now = datetime.now(UTC)
        
        if config.frequency == ScheduleFrequency.DAILY:
            return now + timedelta(days=1)
        elif config.frequency == ScheduleFrequency.WEEKLY:
            return now + timedelta(weeks=1)
        elif config.frequency == ScheduleFrequency.MONTHLY:
            return now + timedelta(days=30)
        elif config.frequency == ScheduleFrequency.QUARTERLY:
            return now + timedelta(days=90)
        else:
            # Для CUSTOM використовуємо custom_schedule
            return now + timedelta(hours=1)  # За замовчуванням
    
    async def _send_report_to_recipients(self, report: GeneratedReport, recipients: List[str]):
        """Відправити звіт отримувачам"""
        # Імітація відправки email
        logger.info("Sending report %s to %s", report.name, ", ".join(recipients))
        
        # Реалізація відправки через email API
        # for recipient in recipients:
        #     await self._send_email_with_attachment(recipient, report)


# Фабричні функції
def get_report_generator(output_dir: str = "/tmp/reports") -> ReportGenerator:
    """Отримати інстанс ReportGenerator"""
    return ReportGenerator(output_dir)


def get_report_scheduler(report_generator: ReportGenerator) -> ReportScheduler:
    """Отримати інстанс ReportScheduler"""
    return ReportScheduler(report_generator)


# Приклади використання
async def example_reports_usage():
    """Приклади використання системи звітів"""
    
    generator = get_report_generator()
    scheduler = get_report_scheduler(generator)
    
    # Генерація звіту моніторингу ризиків
    risk_report = await generator.generate_risk_monitoring_report(
        edrpou_list=["12345678", "87654321", "11111111"],
        format=ReportFormat.PDF
    )
    print(f"Generated risk report: {risk_report.file_path}")
    
    # Генерація звіту аналізу ринку
    market_report = await generator.generate_market_analysis_report(
        product_codes=["87032310", "85171200"],
        format=ReportFormat.EXCEL
    )
    print(f"Generated market report: {market_report.file_path}")
    
    # Додавання запланованих звітів
    risk_config = ReportConfig(
        id="daily_risk_monitoring",
        name="Daily Risk Monitoring",
        type=ReportType.RISK_MONITORING,
        format=ReportFormat.PDF,
        frequency=ScheduleFrequency.DAILY,
        recipients=["admin@example.com", "risk@example.com"],
        parameters={"edrpou_list": ["12345678", "87654321", "11111111"]}
    )
    
    scheduler.add_scheduled_report(risk_config)
    
    # Запуск планувальника
    await scheduler.start_scheduler()
    
    print("Reports system configured and scheduler started!")


if __name__ == "__main__":
    asyncio.run(example_reports_usage())
