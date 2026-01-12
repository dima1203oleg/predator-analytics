from sqlalchemy import create_engine, text
try:
    engine = create_engine("postgresql://admin:666666@localhost:5432/predator_db")
    with engine.connect() as conn:
        print("Schema of gold.data_sources:")
        res = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='gold' AND table_name='data_sources'")).fetchall()
        if not res:
            print("Table not found!")
        for r in res:
            print(f"- {r[0]} ({r[1]})")
except Exception as e:
    print(f"Error: {e}")
