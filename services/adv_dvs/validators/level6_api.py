import asyncio
import logging
from typing import Dict, Any
import httpx

from ..config import settings

logger = logging.getLogger(__name__)

class Level6ApiValidator:
    """
    Рівень 6: API Validation
    Динамічно завантажує OpenAPI специфікацію та перевіряє базові ендпоінти.
    """
    
    async def validate(self) -> Dict[str, Any]:
        result = {
            "level": 6,
            "name": "API Validation",
            "status": "pass",
            "details": {}
        }
        
        base_url = getattr(settings, "api_base_url", "http://predator_backend:8000/api/v1")
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # 1. Завантаження OpenAPI
                openapi_url = f"http://predator_backend:8000/openapi.json"
                try:
                    res = await client.get(openapi_url)
                    if res.status_code == 200:
                        openapi_spec = res.json()
                        result["details"]["openapi"] = {
                            "status": "pass",
                            "paths_count": len(openapi_spec.get("paths", {}))
                        }
                    else:
                        result["details"]["openapi"] = {"status": "fail", "error": f"HTTP {res.status_code}"}
                        result["status"] = "fail"
                except Exception as e:
                    result["details"]["openapi"] = {"status": "fail", "error": str(e)}
                    result["status"] = "fail"
                    
                # 2. Перевірка базового health-ендпоінту (якщо є)
                health_url = f"{base_url}/health"
                try:
                    res = await client.get(health_url)
                    result["details"]["health_endpoint"] = {
                        "status": "pass" if res.status_code == 200 else "fail",
                        "status_code": res.status_code
                    }
                    if res.status_code != 200 and res.status_code != 404: # Якщо 404 - ендпоінт просто відсутній
                        result["status"] = "fail"
                except Exception as e:
                    result["details"]["health_endpoint"] = {"status": "fail", "error": str(e)}

        except Exception as e:
            result["status"] = "fail"
            result["error"] = str(e)
            
        return result
