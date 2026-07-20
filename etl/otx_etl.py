import duckdb
from connectors.otx import OtxConnector

def run_otx_etl():
    connector = OtxConnector()
    connector.get_latest_pulses()
    print("✅ OTX ETL завершено")
