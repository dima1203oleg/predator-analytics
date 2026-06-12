from fastapi import FastAPI
from core.infra import InfraChecker
from core.data import DataChecker
from core.dom import DOMChecker
from core.flow import FlowChecker
from reports.generator import ReportGenerator
from graph.neo4j_client import Neo4jClient

app = FastAPI(title="ASVE Engine", description="Autonomous System Verification Engine", version="1.0.0")

@app.get("/run-full-audit")
async def run_audit():
    infra = await InfraChecker().run()
    data = await DataChecker().run()
    dom = await DOMChecker().run()
    flow = await FlowChecker().run()

    # Record System Graph in Neo4j
    neo4j = Neo4jClient()
    graph_state = await neo4j.record_system_state(infra, data, dom, flow)
    await neo4j.close()

    report = ReportGenerator().build(
        infra=infra,
        data=data,
        dom=dom,
        flow=flow
    )
    report["graph_brain"] = graph_state
    return report

if __name__ == "__main__":
    import uvicorn
    import sys
    import asyncio
    import pprint
    
    if "--run-full-audit" in sys.argv:
        print("Starting Autonomous System Verification Engine (ASVE) E2E Audit...")
        result = asyncio.run(run_audit())
        print("\n=== FINAL ASVE REPORT ===")
        pprint.pprint(result)
        if result.get("status") == "DEGRADED":
            sys.exit(1)
        sys.exit(0)
    else:
        uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
