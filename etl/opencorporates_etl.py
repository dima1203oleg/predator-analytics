import duckdb
from connectors.opencorporates import OpenCorporatesConnector

def run_opencorporates_etl():
    connector = OpenCorporatesConnector()
    connector.full_etl()
    print("✅ OpenCorporates ETL завершено")
