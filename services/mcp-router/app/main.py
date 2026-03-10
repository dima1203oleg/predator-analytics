"""Module: router
Component: mcp-router
Predator Analytics v45.1.
"""

import logging
import time

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from services.shared.logging_config import setup_logging

from .cache import LLMCache
from .providers.gemini import GeminiProvider
from .providers.groq import GroqProvider
from .providers.ollama import OllamaProvider


# Initialize Logging
setup_logging("mcp-router")
logger = logging.getLogger(__name__)

app = FastAPI(title="Predator MCP Router", version="25.1")

# Providers Registry
providers = {"ollama": OllamaProvider(), "groq": GroqProvider(), "gemini": GeminiProvider()}

# Cache Instance
llm_cache = LLMCache()

# Configuration from Spec (Part 3.2.1)
# Format: "provider/model"
ROUTING_RULES = {
    "code_generation": [
        "ollama/codellama:7b",
        "ollama/deepseek-coder-v2:16b",
        "ollama/qwen2.5-coder:7b",
    ],
    "code_review": [
        "ollama/deepseek-coder-v2:16b",
        "ollama/qwen2.5-coder:7b",
        "ollama/codellama:7b",
    ],
    "analysis": ["ollama/llama3.1:8b", "groq/llama-3.1-70b-versatile"],
    "summarization": ["ollama/llama3.1:8b", "gemini/gemini-2.0-flash"],
    "reasoning": ["groq/llama-3.1-70b-versatile", "gemini/gemini-2.0-flash"],
    "creative": ["gemini/gemini-2.0-flash", "gemini/gemini-1.5-flash"],
}


class LLMRequest(BaseModel):
    prompt: str
    task_type: str = "analysis"
    context: dict | None = None
    trace_id_override: str | None = None
    use_cache: bool = True


@app.post("/v1/query")
async def query_llm(request: LLMRequest):
    """Main entrypoint for LLM queries.
    Implements: Caching -> Routing -> Fallback.
    Section 3.2.1 of Spec.
    """
    trace_id = request.trace_id_override or f"tr-{int(time.time())}"

    # 1. Selection logic
    candidates = ROUTING_RULES.get(request.task_type, ROUTING_RULES["analysis"])

    # Use first candidate for cache key indexing (major model)
    primary_candidate = candidates[0]
    p_name, p_model = primary_candidate.split("/")

    # 2. Cache Check
    if request.use_cache:
        cached = await llm_cache.get_cached(request.prompt, request.context, p_model)
        if cached:
            return {**cached, "cache_hit": True, "trace_id": trace_id}

    last_error = None
    fallback_used = False

    # 3. Fallback Loop
    for i, candidate in enumerate(candidates):
        try:
            p_name, p_model = candidate.split("/")
            provider = providers.get(p_name)

            if not provider:
                continue

            if i > 0:
                fallback_used = True
                logger.info(
                    "Triggering fallback",
                    extra={"from": candidates[i - 1], "to": candidate, "trace_id": trace_id},
                )

            start_time = time.time()
            response = await provider.generate_response(
                prompt=request.prompt, model=p_model, context=request.context
            )
            latency = (time.time() - start_time) * 1000

            # Enrich response
            result = {
                **response,
                "latency_ms": response.get("latency_ms") or latency,
                "trace_id": trace_id,
                "fallback_used": fallback_used,
                "cache_hit": False,
            }

            # 4. Success -> Cache & Return
            if request.use_cache:
                await llm_cache.set_cached(request.prompt, request.context, p_model, result)

            logger.info(
                "LLM query successful",
                extra={
                    "provider": p_name,
                    "model": p_model,
                    "latency_ms": result["latency_ms"],
                    "trace_id": trace_id,
                },
            )

            return result

        except Exception as e:
            logger.warning(
                f"Provider {candidate} failed", extra={"error": str(e), "trace_id": trace_id}
            )
            last_error = e
            continue

    # 4. All providers failed
    logger.error("All LLM providers failed", extra={"trace_id": trace_id, "error": str(last_error)})
    raise HTTPException(status_code=503, detail="All LLM providers failed")


@app.on_event("shutdown")
async def shutdown_event():
    await llm_cache.close()


@app.get("/health")
async def health_check():
    provider_status = {}
    for name, p in providers.items():
        provider_status[name] = await p.health_check()

    return {
        "status": "healthy" if any(provider_status.values()) else "unhealthy",
        "providers": provider_status,
    }
