import duckdb
from connectors.opensanctions import OpenSanctionsConnector

def run_opensanctions_etl():
    connector = OpenSanctionsConnector()
    connector.download_bulk()
    
    con = duckdb.connect()
    
    print("✅ OpenSanctions ETL завершено — дані готові для графу зв’язків")
