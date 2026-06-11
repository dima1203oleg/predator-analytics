import asyncio
import logging
from typing import Dict, Any
import httpx

from ..config import settings

logger = logging.getLogger(__name__)

class Level10ObservabilityValidator:
    """
    Рівень 10: Observability Validation
    Перевіряє доступність Prometheus, Grafana, Loki, AlertManager.
    """
    
    async def validate(self) -> Dict[str, Any]:
        result = {
            "level": 10,
            "name": "Observability Validation",
            "status": "pass",
            "details": {}
        }
        
        endpoints = {
            "prometheus": getattr(settings, "prometheus_url", "http://predator_prometheus:9090/-/healthy"),
            "grafana": getattr(settings, "grafana_url", "http://predator_grafana:3000/api/health"),
            "loki": getattr(settings, "loki_url", "http://predator_loki:3100/ready"),
            "alertmanager": getattr(settings, "alertmanager_url", "http://predator_alertmanager:9093/-/healthy")
        }
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                for name, url in endpoints.items():
                    try:
                        res = await client.get(url)
                        status = "pass" if res.status_code == 200 else "fail"
                        result["details"][name] = {
                            "status": status,
                            "http_code": res.status_code
                        }
                        if status == "fail":
                            result["status"] = "fail"
                    except Exception as e:
                        result["details"][name] = {
                            "status": "fail",
                            "error": str(e)
                        }
                        result["status"] = "fail"
        except Exception as e:
            result["status"] = "fail"
            result["error"] = str(e)
            
        return result
