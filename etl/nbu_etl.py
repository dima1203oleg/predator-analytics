import duckdb
from connectors.nbu import NbuConnector

def run_nbu_etl():
    connector = NbuConnector()
    connector.get_exchange_rates()
    print("✅ НБУ ETL завершено")
