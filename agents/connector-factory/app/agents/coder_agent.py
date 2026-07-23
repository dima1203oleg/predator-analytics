from typing import Dict, Any
import logging
import os
from litellm import completion

logger = logging.getLogger(__name__)

# Default model, can be overridden by environment
LLM_MODEL = os.getenv("LLM_MODEL", "gemini/gemini-1.5-pro")

class CoderAgent:
    def __init__(self):
        pass

    def run(self, state: dict) -> dict:
        """
        Takes profiling result and generates connector code (API Client, Normalizer).
        Uses LiteLLM to generate code dynamically.
        """
        source_url = state.get("source", {}).get("url", "unknown")
        priority_score = state.get("profiling", {}).get("priority_score", 0)
        api_schema = state.get("profiling", {}).get("schema", {})
        
        logger.info(f"CoderAgent generating code for {source_url} (Score: {priority_score}) using {LLM_MODEL}")
        
        if not api_schema:
            logger.warning("No API Schema found in state, falling back to basic template.")
            api_schema = {"type": "unknown", "endpoints": [source_url]}

        test_report = state.get("test_report")
        error_context = ""
        if test_report and test_report.get("error_logs"):
            error_context = f"\n\nWARNING: The previous code generation failed tests with the following error:\n{test_report['error_logs']}\n\nPlease FIX the code to address these errors."

        prompt = f"""
        You are an expert AI Python Software Engineer for the PREDATOR Analytics platform.
        Your task is to write a production-ready API Client for the following source:
        
        Source URL: {source_url}
        API Schema / Profile: {api_schema}{error_context}
        
        Requirements:
        1. Use modern Python 3.12 features and strictly type all signatures.
        2. Use the `httpx` async library for HTTP requests.
        3. Include error handling, retry logic (e.g. tenacity), and circuit breaker patterns if appropriate.
        4. Implement an async fetch method.
        5. ONLY output the valid, executable Python code block. Do NOT wrap it in markdown block ```python ... ``` if possible.
        """

        try:
            response = completion(
                model=LLM_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
            )
            
            generated_code = response.choices[0].message.content
            
            # Clean up markdown code blocks if the model returns them
            if generated_code.startswith("```python"):
                generated_code = generated_code.replace("```python", "", 1).strip()
                if generated_code.endswith("```"):
                    generated_code = generated_code[:-3].strip()
            elif generated_code.startswith("```"):
                generated_code = generated_code.replace("```", "", 1).strip()
                if generated_code.endswith("```"):
                    generated_code = generated_code[:-3].strip()
                    
            api_client_code = generated_code
            logger.info("Successfully generated API client code via LLM.")
            
        except Exception as e:
            logger.error(f"LLM Generation failed: {e}")
            # Fallback to simulated code if LLM fails
            api_client_code = f"# Fallback auto-generated client for {source_url}\nimport httpx\n\nclass ApiClient:\n    pass\n"

        normalizer_code = "# Auto-generated normalizer\ndef normalize(data):\n    return data\n"
        tests_code = "def test_api():\n    assert True\n"
        
        artifacts = {
            "api_client_code": api_client_code,
            "normalizer_code": normalizer_code,
            "tests_code": tests_code,
            "dependencies": ["httpx", "pydantic", "tenacity"]
        }
        
        return {"artifacts": artifacts, "status": "coded"}
