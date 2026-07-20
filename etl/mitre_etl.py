import duckdb
from connectors.mitre import MitreConnector

def run_mitre_etl():
    connector = MitreConnector()
    connector.full_etl()
    print("✅ MITRE/CVE ETL завершено")
