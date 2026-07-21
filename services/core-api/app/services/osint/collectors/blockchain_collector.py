from typing import Dict, Any, List
from app.services.osint.collectors.base import BaseOsintCollector
import asyncio

class BlockchainCollector(BaseOsintCollector):
    """
    Колектор блокчейн-даних.
    Шукає прив'язані криптогаманці до особи (через витоки або вказані адреси).
    Аналізує транзакції на підозрілу активність (міксери, даркнет-маркети).
    Симулює Chainalysis / TRM Labs API.
    """

    def __init__(self):
        super().__init__(source_name="Blockchain_Analytics")

    async def collect(self, query: str, **kwargs) -> Dict[str, Any]:
        """Симуляція запиту до блокчейн-аналітики"""
        await asyncio.sleep(0.8)
        
        # Симулюємо знахідку гаманця для певних ключових слів
        if "crypto" in query.lower() or "іванов" in query.lower() or "dark" in query.lower():
            return {
                "search_query": query,
                "wallets": [
                    {
                        "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
                        "currency": "BTC",
                        "total_received": 14.5,
                        "total_sent": 14.2,
                        "risk_score": 95,
                        "clusters": ["Hydra Market", "HighRisk Exchange"]
                    },
                    {
                        "address": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
                        "currency": "ETH",
                        "total_received": 150.0,
                        "total_sent": 0.0,
                        "risk_score": 10,
                        "clusters": ["Binance Hot Wallet"]
                    }
                ]
            }
            
        return {"search_query": query, "wallets": []}

    def normalize(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        nodes = []
        edges = []
        dossier_updates = {"digital_footprint": {"crypto_wallets": []}}
        
        wallets = raw_data.get("wallets", [])
        
        for wallet in wallets:
            address = wallet.get("address")
            currency = wallet.get("currency")
            risk = wallet.get("risk_score")
            
            node_id = f"wallet_{address[:8]}"
            
            labels = ["CryptoWallet"]
            if risk > 70:
                labels.append("HighRisk")
                
            nodes.append({
                "node_id": node_id,
                "labels": labels,
                "properties": {
                    "address": address,
                    "currency": currency,
                    "total_received": wallet.get("total_received"),
                    "risk_score": risk,
                    "clusters": wallet.get("clusters", [])
                }
            })
            
            edges.append({
                "target": node_id,
                "type": "OWNS_WALLET",
                "properties": {
                    "source": self.source_name,
                    "verified": False
                }
            })
            
            dossier_updates["digital_footprint"]["crypto_wallets"].append({
                "address": address,
                "currency": currency,
                "risk_score": risk,
                "clusters": wallet.get("clusters")
            })
            
        return {
            "nodes": nodes,
            "edges": edges,
            "dossier_updates": dossier_updates
        }
