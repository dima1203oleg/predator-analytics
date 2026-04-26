import asyncio
import uuid
import hashlib
import json
from datetime import datetime, UTC, timedelta
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Hardcoded for development
DATABASE_URL = "postgresql+asyncpg://predator:changeme_dev@localhost:5432/predator"
TENANT_ID = "a0000000-0000-0000-0000-000000000001"

async def seed_elite_demo():
    print("🚀 Початок генерації ELITE DEMO датасету...")
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # 1. Очищення старих даних (опціонально)
        # await session.execute(text("TRUNCATE companies, persons, declarations, risk_scores CASCADE"))
        
        # 2. Створення компаній для кейсу "Offshore Loop" (Кругова торгівля)
        # ТОВ "Глобал Трейд" (UA) -> Cyprus Ltd (CY) -> ТОВ "Експорт Плюс" (UA)
        companies = [
            {
                "ueid": "comp_offshore_1",
                "name": 'ТОВ "ГЛОБАЛ ТРЕЙД СИСТЕМЗ"',
                "edrpou": "44123456",
                "cers_score": 65.5,
                "cers_level": "high",
                "description": "Центральний вузол схеми кругової торгівлі"
            },
            {
                "ueid": "comp_offshore_2",
                "name": 'ТОВ "ЕКСПОРТ ПЛЮС"',
                "edrpou": "44987654",
                "cers_score": 42.0,
                "cers_level": "elevated",
                "description": "Отримувач товарів через кіпрську прокладку"
            },
            {
                "ueid": "comp_sleeping_agent",
                "name": 'ТОВ "ВЕКТОР-2024"',
                "edrpou": "45001122",
                "cers_score": 88.2,
                "cers_level": "critical",
                "description": "Кейс 'Сплячий агент': раптовий ріст імпорту на 1200%"
            }
        ]

        for c in companies:
            await session.execute(text("""
                INSERT INTO companies (tenant_id, ueid, edrpou, name, name_normalized, status, cers_score, cers_level, source, created_at)
                VALUES (:tid, :ueid, :edrpou, :name, :name_norm, 'active', :score, :level, 'demo', :now)
                ON CONFLICT (ueid) DO UPDATE SET cers_score = EXCLUDED.cers_score, cers_level = EXCLUDED.cers_level
            """), {
                "tid": TENANT_ID,
                "ueid": c["ueid"],
                "edrpou": c["edrpou"],
                "name": c["name"],
                "name_norm": c["name"].upper().replace('"', ''),
                "score": c["cers_score"],
                "level": c["cers_level"],
                "now": datetime.now(UTC)
            })

        # 3. Створення декларацій для "Offshore Loop"
        # Декларація з аномально низькою ціною
        await session.execute(text("""
            INSERT INTO declarations (
                tenant_id, declaration_number, declaration_date, direction, 
                importer_edrpou, importer_name, exporter_name, exporter_country,
                uktzed_code, goods_description, invoice_value_usd, customs_value_usd, source
            ) VALUES (
                :tid, 'UA100/2024/000001', :date, 'import',
                '44123456', 'ТОВ "ГЛОБАЛ ТРЕЙД СИСТЕМЗ"', 'CYPRUS LOGISTICS LTD', 'CY',
                '8471300000', 'Ноутбуки в асортименті', 150000, 155000, 'demo'
            ) ON CONFLICT DO NOTHING
        """), {"tid": TENANT_ID, "date": datetime.now(UTC).date()})

        # 4. Створення Risk Scores з розбивкою по компонентах (v55.2)
        await session.execute(text("""
            INSERT INTO risk_scores (
                tenant_id, entity_ueid, score_date, cers, cers_confidence,
                behavioral_score, institutional_score, influence_score, structural_score, predictive_score,
                explanation, flags
            ) VALUES (
                :tid, 'comp_offshore_1', :now, 65.5, 0.92,
                45.0, 80.0, 75.0, 50.0, 70.0,
                '{"offshore_risk": 0.85, "graph_centrality": 0.72}',
                '[{"name": "Торгівля з офшором (CY)", "weight": 25}, {"name": "Висока зв''язність", "weight": 15}]'
            ) ON CONFLICT DO NOTHING
        """), {"tid": TENANT_ID, "now": datetime.now(UTC)})

        await session.commit()
        print("✅ PostgreSQL Elite Demo Seed завершено.")

if __name__ == "__main__":
    asyncio.run(seed_elite_demo())
