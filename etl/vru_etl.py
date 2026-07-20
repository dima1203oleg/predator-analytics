import duckdb
from connectors.vru import VruConnector

def run_vru_etl():
    connector = VruConnector()
    connector.sync_bills()
    connector.sync_deputies()
    print("✅ ВРУ ETL завершено")
