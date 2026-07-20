import duckdb
from connectors.datagovua import DataGovUAConnector

def run_datagovua_etl():
    connector = DataGovUAConnector()
    connector.incremental_sync()
    
    print("✅ data.gov.ua ETL завершено (ЄДР + інші реєстри)")
