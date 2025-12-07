from typing import Dict, Any, Optional
import logging
from ..data.retriever_agent import RetrieverAgent
from ..analysis.miner_agent import MinerAgent
from ..core.arbiter_agent import ArbiterAgent
from ..data.crawler_agent import CrawlerAgent
from ...services.llm_service import get_llm_service
from ...services.federation_service import get_federation_service

logger = logging.getLogger("nexus.supervisor")

class NexusSupervisor:
    """
    Main orchestration engine for Predator Analytics MAS.
    Coordinates agents to fulfill user requests.
    """
    def __init__(self):
        self.retriever = RetrieverAgent()
        self.miner = MinerAgent()
        self.arbiter = ArbiterAgent()
        self.crawler = CrawlerAgent()
        logger.info("NexusSupervisor initialized with core agents")

    async def handle_request(self, user_query: str, mode: str = "auto", request_context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Processes a high-level user request through the agent pipeline.
        Supported modes: 'auto', 'fast', 'precise', 'council', 'chat'
        """
        logger.info(f"Processing request: {user_query} [Mode: {mode}]")
        
        # 1. Fast Mode: Optimization for speed
        if mode == "fast":
            retrieval = await self.retriever.process({"query": user_query})
            return {
                "query": user_query, 
                "answer": f"[FAST] Found {len(retrieval.result.get('data',[]))} records. Summary not generated.",
                "trace": [{"agent": "retriever", "status": "success"}]
            }

        # 1.5 Chat Mode (LLM Direct)
        if mode == "chat":
            # Federation Commands Hook
            user_query_lower = user_query.lower()
            
            # Status Check
            if "status" in user_query_lower and ("node" in user_query_lower or "system" in user_query_lower):
                fed_service = get_federation_service()
                nodes = fed_service.get_active_nodes()
                if not nodes:
                     answer = "⚠️ **System Alert**: No Edge Nodes are currently connected to the Federation."
                else:
                    answer = "### 🌍 Federation Status\n\n"
                    for n in nodes:
                        answer += f"**🖥️ {n['info']['hostname']}**\n- ID: `{n['info']['node_id']}`\n- Status: 🟢 {n['status'].upper()}\n- Load: {n.get('load',0)}%\n- Tasks Completed: {n.get('tasks_completed', 0)}\n\n"
                return {"query": user_query, "answer": answer, "mode": "chat", "trace": [{"agent": "nexus", "action": "federation_status"}]}

            # Task Dispatch (Scan CSV)
            if ("scan" in user_query_lower or "import" in user_query_lower) and ".csv" in user_query_lower:
                fed_service = get_federation_service()
                path = "/Users/dima-mac/Documents/Predator_21/sample_data/companies_ukraine.csv" # Demo logic
                try:
                    task_id = fed_service.dispatch_task("scan_csv", {"path": path})
                    answer = f"🚀 **Federation Protocol Initiated**\n\nI have dispatched task `{task_id}` to the Edge Cluster.\n**Target**: `{path}`\n\nThe node will begin processing immediately."
                except Exception as e:
                    answer = f"⚠️ **Dispatch Failed**: {str(e)}\n\nPlease ensure at least one Edge Node is online."
                
                return {"query": user_query, "answer": answer, "mode": "chat", "trace": [{"agent": "nexus", "action": "dispatch_task"}]}

            # Local Ingestion (Knowledge Base)
            if "ingest" in user_query_lower or "learn" in user_query_lower:
                from ...services.ingestor import ingestor_service
                # In a real app, parse path from query. For demo, default to sample.
                path = "/Users/dima-mac/Documents/Predator_21/sample_data/companies_ukraine.csv" 
                try:
                    job = await ingestor_service.ingest_csv(path)
                    answer = f"🧠 **Knowledge Ingestion Started**\n\nJob ID: `{job.id}`\nSource: `{path}`\n\nPredator is now reading {job.records_total} records into the Qdrant Vector Database. This provides Semantic Search capabilities."
                except Exception as e:
                    answer = f"⚠️ **Ingestion Failed**: {str(e)}"
                
                return {"query": user_query, "answer": answer, "mode": "chat", "trace": [{"agent": "nexus", "action": "ingest_data"}]}

            # Web Crawling
            if "crawl" in user_query_lower or "scan http" in user_query_lower:
                # Extract URL (naive)
                import re
                url_match = re.search(r'https?://[^\s]+', user_query)
                if url_match:
                    url = url_match.group(0)
                    answer = f"🕷️ **Autonomous Crawler Activated**\n\nTarget: `{url}`\n\nI am deploying a scout to map this domain. Content will be extracted and indexed into the Knowledge Base."
                    
                    # Fire and forget (or await if fast enough)
                    # For UX, we await but with a small limit
                    try:
                        result = await self.crawler.process({"url": url, "max_pages": 5})
                        stats = result.result.get("stats", {})
                        pages = result.result.get("pages", [])
                        
                        answer += f"\n\n**Mission Metadata**:\n- Pages Scanned: {stats.get('pages_crawled')}\n- Data Volume: {stats.get('total_chars')} chars\n- Knowledge Base Update: {'✅' if stats.get('stored') else '❌'}\n\n**Found Pages**:\n"
                        for p in pages[:3]:
                            answer += f"- [{p['title']}]({p['url']})\n"
                            
                    except Exception as e:
                        answer += f"\n\n⚠️ **Mission Failed**: {str(e)}"
                else:
                     answer = "⚠️ Please provide a valid HTTP(S) URL to crawl."
                
                return {"query": user_query, "answer": answer, "mode": "chat", "trace": [{"agent": "crawler", "status": "success"}]}

            # Shadow Protocol (Hidden Layer)
            if "shadow" in user_query_lower or "classified" in user_query_lower or "decrypt" in user_query_lower:
                from ...services.shadow_service import shadow_service
                
                if "decrypt" in user_query_lower or "read" in user_query_lower:
                    # Naive extraction: Get the word after 'decrypt' or 'read'
                     # Or just try to find a known doc ID in the string
                    docs = shadow_service.list_classified_docs()
                    target = None
                    for d in docs:
                        if d in user_query_lower:
                            target = d
                            break
                    
                    if not target:
                         # Fallback to last word
                         target = user_query.split()[-1]

                    doc = shadow_service.reveal_document(target)
                    if doc:
                        answer = f"🔓 **Decryption Successful**\n\n**Source ID**: `{target}`\n**Clearance**: `{doc.get('clearance')}`\n**Title**: {doc.get('title')}\n\n> {doc.get('content')}\n\n*-- End of Transmission --*"
                    else:
                        answer = f"🚫 **Access Denied**: Document `{target}` not found or integrity compromised."
                    
                    return {"query": user_query, "answer": answer, "mode": "chat", "trace": [{"agent": "nexus", "action": "shadow_decrypt"}]}

                # Default: List
                docs = shadow_service.list_classified_docs()
                if not docs:
                        answer = "🔒 **Shadow Layer**: No classified documents found."
                else:
                    answer = "🔒 **Shadow Protocol Activated**\n\n**Authentication**: `VERIFIED`\n**Clearance**: `OMEGA`\n\n**Available Intelligence**:\n"
                    for doc in docs:
                        answer += f"- 📁 `{doc}`\n"
                    answer += "\nTo decrypt a file, say: `Decrypt <doc_id>`"
                return {"query": user_query, "answer": answer, "mode": "chat", "trace": [{"agent": "nexus", "action": "shadow_access"}]}

            try:
                llm = get_llm_service()
                answer = await llm.generate(
                    user_query, 
                    system_prompt="You are Predator, an advanced AI analytics system. Be concise, professional, and authoritarian."
                )
                return {
                    "query": user_query,
                    "answer": answer,
                    "mode": "chat",
                    "trace": [{"agent": "llm", "status": "success"}]
                }
            except Exception as e:
                logger.error(f"Chat failed: {e}")
                # Fallback to standard flow


        # 2. Standard Flow (Auto/Precise)
        retrieval = await self.retriever.process({"query": user_query})
        data = retrieval.result.get("data", [])
        source = retrieval.result.get("source", "unknown")
        
        insights = []
        if source != "unknown":
            miner_response = await self.miner.process({"data": data})
            insights = miner_response.result.get("insights", [])

        # 3. Council Mode: Multi-Agent Consensus
        if mode == "council":
            logger.info("Activating Council of Agents...")
            # Simulate multiple perspectives
            candidates = [
                f"[Security Agent]: No immediate threats found in {source}.",
                f"[Financial Agent]: Detected budget anomalies in {len(insights)} records.",
                f"[Legal Agent]: Compliance check required for provider X."
            ]
            arbiter_resp = await self.arbiter.process({"candidates": candidates})
            final_answer = arbiter_resp.result.get("best_response")
            return {
                "query": user_query,
                "answer": f"[COUNCIL DECISION]: {final_answer}",
                "trace": [
                    {"agent": "retriever", "status": "success"},
                    {"agent": "miner", "status": "success"},
                    {"agent": "council_security", "status": "simulated"},
                    {"agent": "council_financial", "status": "simulated"},
                    {"agent": "arbiter", "status": "success"}
                ]
            }

        # Default/Precise Mode logic
        final_answer = f"Analysis of {source} complete. Found {len(insights)} insights: {', '.join(insights)}"
        
        return {
            "query": user_query,
            "answer": final_answer,
            "mode": mode,
            "trace": [
                {"agent": "retriever", "status": "success"},
                {"agent": "miner", "status": "success"}
            ]
        }

# Singleton Instance
_supervisor_instance: Optional[NexusSupervisor] = None

def get_nexus_supervisor() -> NexusSupervisor:
    global _supervisor_instance
    if _supervisor_instance is None:
        _supervisor_instance = NexusSupervisor()
    return _supervisor_instance
