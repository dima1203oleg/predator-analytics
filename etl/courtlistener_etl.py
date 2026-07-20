import duckdb
from connectors.courtlistener import CourtListenerConnector

def run_courtlistener_etl():
    connector = CourtListenerConnector()
    connector.full_etl()
    print("✅ CourtListener ETL завершено")
