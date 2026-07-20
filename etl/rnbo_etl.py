import duckdb
import json
from connectors.rnbo import RnboSanctionsConnector

def run_rnbo_etl():
    connector = RnboSanctionsConnector()
    data = connector.full_sync()
    
    con = duckdb.connect()
    con.execute("CREATE TABLE raw_rnbo AS SELECT * FROM json(?)", [json.dumps(data)])
    
    print("✅ РНБО ETL завершено — санкції готові до графу")
