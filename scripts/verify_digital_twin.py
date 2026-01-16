import asyncio
import httpx
import json

SOM_URL = "http://127.0.0.1:8095"

async def verify_digital_twin():
    print("🔮 [PREDATOR DIGITAL TWIN VERIFICATION] Starting...")

    async with httpx.AsyncClient() as client:
        # 1. Submit a Proposal
        print("📝 Submitting architectural change proposal...")
        proposal_data = {
            "title": "Upgrade Truth Ledger to v30.1",
            "description": "Migrating to sharded immutable ledger for higher throughput.",
            "target_component": "truth_ledger",
            "change_type": "infra_upgrade",
            "changes": {"shards": 4, "encryption": "AES-512"}
        }

        resp = await client.post(f"{SOM_URL}/api/v1/som/proposals", json=proposal_data)
        if resp.status_code != 200:
            print(f"❌ Failed to submit proposal: {resp.status_code} - {resp.text}")
            return

        proposal = resp.json()
        proposal_id = proposal["proposal_id"]
        print(f"✅ Proposal submitted: {proposal_id}")

        # 2. Run Digital Twin Simulation
        print(f"⏳ Running Digital Twin simulation for {proposal_id}...")
        sim_resp = await client.post(f"{SOM_URL}/api/v1/som/simulation/run", params={"proposal_id": proposal_id})

        if sim_resp.status_code != 200:
            print(f"❌ Simulation failed: {sim_resp.text}")
            return

        result = sim_resp.json()
        tech = result["technical"]
        debate = result["debate"]

        print(f"📊 Simulation Result: {tech['verdict']}")
        print(f"📈 Predicted Metrics: {json.dumps(tech['predicted_metrics'], indent=2)}")
        print(f"🛡️ Safety Analysis: {json.dumps(tech['risk_analysis'], indent=2)}")

        print("\n🗣️ [SOVEREIGN DEBATE]")
        print(f"🏗️ Architect: {debate['architect_view']}")
        print(f"🛡️ Guardian: {debate['guardian_view']}")
        print(f"⚖️ Synthesis: {debate['synthesis']}")

        # 3. Check Proposal Status Updated
        print("🔍 Verifying proposal status update...")
        status_resp = await client.get(f"{SOM_URL}/api/v1/som/proposals")
        data = status_resp.json()
        proposals = data["proposals"]

        updated_proposal = next((p for p in proposals if p["id"] == proposal_id), None)
        if updated_proposal:
            print(f"✅ Proposal status: {updated_proposal['status']}")
            if updated_proposal["status"] in ["awaiting_approval", "rejected"]:
                 print("🏆 DIGITAL TWIN TEST PASSED.")
            else:
                 print(f"❌ Unexpected status: {updated_proposal['status']}")
        else:
            print("❌ Proposal not found in registry.")

if __name__ == "__main__":
    asyncio.run(verify_digital_twin())
