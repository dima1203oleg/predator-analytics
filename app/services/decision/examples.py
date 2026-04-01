"""
🧠 Decision Intelligence Engine — Приклади використання

Цей файл містить практичні приклади використання Decision Intelligence Engine
для різних сценаріїв бізнес-аналізу.
"""

import asyncio
import json
from pathlib import Path
from typing import Any

from app.services.decision import (
    BatchProcessor,
    DecisionEngine,
    get_batch_processor,
    get_decision_engine,
    get_procurement_analyzer,
)


async def example_1_quick_risk_assessment():
    """
    Приклад 1: Швидка оцінка ризику контрагента
    
    Сценарій: Менеджер з закупівель отримує нову пропозицію
    і хоче швидко перевірити надійність постачальника.
    """
    print("🔍 Приклад 1: Швидка оцінка ризику")
    print("=" * 50)
    
    from app.services.risk.cers_engine import get_cers_engine
    
    edrpou = "12345678"
    engine = get_cers_engine()
    
    # Симуляція даних компанії
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
    
    print(f"📊 ЄДРПОУ: {edrpou}")
    print(f"⚠️  CERS скор: {result.cers_score}/100")
    print(f"🎯 Рівень ризику: {result.risk_level}")
    print(f"📋 Вердикт: {verdict_map.get(result.risk_level, 'НЕВІДОМО')}")
    
    if result.cers_score < 25:
        print("✅ Рекомендовано: Можна працювати")
    elif result.cers_score < 50:
        print("⚠️  Рекомендовано: Перевірити документи")
    elif result.cers_score < 75:
        print("🔍 Рекомендовано: Повна due diligence")
    else:
        print("🚨 Рекомендовано: Уникати співпраці")
    
    print()


async def example_2_full_recommendation():
    """
    Приклад 2: Повна рекомендація для закупівлі
    
    Сценарій: Компанія планує закупити нове обладнання
    і需要一个综合的采购建议。
    """
    print("🧠 Приклад 2: Повна рекомендація для закупівлі")
    print("=" * 50)
    
    engine = get_decision_engine()
    
    # Демонстраційні дані (в реальному сценарії з БД)
    recommendation = {
        "ueid": "12345678",
        "product_code": "87032310",  # Автомобілі
        "company_name": "ТОВ ТехноСервіс",
        "timestamp": "2025-01-01T12:00:00Z",
        "summary": "Ринок автомобілів показує стабільний попит з помірною конкуренцією",
        "confidence": 78,
        "risk_score": 32,
        "risk_level": "medium",
        "scenarios": [
            {
                "name": "Оптимальний",
                "probability": 65,
                "impact": "Позитивний",
                "description": "Закупити у перевірених європейських постачальників",
                "actions": [
                    "Перевірити 3 постачальники з Німеччини",
                    "Неготіювати знижку 5-7%",
                    "Укласти контракт з гарантією 2 роки"
                ]
            },
            {
                "name": "Сприятливий",
                "probability": 25,
                "impact": "Дуже позитивний",
                "description": "Ринок зростає, можна розширити закупівлі",
                "actions": [
                    "Збільшити обсяги на 20%",
                    "Розглянути leasing опції"
                ]
            },
            {
                "name": "Несприятливий",
                "probability": 10,
                "impact": "Негативний",
                "description": "Ризик затримок поставок через логістику",
                "actions": [
                    "Знайти локальних постачальників",
                    "Створити резервний запас"
                ]
            }
        ],
        "procurement": {
            "advice": "Найкращі ціни в Німеччині, але врахуйте логістику",
            "best_country": "DE",
            "estimated_savings": 15000,
            "market_avg_price": 25000,
            "hhi": 1850  # Помірна концентрація
        }
    }
    
    print(f"📦 Товар: {recommendation['product_code']} (Автомобілі)")
    print(f"🏢 Компанія: {recommendation['company_name']}")
    print(f"📊 Впевненість: {recommendation['confidence']}%")
    print(f"⚠️  Ризик: {recommendation['risk_score']}/100")
    print(f"📝 Резюме: {recommendation['summary']}")
    
    print(f"\n💰 Закупівельна аналітика:")
    print(f"   Найкраща країна: {recommendation['procurement']['best_country']}")
    print(f"   Потенційна економія: ${recommendation['procurement']['estimated_savings']:,}")
    print(f"   Середня ринкова ціна: ${recommendation['procurement']['market_avg_price']:,}")
    
    print(f"\n🎯 Рекомендовані сценарії:")
    for scenario in recommendation['scenarios']:
        print(f"\n📍 {scenario['name']} ({scenario['probability']}% шанс)")
        print(f"   {scenario['description']}")
        print(f"   Дії:")
        for action in scenario['actions']:
            print(f"     • {action}")
    
    print()


async def example_3_batch_due_diligence():
    """
    Приклад 3: Масовий due diligence для бази постачальників
    
    Сценарій: Компанія має базу з 50 постачальників і хоче
    перевірити їх на ризики перед новим тендером.
    """
    print("📋 Приклад 3: Масовий due diligence постачальників")
    print("=" * 50)
    
    # Симуляція бази даних постачальників
    supplier_edrpou_list = [
        "12345678", "87654321", "11111111", "22222222", "33333333",
        "44444444", "55555555", "66666666", "77777777", "88888888",
        "99999999", "00000000", "12121212", "34343434", "56565656"
    ]
    
    processor = get_batch_processor(max_concurrent=10)
    
    print(f"📊 Аналізуємо {len(supplier_edrpou_list)} постачальників...")
    
    results = await processor.analyze_companies(
        edrpou_list=supplier_edrpou_list,
        analysis_type="quick_score",
        db=None  # Без БД для швидкості
    )
    
    report = processor.generate_report(results)
    
    print(f"\n📈 РЕЗУЛЬТАТИ АНАЛІЗУ")
    print(f"✅ Успішно проаналізовано: {report['summary']['successful']}")
    print(f"❌ Помилки: {report['summary']['failed']}")
    print(f"📈 Успішність: {report['summary']['success_rate']}%")
    print(f"⏱️  Середній час: {report['summary']['avg_duration_ms']:.0f}мс")
    
    # Розподіл ризиків
    risk_dist = report['risk_distribution']
    if any(risk_dist.values()):
        print(f"\n📊 Розподіл ризиків:")
        for level, count in risk_dist.items():
            if count > 0:
                emoji = {"low": "🟢", "medium": "🟡", "high": "🟠", "critical": "🔴"}.get(level, "⚪")
                print(f"   {emoji} {level}: {count}")
    
    # Високоризикові постачальники
    high_risk = report.get('high_risk_companies', [])
    if high_risk:
        print(f"\n🚨 Високоризикові постачальники ({len(high_risk)}):")
        for edrpou in high_risk[:5]:
            print(f"   • {edrpou}")
        if len(high_risk) > 5:
            print(f"   ... та ще {len(high_risk) - 5}")
    
    # Рекомендації
    print(f"\n💡 РЕКОМЕНДАЦІЇ:")
    if report['summary']['success_rate'] >= 90:
        print("✅ База постачальників надійна")
    elif report['summary']['success_rate'] >= 70:
        print("⚠️  База постачальників потребує уваги")
    else:
        print("🚨 Рекомендується повна перевірка бази постачальників")
    
    if len(high_risk) > 0:
        print(f"🔍 Перевірте {len(high_risk)} високоризикових постачальників")
    
    print()


async def example_4_market_analysis():
    """
    Приклад 4: Аналіз ринку для нового продукту
    
    Сценарій: Компанія розглядає можливість виходу на ринок
    нових товарів і需要一个全面的市场分析。
    """
    print("🌍 Приклад 4: Аналіз ринку для нового продукту")
    print("=" * 50)
    
    analyzer = get_procurement_analyzer()
    
    # Демонстраційні дані аналізу ринку
    market_analysis = {
        "product_code": "85171200",  # Смартфони
        "market_size": {
            "total_importers": 156,
            "total_value_usd": 450000000,
            "avg_transaction_value": 2884615,
        },
        "country_ranking": [
            {"country": "CN", "country_name": "Китай", "avg_price": 850, "market_share": 45.2},
            {"country": "KR", "country_name": "Південна Корея", "avg_price": 1200, "market_share": 22.8},
            {"country": "US", "country_name": "США", "avg_price": 1450, "market_share": 18.5},
            {"country": "VN", "country_name": "В'єтнам", "avg_price": 650, "market_share": 8.7},
            {"country": "DE", "country_name": "Німеччина", "avg_price": 1350, "market_share": 4.8}
        ],
        "top_suppliers": [
            {"edrpou": "11111111", "name": "Tech Solutions Ltd", "total_value": 45000000, "avg_price": 880},
            {"company_name": "Global Electronics", "total_value": 38000000, "avg_price": 920},
            {"company_name": "Asia Mobile Corp", "total_value": 32000000, "avg_price": 860},
            {"company_name": "EuroTech GmbH", "total_value": 28000000, "avg_price": 1380},
            {"company_name": "Smart Devices Inc", "total_value": 25000000, "avg_price": 890}
        ],
        "price_analysis": {
            "market_avg": 1050,
            "price_range": {"min": 450, "max": 2500},
            "std_deviation": 320,
            "median": 980
        },
        "recommendations": {
            "procurement": "Рекомендуємо закупівлю у в'єтнамських постачальників для оптимального співвідношення ціни/якості",
            "best_country": "VN",
            "estimated_savings_pct": 23.5,
            "risk_factors": ["Логістичні витрати", "Митні оформлення"],
            "market_trend": "Зростання попиту на бюджетні моделі"
        }
    }
    
    print(f"📱 Аналіз ринку: {market_analysis['product_code']} (Смартфони)")
    print(f"💰 Обсяг ринку: ${market_analysis['market_size']['total_value_usd']:,}")
    print(f"🏢 Кількість імпортерів: {market_analysis['market_size']['total_importers']}")
    print(f"💵 Середня угода: ${market_analysis['market_size']['avg_transaction_value']:,}")
    
    print(f"\n🌍 ТОП-5 країн постачальників:")
    for i, country in enumerate(market_analysis['country_ranking'], 1):
        print(f"   {i}. {country['country_name']} ({country['country']}) - "
              f"${country['avg_price']} - {country['market_share']}% ринку")
    
    print(f"\n🏆 ТОП постачальники:")
    for supplier in market_analysis['top_suppliers'][:3]:
        if 'edrpou' in supplier:
            print(f"   • {supplier['name']} ({supplier['edrpou']}) - "
                  f"${supplier['avg_price']} - ${supplier['total_value']:,} загалом")
        else:
            print(f"   • {supplier['company_name']} - "
                  f"${supplier['avg_price']} - ${supplier['total_value']:,} загалом")
    
    print(f"\n💡 РЕКОМЕНДАЦІЇ:")
    print(f"   Найкраща країна: {market_analysis['recommendations']['best_country']}")
    print(f"   Потенційна економія: {market_analysis['recommendations']['estimated_savings_pct']}%")
    print(f"   Радимо: {market_analysis['recommendations']['procurement']}")
    print(f"   Тренд: {market_analysis['recommendations']['market_trend']}")
    
    print()


async def example_5_niche_finder():
    """
    Приклад 5: Пошук ринкових ніш
    
    Сценарій: Компанія шукає нові ринкові можливості
    з низькою конкуренцією та стабільним попитом.
    """
    print("🔍 Приклад 5: Пошук ринкових ніш")
    print("=" * 50)
    
    # Демонстраційні результати пошуку ніш
    niche_analysis = {
        "niches": [
            {
                "product_code": "84719000",
                "product_name": "Комп'ютерні пристрої вводу/виводу",
                "transaction_count": 23,
                "player_count": 3,
                "total_value_usd": 850000,
                "avg_unit_price_usd": 45.20,
                "potential_score": 85,
                "recommendation": "🟢 Висока перспектива — активний ринок, мало конкурентів",
                "first_seen": "2023-01-15",
                "last_seen": "2024-12-01"
            },
            {
                "product_code": "61051000",
                "product_name": "Чоловічі сорочки з бавовни",
                "transaction_count": 18,
                "player_count": 2,
                "total_value_usd": 180000,
                "avg_unit_price_usd": 8.90,
                "potential_score": 72,
                "recommendation": "🟢 Висока перспектива — активний ринок, мало конкурентів",
                "first_seen": "2023-03-20",
                "last_seen": "2024-11-28"
            },
            {
                "product_code": "39269097",
                "product_name": "Вироби з пластмас",
                "transaction_count": 31,
                "player_count": 4,
                "total_value_usd": 320000,
                "avg_unit_price_usd": 12.50,
                "potential_score": 62,
                "recommendation": "🟡 Помірна перспектива — варто дослідити детальніше",
                "first_seen": "2022-11-10",
                "last_seen": "2024-12-05"
            },
            {
                "product_code": "85423900",
                "product_name": "Електронні плати",
                "transaction_count": 12,
                "player_count": 5,
                "total_value_usd": 1450000,
                "avg_unit_price_usd": 280.50,
                "potential_score": 48,
                "recommendation": "🔵 Нішовий ринок — малий обсяг, але вільний",
                "first_seen": "2023-06-01",
                "last_seen": "2024-10-15"
            }
        ],
        "total": 4,
        "criteria": {"min_transactions": 5, "max_players": 5}
    }
    
    print(f"🔍 Знайдено {niche_analysis['total']} ринкових ніш")
    print(f"📊 Критерії пошуку: мінімум {niche_analysis['criteria']['min_transactions']} транзакцій, "
          f"максимум {niche_analysis['criteria']['max_players']} гравців")
    
    high_potential = [n for n in niche_analysis['niches'] if n['potential_score'] >= 70]
    medium_potential = [n for n in niche_analysis['niches'] if 50 <= n['potential_score'] < 70]
    low_potential = [n for n in niche_analysis['niches'] if n['potential_score'] < 50]
    
    print(f"\n🟢 Високий потенціал ({len(high_potential)}):")
    for niche in high_potential:
        print(f"   • {niche['product_name']} ({niche['product_code']})")
        print(f"     Потенціал: {niche['potential_score']}/100")
        print(f"     Ринок: ${niche['total_value_usd']:,}, {niche['player_count']} гравців")
        print(f"     {niche['recommendation']}")
    
    if medium_potential:
        print(f"\n🟡 Помірний потенціал ({len(medium_potential)}):")
        for niche in medium_potential:
            print(f"   • {niche['product_name']} ({niche['product_code']}) - "
                  f"{niche['potential_score']}/100")
    
    if low_potential:
        print(f"\n🔵 Нішовий потенціал ({len(low_potential)}):")
        for niche in low_potential:
            print(f"   • {niche['product_name']} ({niche['product_code']}) - "
                  f"{niche['potential_score']}/100")
    
    print(f"\n💡 РЕКОМЕНДАЦІЇ:")
    if high_potential:
        best = max(high_potential, key=lambda x: x['potential_score'])
        print(f"🎯 Найкраща ніша: {best['product_name']}")
        print(f"   Потенціал: {best['potential_score']}/100")
        print(f"   Середня ціна: ${best['avg_unit_price_usd']}")
        print(f"   Рекомендуємо швидко зайти в ринок")
    
    print()


async def main():
    """Запустити всі приклади"""
    print("🧠 Decision Intelligence Engine — Приклади використання")
    print("=" * 60)
    print()
    
    await example_1_quick_risk_assessment()
    await example_2_full_recommendation()
    await example_3_batch_due_diligence()
    await example_4_market_analysis()
    await example_5_niche_finder()
    
    print("✅ Всі приклади завершено")
    print("\n💡 Додаткові ресурси:")
    print("   📚 Документація: app/services/decision/README.md")
    print("   💻 CLI утиліта: python -m app.services.decision.cli --help")
    print("   🌐 UI: http://localhost:3030/decision-intelligence")
    print("   📊 API: http://localhost:8000/docs")


if __name__ == "__main__":
    asyncio.run(main())
