import logging
import httpx
from typing import Dict, Any
try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None  # type: ignore
import json
from app.services.ai_service import AIService

logger = logging.getLogger(__name__)

class DiscoveryEngine:
    """
    Етап 1 & 2: Discovery Layer + API Intelligence
    """
    async def analyze_source(self, url: str) -> Dict[str, Any]:
        """
        Аналізує URL та визначає тип джерела і його можливості.
        """
        logger.info(f"Discovery: Аналіз джерела {url}")
        
        # Симуляція визначення профілю
        profile = {
            "url": url,
            "type": "unknown",
            "auth_type": "none",
            "pagination": "unknown",
            "endpoints": []
        }
        
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(url)
                
            content_type = response.headers.get("content-type", "").lower()
            
            if "application/json" in content_type or "application/openapi+json" in content_type:
                # Спроба розпізнати OpenAPI
                try:
                    data = response.json()
                    if "openapi" in data or "swagger" in data:
                        profile["type"] = "openapi"
                        profile["endpoints"] = list(data.get("paths", {}).keys())
                        logger.info("Discovery: Знайдено OpenAPI/Swagger")
                    else:
                        profile["type"] = "rest_json"
                except json.JSONDecodeError:
                    pass
            elif "text/html" in content_type:
                # Перевірка на CKAN або HTML з посиланнями на API
                soup = BeautifulSoup(response.text, 'html.parser')
                if soup.find('a', href=lambda h: h and 'swagger' in h.lower()):
                    profile["type"] = "swagger_ui"
                elif soup.find(text=lambda t: t and 'ckan' in t.lower()):
                    profile["type"] = "ckan"
                else:
                    profile["type"] = "html_scraper"
            elif "text/csv" in content_type:
                profile["type"] = "csv_dump"
            
            # AI Integration for deeper analysis
            ai_prompt = f"""
            Analyze the following API response or HTML preview from URL: {url}
            Determine the likely pagination method and authentication type required.
            Response format must be ONLY JSON with keys: "auth_type", "pagination", "endpoints" (list of strings).
            
            Content Preview (first 2000 chars):
            {response.text[:2000]}
            """
            
            try:
                ai_analysis = await AIService.get_reasoning(prompt=ai_prompt, context={"role": "Data Engineer"})
                # Parse AI response (assuming it might be wrapped in ```json)
                cleaned = ai_analysis.replace("```json", "").replace("```", "").strip()
                ai_data = json.loads(cleaned)
                profile["auth_type"] = ai_data.get("auth_type", profile["auth_type"])
                profile["pagination"] = ai_data.get("pagination", profile["pagination"])
                if ai_data.get("endpoints") and not profile.get("endpoints"):
                    profile["endpoints"] = ai_data.get("endpoints")
                logger.info(f"Discovery AI Analysis completed: {profile['auth_type']}, {profile['pagination']}")
            except Exception as e:
                logger.error(f"Discovery AI analysis failed: {e}")
            
        except Exception as e:
            logger.error(f"Discovery: Помилка аналізу {url}: {e}")
            profile["error"] = str(e)
            
        return profile
