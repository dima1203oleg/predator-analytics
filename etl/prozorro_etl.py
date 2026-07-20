import duckdb
import json
from connectors.prozorro import ProZorroConnector

def run_prozorro_etl():
    connector = ProZorroConnector()
    data = connector.incremental_sync()
    
    # DuckDB для швидкої обробки
    con = duckdb.connect()
    con.execute("CREATE TABLE tenders AS SELECT * FROM json(?)", [json.dumps(data)])
    
    # Приклад нормалізації
    con.execute("""
        CREATE TABLE clean_tenders AS 
        SELECT 
            id,
            title,
            status,
            value->>'amount' as amount,
            procuringEntity->>'name' as buyer
        FROM tenders
    """)
    
    print("✅ ETL завершено: clean data готова")
    # Тут можна додати export до PostgreSQL / ClickHouse
