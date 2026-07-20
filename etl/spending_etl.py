import duckdb
import json
from connectors.spending import SpendingConnector

def run_spending_etl():
    connector = SpendingConnector()
    data = connector.incremental_sync(days_back=3)
    
    con = duckdb.connect()
    con.execute("CREATE TABLE raw_spending AS SELECT * FROM json(?)", [json.dumps(data)])
    
    con.execute("""
        CREATE TABLE clean_spending AS 
        SELECT 
            id,
            payment_date,
            amount,
            payer_name,
            payer_edrpou,
            recipient_name,
            recipient_edrpou,
            description
        FROM raw_spending
    """)
    
    print("✅ Spending ETL завершено")
