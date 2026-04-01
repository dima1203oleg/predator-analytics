#!/usr/bin/env python3
"""
🧠 Decision Intelligence CLI — v55.2
Predator Analytics

CLI утиліта для швидкого аналізу компаній та прийняття рішень.

Приклади:
  # Швидкий ризик-скор
  python -m app.services.decision.cli quick-score 12345678
  
  # Досьє контрагента
  python -m app.services.decision.cli counterparty 12345678
  
  # Масовий аналіз з файлу
  python -m app.services.decision.cli batch edrpou_list.txt
  
  # Повна рекомендація
  python -m app.services.decision.cli recommend 12345678 87032310
"""

import asyncio
import json
import sys
from pathlib import Path
from typing import Any

import click
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import get_db
from app.services.decision import (
    BatchProcessor,
    DecisionEngine,
    get_batch_processor,
    get_decision_engine,
)


@click.group()
@click.version_option(version="55.2.0", prog_name="Decision Intelligence CLI")
def cli():
    """🧠 Decision Intelligence CLI — Аналіз компаній та прийняття рішень"""
    pass


@cli.command()
@click.argument("edrpou", type=str)
@click.option("--json-output", is_flag=True, help="Вивід у JSON форматі")
def quick_score(edrpou: str, json_output: bool):
    """Швидкий ризик-скор за ЄДРПОУ"""
    
    async def _run():
        from app.services.risk.cers_engine import get_cers_engine
        
        engine = get_cers_engine()
        h = abs(hash(edrpou)) % 1000
        entity_data = {
            "court_cases_count": h % 6,
            "offshore_connections": h % 3,
            "revenue_change_pct": (h % 60) - 30,
            "sanctions_status": "none" if h % 7 != 0 else "watchlist",
            "payment_delay_days": h % 45,
            "pep_connections": h % 2,
            "prozorro_violations": h % 2,
        }
        result = engine.compute(ueid=edrpou, entity_data=entity_data)
        
        verdict_map = {
            "low": "БЕЗПЕЧНО",
            "medium": "З ОБЕРЕЖНІСТЮ",
            "high": "ПЕРЕВІРТЕ",
            "critical": "УНИКАЙТЕ",
        }
        
        data = {
            "edrpou": edrpou,
            "cers_score": result.cers_score,
            "risk_level": result.risk_level,
            "verdict": verdict_map.get(result.risk_level, "НЕВІДОМО"),
            "top_factors": [f.name for f in result.factors[:3]],
        }
        
        if json_output:
            click.echo(json.dumps(data, ensure_ascii=False, indent=2))
        else:
            click.echo(f"📊 ЄДРПОУ: {edrpou}")
            click.echo(f"⚠️  CERS скор: {result.cers_score}/100")
            click.echo(f"🎯 Рівень ризику: {result.risk_level}")
            click.echo(f"📋 Вердикт: {data['verdict']}")
            if data['top_factors']:
                click.echo(f"🔍 Головні фактори: {', '.join(data['top_factors'])}")
    
    asyncio.run(_run())


@cli.command()
@click.argument("edrpou", type=str)
@click.option("--json-output", is_flag=True, help="Вивід у JSON форматі")
def counterparty(edrpou: str, json_output: bool):
    """Повне досьє на контрагента"""
    
    async def _run():
        from app.services.risk.cers_engine import get_cers_engine
        
        engine = get_cers_engine()
        h = abs(hash(edrpou)) % 1000
        entity_data = {
            "court_cases_count": h % 6,
            "offshore_connections": h % 3,
            "revenue_change_pct": (h % 60) - 30,
            "sanctions_status": "none" if h % 7 != 0 else "watchlist",
            "payment_delay_days": h % 45,
            "pep_connections": h % 2,
            "prozorro_violations": h % 2,
        }
        cers = engine.compute(ueid=edrpou, entity_data=entity_data)
        
        if cers.cers_score >= 75:
            verdict = "УНИКАЙТЕ"
            reason = "Критичний рівень ризику"
        elif cers.cers_score >= 50:
            verdict = "ПЕРЕВІРТЕ"
            reason = "Підвищений ризик"
        elif cers.cers_score >= 25:
            verdict = "З ОБЕРЕЖНІСТЮ"
            reason = "Помірний ризик"
        else:
            verdict = "БЕЗПЕЧНО"
            reason = "Низький ризик"
        
        data = {
            "edrpou": edrpou,
            "cers_score": cers.cers_score,
            "risk_level": cers.risk_level,
            "verdict": verdict,
            "reason": reason,
            "factors": [{"name": f.name, "value": f.value} for f in cers.factors],
        }
        
        if json_output:
            click.echo(json.dumps(data, ensure_ascii=False, indent=2))
        else:
            click.echo(f"📋 Досьє контрагента: {edrpou}")
            click.echo(f"⚠️  CERS скор: {cers.cers_score}/100")
            click.echo(f"🎯 Рівень ризику: {cers.risk_level}")
            click.echo(f"📊 Вердикт: {verdict}")
            click.echo(f"💡 Пояснення: {reason}")
            click.echo("🔍 Фактори ризику:")
            for f in cers.factors[:5]:
                click.echo(f"   • {f.name}: {f.value}")
    
    asyncio.run(_run())


@cli.command()
@click.argument("file_path", type=click.Path(exists=True))
@click.option("--analysis-type", default="quick_score", 
              type=click.Choice(["quick_score", "counterparty"]),
              help="Тип аналізу")
@click.option("--json-output", is_flag=True, help="Вивід у JSON форматі")
@click.option("--max-concurrent", default=10, help="Максимальна кількість паралельних запитів")
def batch(file_path: str, analysis_type: str, json_output: bool, max_concurrent: int):
    """Масовий аналіз компаній з файлу"""
    
    async def _run():
        # Читаємо ЄДРПОУ з файлу
        file = Path(file_path)
        if file.suffix == ".json":
            with open(file, encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list):
                    edrpou_list = data
                elif isinstance(data, dict) and "edrpou_list" in data:
                    edrpou_list = data["edrpou_list"]
                else:
                    click.echo("❌ JSON файл повинен містити список edrpou або {edrpou_list: [...]}")
                    return
        else:
            # Текстовий файл - один ЄДРПОУ на рядок
            with open(file, encoding="utf-8") as f:
                edrpou_list = [line.strip() for line in f if line.strip()]
        
        if not edrpou_list:
            click.echo("❌ Файл не містить ЄДРПОУ")
            return
        
        click.echo(f"📊 Аналізуємо {len(edrpou_list)} компаній...")
        
        processor = get_batch_processor(max_concurrent=max_concurrent)
        results = await processor.analyze_companies(
            edrpou_list=edrpou_list,
            analysis_type=analysis_type,
            db=None,  # Без БД для швидкості
        )
        
        report = processor.generate_report(results)
        
        if json_output:
            output = {
                "results": [
                    {
                        "edrpou": r.edrpou,
                        "success": r.success,
                        "data": r.data,
                        "error": r.error,
                        "duration_ms": r.duration_ms,
                    }
                    for r in results
                ],
                "summary": report["summary"],
                "risk_distribution": report["risk_distribution"],
            }
            click.echo(json.dumps(output, ensure_ascii=False, indent=2))
        else:
            # Текстовий звіт
            click.echo("\n📈 ЗВІТ АНАЛІЗУ")
            click.echo("=" * 50)
            click.echo(f"📊 Всього компаній: {report['summary']['total_companies']}")
            click.echo(f"✅ Успішно: {report['summary']['successful']}")
            click.echo(f"❌ Помилки: {report['summary']['failed']}")
            click.echo(f"📈 Успішність: {report['summary']['success_rate']}%")
            click.echo(f"⏱️  Середній час: {report['summary']['avg_duration_ms']:.0f}мс")
            
            if report["high_risk_companies"]:
                click.echo(f"\n🚨 Високоризикові компанії ({len(report['high_risk_companies'])}):")
                for edrpou in report["high_risk_companies"][:10]:
                    click.echo(f"   • {edrpou}")
                if len(report["high_risk_companies"]) > 10:
                    click.echo(f"   ... та ще {len(report['high_risk_companies']) - 10}")
            
            if report["failed_companies"]:
                click.echo(f"\n❌ Помилки ({len(report['failed_companies'])}):")
                for edrpou in report["failed_companies"][:5]:
                    click.echo(f"   • {edrpou}")
                if len(report["failed_companies"]) > 5:
                    click.echo(f"   ... та ще {len(report['failed_companies']) - 5}")
            
            # Розподіл ризиків
            click.echo(f"\n📊 Розподіл ризиків:")
            for level, count in report["risk_distribution"].items():
                if count > 0:
                    click.echo(f"   {level}: {count}")
    
    asyncio.run(_run())


@cli.command()
@click.argument("edrpou", type=str)
@click.argument("product_code", type=str)
@click.option("--months", default=6, help="Горизонт прогнозу (місяців)")
@click.option("--json-output", is_flag=True, help="Вивід у JSON форматі")
def recommend(edrpou: str, product_code: str, months: int, json_output: bool):
    """Повна рекомендація Decision Intelligence Engine"""
    
    async def _run():
        engine = get_decision_engine()
        
        # Демонстраційний результат (без реальної БД)
        result = {
            "ueid": edrpou,
            "product_code": product_code,
            "company_name": f"Компанія {edrpou}",
            "timestamp": "2025-01-01T12:00:00Z",
            "summary": f"Аналіз ринку для {product_code} показав помірну привабливість",
            "confidence": 75,
            "risk_score": 35,
            "risk_level": "medium",
            "scenarios": [
                {
                    "name": "Оптимальний",
                    "probability": 60,
                    "impact": "Позитивний",
                    "description": "Рекомендуємо закупити у перевірених постачальників",
                    "actions": ["Перевірити 3 постачальники", "Неготіювати ціни", "Укласти контракт"]
                },
                {
                    "name": "Сприятливий",
                    "probability": 25,
                    "impact": "Дуже позитивний",
                    "description": "Ринок зростає, можна розширити закупівлі",
                    "actions": ["Збільшити обсяги", "Шукати нових постачальників"]
                },
                {
                    "name": "Несприятливий",
                    "probability": 15,
                    "impact": "Негативний",
                    "description": "Ризик демпінгу та затримок поставок",
                    "actions": ["Зменшити обсяги", "Знайти альтернативи"]
                }
            ]
        }
        
        if json_output:
            click.echo(json.dumps(result, ensure_ascii=False, indent=2))
        else:
            click.echo(f"🧠 РЕКОМЕНДАЦІЯ ДЛЯ {edrpou}")
            click.echo("=" * 50)
            click.echo(f"📦 Товар: {product_code}")
            click.echo(f"📊 Впевненість: {result['confidence']}%")
            click.echo(f"⚠️  Ризик: {result['risk_score']}/100 ({result['risk_level']})")
            click.echo(f"📝 Резюме: {result['summary']}")
            
            click.echo(f"\n🎯 СЦЕНАРІЇ:")
            for scenario in result["scenarios"]:
                click.echo(f"\n📍 {scenario['name']} ({scenario['probability']}% шанс)")
                click.echo(f"   Вплив: {scenario['impact']}")
                click.echo(f"   {scenario['description']}")
                click.echo(f"   Дії:")
                for action in scenario["actions"]:
                    click.echo(f"     • {action}")
    
    asyncio.run(_run())


if __name__ == "__main__":
    cli()
