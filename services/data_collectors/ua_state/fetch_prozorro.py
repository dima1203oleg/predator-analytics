import logging

import requests

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("prozorro-full")

BASE_URL = "https://public.api.openprocurement.org/api/2.5"

def fetch_top_tenders(limit: int = 20):
    url = f"{BASE_URL}/tenders"
    params = {"limit": limit, "descending": 1}
    response = requests.get(url, params=params)
    response.raise_for_status()
    tenders_list = response.json().get("data", [])

    results = []
    for t_summary in tenders_list:
        tid = t_summary['id']
        try:
            t_url = f"{BASE_URL}/tenders/{tid}"
            detail = requests.get(t_url, timeout=10).json().get("data")
            results.append({
                "id": tid,
                "title": detail.get("title"),
                "value": detail.get("value", {}).get("amount"),
                "currency": detail.get("value", {}).get("currency"),
                "status": detail.get("status"),
                "date": detail.get("dateModified"),
                "procuringEntity": detail.get("procuringEntity", {}).get("name")
            })
        except Exception as e:
            logger.error(f"Error detail {tid}: {e}")

    return results

if __name__ == "__main__":
    tenders = fetch_top_tenders(15)
    for t in tenders:
        print(f"[{t['status']}] {t['value']} {t['currency']} | {t['procuringEntity']} | {t['title'][:60]}...")
