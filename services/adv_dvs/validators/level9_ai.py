import asyncio
import logging
from typing import Dict, Any
import httpx
import time

from ..config import settings

logger = logging.getLogger(__name__)

class Level9AiValidator:
    """
    Рівень 9: AI Validation
    Перевіряє доступність моделей Ollama та виконує контрольні запити.
    """
    
    async def validate(self) -> Dict[str, Any]:
        result = {
            "level": 9,
            "name": "AI Validation",
            "status": "pass",
            "details": {}
        }
        
        ollama_url = getattr(settings, "ollama_url", "http://predator_ollama:11434")
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # 1. Перевірка доступних моделей
                res = await client.get(f"{ollama_url}/api/tags")
                if res.status_code == 200:
                    models = [m["name"] for m in res.json().get("models", [])]
                    result["details"]["models_available"] = models
                    if not models:
                        result["status"] = "warning"
                        result["details"]["models_warning"] = "No models found in Ollama"
                else:
                    result["status"] = "fail"
                    result["details"]["ollama_api"] = f"HTTP {res.status_code}"
                    return result
                
                # 2. Контрольний запит (якщо є моделі)
                if models:
                    model_to_test = models[0] # Беремо першу доступну
                    
                    start_time = time.time()
                    payload = {
                        "model": model_to_test,
                        "prompt": "Напиши слово ТЕСТ",
                        "stream": False
                    }
                    chat_res = await client.post(f"{ollama_url}/api/generate", json=payload, timeout=60.0)
                    duration = time.time() - start_time
                    
                    if chat_res.status_code == 200:
                        response_text = chat_res.json().get("response", "")
                        result["details"]["control_query"] = {
                            "status": "pass",
                            "model_used": model_to_test,
                            "response": response_text.strip(),
                            "duration_sec": round(duration, 2),
                            "contains_test": "ТЕСТ" in response_text.upper()
                        }
                    else:
                        result["details"]["control_query"] = {
                            "status": "fail",
                            "error": f"HTTP {chat_res.status_code}"
                        }
                        result["status"] = "fail"
                        
        except Exception as e:
            result["status"] = "fail"
            result["error"] = str(e)
            
        return result
