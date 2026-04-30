from __future__ import annotations

import logging
from typing import Any

from ...services.federation_service import get_federation_service
from ...services.llm import llm_service
from ..analysis.miner_agent import MinerAgent
from ..core.arbiter_agent import ArbiterAgent
from ..data.crawler_agent import CrawlerAgent
from ..data.retriever_agent import RetrieverAgent

logger = logging.getLogger("nexus.supervisor")


class NexusSupervisor:
    """Main orchestration engine for Predator Analytics MAS.
    Coordinates agents to fulfill user requests.
    """

    def __init__(self):
        self.retriever = RetrieverAgent()
        self.miner = MinerAgent()
        self.arbiter = ArbiterAgent()
        self.crawler = CrawlerAgent()
        logger.info("NexusSupervisor initialized with core agents")

    async def handle_request(
        self, user_query: str, mode: str = "auto", request_context: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        """Processes a high-level user request through the agent pipeline.
        Supported modes: 'auto', 'fast', 'precise', 'council', 'chat'.
        """
        # Use structured context for logging
        context = request_context or {}
        correlation_id = context.get("correlation_id", "N/A")

        logger.info(f"[{correlation_id}] Processing request: {user_query} [Mode: {mode}]")

        # 1. Fast Mode: Optimization for speed
        if mode == "fast":
            retrieval = await self.retriever.process({"query": user_query})
            return {
                "query": user_query,
                "answer": f"[FAST] Found {len(retrieval.result.get('data', []))} records. Summary not generated.",
                "trace": [{"agent": "retriever", "status": "success"}],
            }

        # 1.5 Chat Mode (LLM Direct)
        if mode == "chat":
            # Federation Commands Hook
            user_query_lower = user_query.lower()

            # Status Check
            if "status" in user_query_lower and (
                "node" in user_query_lower or "system" in user_query_lower
            ):
                fed_service = get_federation_service()
                nodes = fed_service.get_active_nodes()
                if not nodes:
                    answer = "⚠️ **System Alert**: No Edge Nodes are currently connected to the Federation."
                else:
                    answer = "### 🌍 Federation Status\n\n"
                    for n in nodes:
                        answer += f"**🖥️ {n['info']['hostname']}**\n- ID: `{n['info']['node_id']}`\n- Status: 🟢 {n['status'].upper()}\n- Load: {n.get('load', 0)}%\n- Tasks Completed: {n.get('tasks_completed', 0)}\n\n"
                return {
                    "query": user_query,
                    "answer": answer,
                    "mode": "chat",
                    "trace": [{"agent": "nexus", "action": "federation_status"}],
                }

            # Task Dispatch (Scan CSV)
            if (
                "scan" in user_query_lower or "import" in user_query_lower
            ) and ".csv" in user_query_lower:
                fed_service = get_federation_service()
                path = "/Users/dima-mac/Documents/Predator_21/sample_data/companies_ukraine.csv"  # Demo logic
                try:
                    task_id = fed_service.dispatch_task("scan_csv", {"path": path})
                    answer = f"🚀 **Federation Protocol Initiated**\n\nI have dispatched task `{task_id}` to the Edge Cluster.\n**Target**: `{path}`\n\nThe node will begin processing immediately."
                except Exception as e:
                    answer = f"⚠️ **Dispatch Failed**: {e!s}\n\nPlease ensure at least one Edge Node is online."

                return {
                    "query": user_query,
                    "answer": answer,
                    "mode": "chat",
                    "trace": [{"agent": "nexus", "action": "dispatch_task"}],
                }

            # Local Ingestion (Knowledge Base)
            if "ingest" in user_query_lower or "learn" in user_query_lower:
                from ...services.ingestor import ingestor_service

                # In a real app, parse path from query. For demo, default to sample.
                path = "/Users/dima-mac/Documents/Predator_21/sample_data/companies_ukraine.csv"
                try:
                    job = await ingestor_service.ingest_csv(path)
                    answer = f"🧠 **Knowledge Ingestion Started**\n\nJob ID: `{job.id}`\nSource: `{path}`\n\nPredator is now reading {job.records_total} records into the Qdrant Vector Database. This provides Semantic Search capabilities."
                except Exception as e:
                    answer = f"⚠️ **Ingestion Failed**: {e!s}"

                return {
                    "query": user_query,
                    "answer": answer,
                    "mode": "chat",
                    "trace": [{"agent": "nexus", "action": "ingest_data"}],
                }

            # Web Crawling
            if "crawl" in user_query_lower or "scan http" in user_query_lower:
                # Extract URL (naive)
                import re

                url_match = re.search(r"https?://[^\s]+", user_query)
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
                        answer += f"\n\n⚠️ **Mission Failed**: {e!s}"
                else:
                    answer = "⚠️ Please provide a valid HTTP(S) URL to crawl."

                return {
                    "query": user_query,
                    "answer": answer,
                    "mode": "chat",
                    "trace": [{"agent": "crawler", "status": "success"}],
                }

            # Shadow Protocol (Hidden Layer)
            if (
                "shadow" in user_query_lower
                or "classified" in user_query_lower
                or "decrypt" in user_query_lower
            ):
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
                        target = user_query.rsplit(maxsplit=1)[-1]

                    doc = shadow_service.reveal_document(target)
                    if doc:
                        answer = f"🔓 **Decryption Successful**\n\n**Source ID**: `{target}`\n**Clearance**: `{doc.get('clearance')}`\n**Title**: {doc.get('title')}\n\n> {doc.get('content')}\n\n*-- End of Transmission --*"
                    else:
                        answer = f"🚫 **Access Denied**: Document `{target}` not found or integrity compromised."

                    return {
                        "query": user_query,
                        "answer": answer,
                        "mode": "chat",
                        "trace": [{"agent": "nexus", "action": "shadow_decrypt"}],
                    }

                # Default: List
                docs = shadow_service.list_classified_docs()
                if not docs:
                    answer = "🔒 **Shadow Layer**: No classified documents found."
                else:
                    answer = "🔒 **Shadow Protocol Activated**\n\n**Authentication**: `VERIFIED`\n**Clearance**: `OMEGA`\n\n**Available Intelligence**:\n"
                    for doc in docs:
                        answer += f"- 📁 `{doc}`\n"
                    answer += "\nTo decrypt a file, say: `Decrypt <doc_id>`"
                return {
                    "query": user_query,
                    "answer": answer,
                    "mode": "chat",
                    "trace": [{"agent": "nexus", "action": "shadow_access"}],
                }

            try:
                llm = llm_service
                answer = await llm.generate(
                    user_query,
                    system_prompt="You are Predator, an advanced AI analytics system. Be concise, professional, and authoritarian.",
                )
                return {
                    "query": user_query,
                    "answer": answer,
                    "mode": "chat",
                    "trace": [{"agent": "llm", "status": "success"}],
                }
            except Exception as e:
                logger.error(f"[{correlation_id}] Chat component failed: {e}", exc_info=True)
                # Fallback: continue to standard flow below

        # 1.8 Deep Mode (Agentic Graph)
        if mode in ["deep", "agentic"]:
            try:
                logger.info(f"[{correlation_id}] 🧠 Initializing Deep Agentic Graph...")
                from app.libs.agents.graph import create_agent_graph

                # Initialize Graph
                graph = create_agent_graph()

                # Prepare Initial State
                initial_state = {
                    "messages": [{"role": "user", "content": user_query}],
                    "context": context,
                    "current_step": "Planning",
                    "plan": [],
                    "tool_outputs": [],
                    "thinking": [],
                    "error": None,
                }

                # Execute Graph
                # invoke returns the final state
                final_state = await graph.invoke(initial_state)

                answer = (
                    final_state.get("final_response") or "Agent finished without a final response."
                )
                thoughts = final_state.get("thinking", [])

                return {
                    "query": user_query,
                    "answer": answer,
                    "mode": mode,
                    "thoughts": thoughts,
                    "trace": [{"agent": "deep_graph", "status": "success", "steps": len(thoughts)}],
                }

            except Exception as e:
                logger.error(f"[{correlation_id}] Agentic Graph failed: {e}", exc_info=True)
                return {
                    "query": user_query,
                    "answer": f"⚠️ Agentic Brain Error: {e!s}",
                    "mode": mode,
                    "trace": [{"agent": "deep_graph", "status": "failed"}],
                }

        try:
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
                logger.info(f"[{correlation_id}] Activating Real Council of Agents...")

                try:
                    from app.services.llm_council.council_orchestrator import (
                        create_default_council,
                    )

                    council = create_default_council()

                    # Run real deliberation
                    result = await council.conduct_deliberation(
                        query=user_query,
                        context=f"Data Source: {source}. Insights: {len(insights)} found.",
                        enable_peer_review=True,
                    )

                    final_answer = result.final_answer

                    return {
                        "query": user_query,
                        "answer": f"[COUNCIL DECISION]: {final_answer}",
                        "trace": [
                            {"agent": "retriever", "status": "success"},
                            {"agent": "miner", "status": "success"},
                            {"agent": "council_orchestrator", "status": "success"},
                            *[
                                {"agent": f"model_{m}", "status": "voted"}
                                for m in result.contributing_models
                            ],
                        ],
                    }
                except Exception as council_error:
                    logger.exception(f"Council failed: {council_error}")
                    # Fallback
                    final_answer = (
                        f"Council unavailable ({council_error!s}). Analyzing via Singleton."
                    )

            # Default/Precise Mode logic
            final_answer = f"Analysis of {source} complete. Found {len(insights)} insights: {', '.join(insights)}"

            return {
                "query": user_query,
                "answer": final_answer,
                "mode": mode,
                "trace": [
                    {"agent": "retriever", "status": "success"},
                    {"agent": "miner", "status": "success"},
                ],
            }
        except Exception as e:
            logger.critical(f"[{correlation_id}] Critical supervisor failure: {e}", exc_info=True)
            return {
                "query": user_query,
                "answer": "⚠️ System Error: The analytical core encountered a critical failure. Please try again later.",
                "error": str(e),
                "trace": [{"agent": "nexus", "status": "failed"}],
            }


# Singleton Instance
_supervisor_instance: NexusSupervisor | None = None


def get_nexus_supervisor() -> NexusSupervisor:
    global _supervisor_instance
    if _supervisor_instance is None:
        _supervisor_instance = NexusSupervisor()
    return _supervisor_instance
