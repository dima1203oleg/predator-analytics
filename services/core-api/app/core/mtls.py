"""PREDATOR mTLS Security Logic (v56.5).
HR-15: Zero Trust & Service-to-Service Security.
"""
from enum import Enum
import re
from typing import Optional
from fastapi import Request, HTTPException, status

class ServiceNodes(str, Enum):
    INGESTION_WORKER = "ingestion-worker"
    GRAPH_SERVICE = "graph-service"
    ADMIN_SENTINEL = "admin-sentinel"
    GATEWAY = "api-gateway"

class MTLSSecurity:
    """Обробка даних mTLS з проксі (Nginx/Kong)."""

    @staticmethod
    def get_client_cn(request: Request) -> Optional[str]:
        """Отримати Common Name (CN) з клієнтського сертифіката."""
        verify = request.headers.get("X-Client-Verify")
        if verify != "SUCCESS":
            return None

        dn = request.headers.get("X-Client-DN", "")
        # Приклад DN: CN=ingestion-worker,O=Predator,C=UA
        match = re.search(r"CN=([^,]+)", dn)
        if match:
            return match.group(1)
        return None

    @staticmethod
    def verify_node(request: Request, allowed_nodes: list[ServiceNodes]):
        """Перевірка чи вузол авторизований через mTLS."""
        cn = MTLSSecurity.get_client_cn(request)
        if not cn:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="mTLS verification failed or no certificate provided"
            )
        
        if cn not in [node.value for node in allowed_nodes]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Node '{cn}' is not authorized for this resource"
            )
        
        return cn
