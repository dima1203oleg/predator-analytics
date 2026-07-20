from connectors.prozorro import ProZorroConnector
from connectors.spending import SpendingConnector
from connectors.nazk import NazkConnector
from connectors.opensanctions import OpenSanctionsConnector
from connectors.datagovua import DataGovUAConnector
from connectors.rnbo import RnboSanctionsConnector
from connectors.nbu import NbuConnector
from connectors.vru import VruConnector
from connectors.gdelt import GdeltConnector
from connectors.otx import OtxConnector
from connectors.opencorporates import OpenCorporatesConnector
from connectors.mitre import MitreConnector
from connectors.nominatim import NominatimConnector
from connectors.courtlistener import CourtListenerConnector

def run_full_pipeline():
    print("🚀 Запуск повного ETL для Predator Analytics...")
    
    connectors = [
        ProZorroConnector(),
        SpendingConnector(),
        NazkConnector(),
        OpenSanctionsConnector(),
        DataGovUAConnector(),
        RnboSanctionsConnector(),
        NbuConnector(),
        VruConnector(),
        GdeltConnector(),
        OtxConnector(),
        OpenCorporatesConnector(),
        MitreConnector(),
        NominatimConnector(),
        CourtListenerConnector()
    ]
    
    for conn in connectors:
        try:
            print(f"\n--- Запуск {conn.__class__.__name__} ---")
            conn.full_etl()
        except Exception as e:
            print(f"❌ Помилка в {conn.__class__.__name__}: {e}")
            
    print("\n✅ Повний цикл завершено!")

if __name__ == "__main__":
    run_full_pipeline()
