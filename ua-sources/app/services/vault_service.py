"""
Vault Service - HashiCorp Vault Integration
Secure secrets management
"""
from typing import Optional, Dict, Any
import httpx
import os
import logging

logger = logging.getLogger(__name__)


class VaultService:
    """
    HashiCorp Vault client for secrets management
    """
    
    def __init__(self):
        self.vault_addr = os.getenv("VAULT_ADDR", "http://vault:8200")
        self.vault_token = os.getenv("VAULT_TOKEN")
        self.enabled = bool(self.vault_token)
    
    async def get_secret(
        self,
        path: str,
        key: Optional[str] = None
    ) -> Optional[Any]:
        """
        Get secret from Vault
        
        Args:
            path: Secret path (e.g., "secret/data/llm/openai")
            key: Specific key within the secret
        """
        if not self.enabled:
            logger.warning("Vault not configured, using environment variables")
            return None
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.vault_addr}/v1/{path}",
                    headers={"X-Vault-Token": self.vault_token},
                    timeout=10.0
                )
                response.raise_for_status()
                data = response.json()
                
                secret_data = data.get("data", {}).get("data", {})
                
                if key:
                    return secret_data.get(key)
                return secret_data
                
        except Exception as e:
            logger.error(f"Vault error: {e}")
            return None
    
    async def set_secret(
        self,
        path: str,
        data: Dict[str, Any]
    ) -> bool:
        """Write secret to Vault"""
        if not self.enabled:
            logger.warning("Vault not configured")
            return False
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.vault_addr}/v1/{path}",
                    headers={"X-Vault-Token": self.vault_token},
                    json={"data": data},
                    timeout=10.0
                )
                response.raise_for_status()
                return True
                
        except Exception as e:
            logger.error(f"Vault write error: {e}")
            return False
    
    async def health_check(self) -> Dict[str, Any]:
        """Check Vault health"""
        if not self.enabled:
            return {"status": "disabled", "configured": False}
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.vault_addr}/v1/sys/health",
                    timeout=5.0
                )
                data = response.json()
                return {
                    "status": "healthy" if data.get("initialized") else "unhealthy",
                    "sealed": data.get("sealed", True),
                    "configured": True
                }
        except Exception as e:
            return {"status": "error", "error": str(e), "configured": True}


# Singleton instance
vault_service = VaultService()
