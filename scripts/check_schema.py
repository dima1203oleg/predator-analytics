from __future__ import annotations

from sqlalchemy import create_engine, text

try:
    engine = create_engine("postgresql://admin:666666@localhost:5432/predator_db")
    with engine.connect() as conn:
        res = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='gold' AND table_name='data_sources'")).fetchall()
        if not res:
            pass
        for _r in res:
            pass
except Exception:
    pass
