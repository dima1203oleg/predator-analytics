import duckdb
from connectors.nominatim import NominatimConnector

def run_nominatim_etl():
    connector = NominatimConnector()
    connector.full_etl()
    print("✅ Nominatim ETL завершено")
