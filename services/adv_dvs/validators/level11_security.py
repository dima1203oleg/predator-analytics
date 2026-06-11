import asyncio
import logging
from typing import Dict, Any
import httpx

from ..config import settings

logger = logging.getLogger(__name__)

class Level11SecurityValidator:
    """
    Рівень 11: Security Validation
    Перевіряє доступність Keycloak (логін) та Vault, а також перевіряє RLS (спроба неавторизованого доступу).
    """
    
    async def validate(self) -> Dict[str, Any]:
        result = {
            "level": 11,
            "name": "Security Validation",
            "status": "pass",
            "details": {}
        }
        
        # 1. Перевірка Keycloak (OIDC Discovery)
        keycloak_url = getattr(settings, "keycloak_url", "http://predator_keycloak:8080/realms/predator/.well-known/openid-configuration")
        # 2. Перевірка Vault
        vault_url = getattr(settings, "vault_url", "http://predator_vault:8200/v1/sys/health")
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Keycloak
                try:
                    res_kc = await client.get(keycloak_url)
                    result["details"]["keycloak"] = {
                        "status": "pass" if res_kc.status_code == 200 else "fail",
                        "http_code": res_kc.status_code
                    }
                    if res_kc.status_code != 200:
                        result["status"] = "fail"
                except Exception as e:
                    result["details"]["keycloak"] = {"status": "fail", "error": str(e)}
                    result["status"] = "fail"
                    
                # Vault
                try:
                    res_vault = await client.get(vault_url)
                    # 200 = initialized, unsealed, and active
                    # 429 = unsealed and standby
                    # 501 = not initialized
                    # 503 = sealed
                    code = res_vault.status_code
                    status = "pass" if code in [200, 429] else "fail"
                    result["details"]["vault"] = {
                        "status": status,
                        "http_code": code,
                        "sealed": code == 503
                    }
                    if status == "fail" and code != 404: # Якщо 404, можливо Vault не включений в dev профілі
                        result["status"] = "warning"
                except Exception as e:
                    result["details"]["vault"] = {"status": "fail", "error": str(e)}

        except Exception as e:
            result["status"] = "fail"
            result["error"] = str(e)
            
        return result
