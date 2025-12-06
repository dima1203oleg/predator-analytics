"""
AI Engine Service - Core AI analysis capabilities
Combines LLM with Ukrainian data sources for intelligent analysis
"""
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime, timezone
import logging

from .llm import llm_service, LLMResponse
from ..connectors.prozorro import prozorro_connector
from ..connectors.registry import registry_connector
from ..connectors.nbu_fx import nbu_fx_connector

logger = logging.getLogger(__name__)


@dataclass
class AnalysisResult:
    query: str
    answer: str
    sources: List[Dict[str, Any]]
    confidence: float
    processing_time_ms: float
    model_used: str
    timestamp: datetime


from ..core.prompts import get_prompt

class AIEngine:
    """
    Core AI Engine for Predator Analytics
    Combines LLM capabilities with real Ukrainian data sources
    """
    
    def __init__(self):
        self.system_prompt = get_prompt("analyst")
    
    async def analyze(
        self,
        query: str,
        sectors: List[str] = None,
        depth: str = "standard",
        llm_mode: str = "auto",
        preferred_provider: Optional[str] = None
    ) -> AnalysisResult:
        """
        Perform comprehensive analysis
        
        Args:
            query: User query (company name, EDRPOU, or question)
            sectors: Sectors to search (GOV, BIZ, etc.)
            depth: Analysis depth (quick, standard, deep)
        """
        import time
        start_time = time.time()
        
        sectors = sectors or ["GOV", "BIZ"]
        sources = []
        context_parts = []
        
        # 1. Gather data from Ukrainian sources
        try:
            # Search EDR
            edr_result = await registry_connector.search(query, limit=5)
            if edr_result.success and edr_result.data:
                sources.append({
                    "name": "EDR (Business Registry)",
                    "type": "registry",
                    "count": len(edr_result.data),
                    "data": edr_result.data[:3]
                })
                context_parts.append(f"EDR Results: {edr_result.data[:3]}")
            
            # Search Prozorro
            prozorro_result = await prozorro_connector.search(query, limit=5)
            if prozorro_result.success and prozorro_result.data:
                sources.append({
                    "name": "Prozorro (Tenders)",
                    "type": "procurement",
                    "count": len(prozorro_result.data),
                    "data": prozorro_result.data[:3]
                })
                context_parts.append(f"Prozorro Results: {prozorro_result.data[:3]}")
            
            # Get current USD rate for context
            usd_rate = await nbu_fx_connector.get_usd_rate()
            if usd_rate:
                context_parts.append(f"Current USD/UAH rate: {usd_rate}")
                
        except Exception as e:
            logger.error(f"Data gathering error: {e}")
        
        # 2. Generate LLM analysis
        context = "\n\n".join(context_parts) if context_parts else "No data found in Ukrainian registries."
        
        prompt = f"""
        Запит користувача: {query}
        
        Знайдені дані:
        {context}
        
        Проаналізуй ці дані та надай структуровану відповідь.
        """
        
        llm_response = await llm_service.generate_with_routing(
            prompt=prompt,
            system=self.system_prompt,
            mode=llm_mode,
            preferred_provider=preferred_provider
        )
        
        processing_time = (time.time() - start_time) * 1000
        
        return AnalysisResult(
            query=query,
            answer=llm_response.content if llm_response.success else "Аналіз не вдалося виконати",
            sources=sources,
            confidence=0.85 if llm_response.success else 0.0,
            processing_time_ms=processing_time,
            model_used=llm_response.model,
            timestamp=datetime.now(timezone.utc)
        )
    
    async def quick_check(self, edrpou: str) -> Dict[str, Any]:
        """Quick company check by EDRPOU"""
        company = await registry_connector.get_company_by_edrpou(edrpou)
        
        return {
            "edrpou": edrpou,
            "found": company is not None,
            "data": company,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }


# Singleton instance
ai_engine = AIEngine()
