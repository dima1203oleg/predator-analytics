import duckdb
import json
from connectors.nazk import NazkConnector

def run_nazk_etl():
    connector = NazkConnector()
    data = connector.incremental_sync(days_back=5)
    
    con = duckdb.connect()
    con.execute("CREATE TABLE raw_nazk AS SELECT * FROM json(?)", [json.dumps(data)])
    
    con.execute("""
        CREATE TABLE clean_nazk AS 
        SELECT 
            id,
            declarant->>'fullName' as full_name,
            declarant->>'position' as position,
            json_extract(declarant, '$.workPlace') as workplace,
            has_family as has_family_links,
            total_assets
        FROM raw_nazk
    """)
    
    print("✅ НАЗК ETL завершено (PEP + декларації)")
