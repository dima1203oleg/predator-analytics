import requests
import logging

logger = logging.getLogger(__name__)

class DataGovUACollector:
    """
    Collector for the official Ukrainian Open Data Portal (data.gov.ua)
    Uses CKAN API v3.
    """
    BASE_URL = "https://data.gov.ua/api/3/action"

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "PredatorAnalytics/v55.0 (OSINT Collector)"
        })

    def search_datasets(self, query: str = "", rows: int = 10, start: int = 0):
        """
        Search for packages (datasets) matching a query.
        """
        params = {
            "q": query,
            "rows": rows,
            "start": start
        }
        try:
            response = self.session.get(f"{self.BASE_URL}/package_search", params=params)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error searching data.gov.ua: {e}")
            return {"success": False, "error": str(e)}

    def get_dataset_details(self, dataset_id: str):
        """
        Get info about a specific dataset (package_show).
        """
        params = {"id": dataset_id}
        try:
            response = self.session.get(f"{self.BASE_URL}/package_show", params=params)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error fetching dataset {dataset_id}: {e}")
            return {"success": False, "error": str(e)}

    def list_recent_datasets(self, limit: int = 10):
        """
        List recently modified datasets.
        """
        # We can use package_search with sort metadata_modified desc
        params = {
            "q": "*:*",
            "sort": "metadata_modified desc",
            "rows": limit
        }
        try:
            response = self.session.get(f"{self.BASE_URL}/package_search", params=params)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error fetching recent datasets: {e}")
            return {"success": False, "error": str(e)}

if __name__ == "__main__":
    # Smoke test
    collector = DataGovUACollector()
    results = collector.search_datasets("закупівлі", rows=3)
    if results.get("success"):
        print(f"Found {results['result']['count']} datasets for 'закупівлі'")
        for pkg in results["result"]["results"]:
            print(f"- {pkg['title']} (ID: {pkg['id']})")
    else:
        print(f"Search failed: {results.get('error')}")
