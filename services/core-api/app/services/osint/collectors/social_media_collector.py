from typing import Dict, Any, List
from app.services.osint.collectors.base import BaseOsintCollector
import asyncio

class SocialMediaCollector(BaseOsintCollector):
    """
    Колектор соціальних мереж та зв'язків.
    Шукає профілі особи (LinkedIn, Telegram, Facebook).
    Аналізує публічні пости та список друзів.
    Симулює використання OSINT Frameworks (Sherlock, Maltego).
    """

    def __init__(self):
        super().__init__(source_name="SocialMedia_OSINT")

    async def collect(self, query: str, **kwargs) -> Dict[str, Any]:
        """Симуляція пошуку в соцмережах"""
        await asyncio.sleep(0.6)
        
        if "іванов" in query.lower() or "ivanov" in query.lower():
            return {
                "search_query": query,
                "profiles": [
                    {
                        "platform": "LinkedIn",
                        "username": "ivanov_boss",
                        "url": "https://linkedin.com/in/ivanov_boss",
                        "job_title": "CEO at ТОВ ОФШОР",
                        "connections_count": 500,
                        "risk_flags": []
                    },
                    {
                        "platform": "Telegram",
                        "username": "ivan_dark",
                        "url": "https://t.me/ivan_dark",
                        "phone": "+380501234567",
                        "risk_flags": ["member_of_high_risk_groups"]
                    }
                ]
            }
            
        return {"search_query": query, "profiles": []}

    def normalize(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        nodes = []
        edges = []
        dossier_updates = {"digital_footprint": {"social_media": []}}
        
        profiles = raw_data.get("profiles", [])
        
        for profile in profiles:
            platform = profile.get("platform")
            username = profile.get("username")
            
            node_id = f"social_{platform.lower()}_{username}"
            
            nodes.append({
                "node_id": node_id,
                "labels": ["SocialProfile"],
                "properties": {
                    "platform": platform,
                    "username": username,
                    "url": profile.get("url"),
                    "risk_flags": profile.get("risk_flags", [])
                }
            })
            
            edges.append({
                "target": node_id,
                "type": "HAS_PROFILE",
                "properties": {
                    "source": self.source_name
                }
            })
            
            dossier_updates["digital_footprint"]["social_media"].append({
                "platform": platform,
                "username": username,
                "url": profile.get("url")
            })
            
        return {
            "nodes": nodes,
            "edges": edges,
            "dossier_updates": dossier_updates
        }
