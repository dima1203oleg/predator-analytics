import duckdb
from connectors.gdelt import GdeltConnector

def run_gdelt_etl():
    connector = GdeltConnector()
    connector.search_events()
    print("✅ GDELT ETL завершено (медіа-моніторинг)")
