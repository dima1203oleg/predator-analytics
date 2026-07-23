import asyncio
import json
from app.routers.person_dossier import _run_scan, ScanRequest, _scan_jobs

async def main():
    job_id = "test_123"
    _scan_jobs[job_id] = {"progress": 0, "message": "Init", "result": None}
    
    req = ScanRequest(
        fullName="кізима дмитро миколайович",
        ipn="3111724753",
        dateOfBirth="12.03.1985",
        address="стрийський райно с угерсько"
    )
    
    print("Starting scan...")
    try:
        await _run_scan(job_id, req)
        res = _scan_jobs[job_id]
        print("\n=== SCAN RESULT ===")
        # Print only the AI Profile if we can
        result_data = res.get("result", {})
        if result_data:
            print("AI Profile:")
            print(result_data.get("aiProfile", "No AI Profile found"))
        else:
            print("No result in job:", res)
    except Exception as e:
        print("Error during scan:", e)

if __name__ == "__main__":
    asyncio.run(main())
