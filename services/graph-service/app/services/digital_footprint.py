"""
Digital Footprint Service — PREDATOR Analytics v55.1 Ironclad.

Tracks digital presence matching (emails, crypto wallets, domains) across 
business entities and Telegram monitors.
"""
from typing import List, Dict, Any
from app.graph_db import graph_db

class DigitalFootprintService:
    @staticmethod
    async def track_crypto(wallet_address: str, tenant_id: str) -> List[Dict[str, Any]]:
        """Знайти всі операції та компанії пов'язані з гаманцем."""
        query = """
        MATCH (w:CryptoWallet {address: $address})
        MATCH (w)-[r:TRANSACTED_WITH|OWNED_BY]-(meta)
        RETURN labels(meta)[0] as entity_type, meta.name as target_name, type(r) as interaction
        """
        return await graph_db.run_query(query, {"address": wallet_address})

    @staticmethod
    async def match_domain_to_entities(domain: str, tenant_id: str) -> List[Dict[str, Any]]:
        """Знайти всі компанії та людей, що використовують певний домен в пошті/сайтах."""
        query = """
        MATCH (e:Email) WHERE e.address ENDS WITH $domain
        MATCH (e)<-[:USES_EMAIL]-(entity)
        RETURN entity.name as entity_name, labels(entity)[0] as type, e.address as exact_email
        """
        return await graph_db.run_query(query, {"domain": "@" + domain.lstrip("@")})
