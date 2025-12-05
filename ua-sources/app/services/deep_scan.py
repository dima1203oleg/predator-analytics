"""
Deep Scan Service - Comprehensive data analysis
Multi-source aggregation and risk assessment
"""
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime
import asyncio
import logging

from ..connectors.prozorro import prozorro_connector
from ..connectors.registry import registry_connector
from ..connectors.tax import tax_connector
from ..connectors.nbu_fx import nbu_fx_connector

logger = logging.getLogger(__name__)


@dataclass
class DeepScanResult:
    query: str
    sources: List[Dict[str, Any]]
    risk_score: float
    entities_found: int
    processing_time_ms: float
    timestamp: datetime


class DeepScanService:
    """
    Deep Scan Service - aggregates data from multiple Ukrainian sources
    """
    
    def __init__(self):
        self.connectors = {
            "edr": registry_connector,
            "prozorro": prozorro_connector,
            "tax": tax_connector,
        }
    
    async def scan(
        self,
        query: str,
        sectors: List[str] = None,
        sources: List[str] = None
    ) -> DeepScanResult:
        """
        Perform deep scan across multiple sources
        
        Args:
            query: Search query
            sectors: Sectors to focus on
            sources: Specific sources to query
        """
        import time
        start_time = time.time()
        
        sectors = sectors or ["GOV", "BIZ"]
        sources_to_query = sources or list(self.connectors.keys())
        
        results = []
        tasks = []
        
        # Create async tasks for parallel querying
        for source_name in sources_to_query:
            if source_name in self.connectors:
                connector = self.connectors[source_name]
                tasks.append(self._query_source(source_name, connector, query))
        
        # Execute all queries in parallel
        source_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        total_entities = 0
        for result in source_results:
            if isinstance(result, dict) and result.get("success"):
                results.append(result)
                total_entities += result.get("count", 0)
        
        # Calculate risk score based on findings
        risk_score = self._calculate_risk_score(results)
        
        processing_time = (time.time() - start_time) * 1000
        
        return DeepScanResult(
            query=query,
            sources=results,
            risk_score=risk_score,
            entities_found=total_entities,
            processing_time_ms=processing_time,
            timestamp=datetime.utcnow()
        )
    
    async def _query_source(
        self,
        name: str,
        connector,
        query: str
    ) -> Dict[str, Any]:
        """Query a single source"""
        try:
            result = await connector.search(query, limit=10)
            return {
                "name": name,
                "type": "registry",
                "success": result.success,
                "count": result.records_count,
                "data": result.data[:5] if result.data else []
            }
        except Exception as e:
            logger.error(f"Error querying {name}: {e}")
            return {
                "name": name,
                "success": False,
                "error": str(e),
                "count": 0
            }
    
    def _calculate_risk_score(self, results: List[Dict]) -> float:
        """Calculate aggregate risk score"""
        if not results:
            return 0.0
        
        # Simple scoring: more results = higher risk of issues
        total_findings = sum(r.get("count", 0) for r in results)
        
        if total_findings == 0:
            return 0.1  # Low risk - no data found
        elif total_findings < 5:
            return 0.3
        elif total_findings < 20:
            return 0.5
        else:
            return 0.7


# Singleton instance
deep_scan_service = DeepScanService()
