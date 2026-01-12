
import asyncio
import uuid
from datetime import datetime
from sqlalchemy import text
from libs.core.database import get_db_ctx

async def seed_cases():
    cases = [
        {
            "id": str(uuid.uuid4()),
            "title": 'ТОВ "Буд-Імперія" — Офшорні схеми',
            "situation": 'Виявлено серію транзакцій на загальну суму 45 млн грн через ланцюг посередників у Панамі та Белізі. Гроші перераховані як оплата за консультаційні послуги, що мають ознаки фіктивності.',
            "conclusion": 'Висока ймовірність виведення капіталу за кордон з метою уникнення оподаткування та привласнення бюджетних коштів.',
            "status": 'КРИТИЧНО',
            "risk_score": 92,
            "sector": 'BIZ',
            "entity_id": '38291042', # ЄДРПОУ
            "ai_insight": 'Виявлено збіг IP-адрес директора ТОВ "Буд-Імперія" та бенефіціара панамського фонду "Golden Palm".'
        },
        {
            "id": str(uuid.uuid4()),
            "title": 'Тендер на закупівлю МРТ для обласної лікарні',
            "situation": 'Ціна закупівлі становить 72 млн грн при ринковій вартості аналогічних моделей 48 млн грн. Технічне завдання прописане під конкретного постачальника.',
            "conclusion": 'Ознаки корупційної змови на етапі підготовки тендерної документації. Переплата становить 24 млн грн.',
            "status": 'УВАГА',
            "risk_score": 78,
            "sector": 'MED',
            "entity_id": '40129384',
            "ai_insight": 'Аналіз попередніх 5 тендерів цього замовника показує стабільну перемогу одного і того ж постачальника при наявності дешевшіх пропозицій.'
        },
        {
            "id": str(uuid.uuid4()),
            "title": 'Екологічна аномалія в басейні р. Дністер',
            "situation": 'Датчики зафіксували раптове підвищення рівня важких металів у 15 разів. Офіційні звіти підприємства "Хімік" показують норму.',
            "conclusion": 'Маніпуляція даними екологічного моніторингу. Ймовірне скидання промислових відходів у нічний час.',
            "status": 'КРИТИЧНО',
            "risk_score": 88,
            "sector": 'SCI',
            "entity_id": '29384012',
            "ai_insight": 'Супутникові знімки Sentinel-2 підтверджують скидання речовини невстановленого типу в координатах 48.2N, 25.3E.'
        },
        {
            "id": str(uuid.uuid4()),
            "title": 'ФОП Петренко І.М. — Стандартна перевірка',
            "situation": 'Звичайний аудит фінансової звітності за 3 квартал 2023 року.',
            "conclusion": 'Всі показники в нормі. Відхилень від середньоринкових значень не виявлено.',
            "status": 'БЕЗПЕЧНО',
            "risk_score": 5,
            "sector": 'BIZ',
            "entity_id": '3029485764',
            "ai_insight": 'Поведінковий аналіз не виявив аномалій у графіку транзакцій.'
        }
    ]

    async with get_db_ctx() as db:
        for c in cases:
            await db.execute(text("""
                INSERT INTO gold.cases (id, title, situation, conclusion, status, risk_score, sector, entity_id, ai_insight, created_at, updated_at)
                VALUES (:id, :title, :situation, :conclusion, :status, :risk_score, :sector, :entity_id, :ai_insight, :created_at, :updated_at)
                ON CONFLICT (id) DO NOTHING
            """), {
                "id": c["id"],
                "title": c["title"],
                "situation": c["situation"],
                "conclusion": c["conclusion"],
                "status": c["status"],
                "risk_score": c["risk_score"],
                "sector": c["sector"],
                "entity_id": c["entity_id"],
                "ai_insight": c["ai_insight"],
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            })
        await db.commit()
    print(f"Successfully seeded {len(cases)} cases.")

if __name__ == "__main__":
    asyncio.run(seed_cases())
