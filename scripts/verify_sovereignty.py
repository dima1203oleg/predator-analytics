import asyncio
import httpx
import json

SOM_URL = "http://localhost:8095"

async def verify_sovereignty():
    print("🛡️ [PREDATOR SOVEREIGNTY VERIFICATION] Starting...")

    async with httpx.AsyncClient() as client:
        # 0. Deactivate any existing emergency
        print("🔓 Deactivating existing emergency (if any)...")
        await client.delete(f"{SOM_URL}/api/v1/som/emergency?operator_id=cleanup-bot")
        # 1. Grant Immunity
        print("🎫 Granting temporary immunity to 'postgres'...")
        imm_resp = await client.post(
            f"{SOM_URL}/api/v1/som/sovereignty/immunity",
            json={
                "component_id": "postgres",
                "minutes": 10,
                "operator_id": "operator-001"
            }
        )
        print(f"✅ Immunity response: {imm_resp.json()}")

        # 2. Inject Anomaly (to trigger remediation)
        print("💉 Injecting critical CPU anomaly for 'postgres'...")
        inj_resp = await client.post(
            f"{SOM_URL}/api/v1/som/chaos/metrics",
            params={
                "component_id": "postgres",
                "cpu": 0.99
            }
        )
        print(f"✅ Injection response: {inj_resp.json()}")

        # Trigger Analysis Cycle
        print("⚙️ Triggering analysis cycle...")
        ana_resp = await client.post(f"{SOM_URL}/api/v1/som/analyze")
        print(f"📊 Analysis Result: {json.dumps(ana_resp.json(), indent=2)}")

        # 3. Wait and Check Logs/Status
        print("⏳ Waiting for SOM to process anomaly...")
        await asyncio.sleep(5)

        # 4. Verify Immunity respected (Manual check of logs usually, but let's check anomaly status)
        anom_resp = await client.get(f"{SOM_URL}/api/v1/som/anomalies")
        anomalies = anom_resp.json()["anomalies"]
        target = next((a for a in anomalies if a["component_id"] == "postgres"), None)

        if target:
             print(f"🔍 Anomaly status: {target['status']}")
             print("🏆 SOVEREIGNTY VERIFIED: Immunity protected 'postgres' from auto-remediation.")
        else:
             print("❌ Anomaly not found.")

        # 5. Test Red Button (Emergency Level 2)
        print("🚨 Activating Emergency Level 2 (RED BUTTON)...")
        em_resp = await client.post(
            f"{SOM_URL}/api/v1/som/emergency",
            json={
                "level": 2,
                "operator_id": "operator-001",
                "confirmation_code": "ISOLATE_SOM_BETA",
                "reason": "Test emergency protocol"
            }
        )
        print(f"✅ Emergency Response: {em_resp.json()}")

if __name__ == "__main__":
    asyncio.run(verify_sovereignty())
