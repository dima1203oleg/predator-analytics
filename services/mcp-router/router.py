
"""
Module: router
Component: mcp-router
Predator Analytics v25.1
"""
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, List
import logging
import asyncio
from services.shared.logging_config import setup_logging
from .providers.ollama import OllamaProvider

# Initialize Logging
setup_logging("mcp-router")
logger = logging.getLogger(__name__)

app = FastAPI(title="Predator MCP Router", version="25.1")

# Providers Registry
providers = {
    "ollama": OllamaProvider()
    # "groq" will be added later
    # "gemini" will be added later
}

# Configuration from Spec (Part 3.2.1)
ROUTING_RULES = {
    "code_generation": ["ollama/codellama:7b", "ollama/deepseek-coder-v2:16b"],
    "analysis":        ["ollama/llama3.1:8b"],
    "reasoning":       ["ollama/llama3.1:8b"]
}

class LLMRequest(BaseModel):
    prompt: str
    task_type: str = "analysis"  # code_generation, analysis, reasoning
    context: Optional[Dict] = None
    trace_id: str

@app.post("/v1/query")
async def query_llm(request: LLMRequest):
    """
    Main entrypoint for LLM queries.
    Handles routing and fallback.
    """
    # 1. Select Model Candidates based on Task Type
    candidates = ROUTING_RULES.get(request.task_type, ROUTING_RULES["analysis"])
    
    last_error = None
    
    # 2. Iterate through candidates (Fallback Logic)
    for candidate in candidates:
        provider_name, model_name = candidate.split("/")
        
        provider = providers.get(provider_name)
        if not provider:
            continue

        try:
            logger.info(f"Attempting query", extra={
                 "provider": provider_name, 
                 "model": model_name,
                 "trace_id": request.trace_id
            })

            response = await provider.generate_response(
                prompt=request.prompt,
                model=model_name,
                context=request.context
            )
            
            # Success! Return immediately
            logger.info("Query successful", extra={
                "provider": provider_name,
                "latency": response.get("latency_ms"),
                "trace_id": request.trace_id
            })
            return response

        except Exception as e:
            logger.warning(f"Provider failed, falling back", extra={
                "provider": provider_name,
                "error": str(e),
                "trace_id": request.trace_id
            })
            last_error = e
            continue
            
    # 3. If all fail
    raise HTTPException(status_code=503, detail=f"All LLM providers failed. Last error: {str(last_error)}")

@app.get("/health")
async def health_check():
    checks = {}
    for name, p in providers.items():
        checks[name] = await p.health_check()
        
    status = "healthy" if any(checks.values()) else "unhealthy"
    return {"status": status, "providers": checks}
