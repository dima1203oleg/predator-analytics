"""
UA Sources - Data Source Tasks
Background tasks for Ukrainian data source operations
"""
from celery import shared_task
from datetime import datetime, timezone
import logging
import asyncio

# Import services inside tasks to avoid circular imports during startup
# from app.services.deep_scan import deep_scan_service
# from app.services.graph_builder import graph_builder

logger = logging.getLogger(__name__)


@shared_task(name="tasks.ua_sources.deep_scan")
def deep_scan_task(query: str, sectors: list = None):
    """Run deep scan in background using DeepScanService"""
    logger.info(f"Starting deep scan task: {query}")
    
    try:
        from app.services.deep_scan import deep_scan_service
        
        # Run async service in sync task
        result = asyncio.run(deep_scan_service.scan(query, sectors=sectors))
        
        # In specific Celery backend configuration, we might save result to DB here
        return {
            "status": "completed",
            "query": query,
            "risk_score": result.risk_score,
            "entities_found": result.entities_found,
            "timestamp": result.timestamp.isoformat()
        }
    except Exception as e:
        logger.error(f"Deep scan task failed: {e}")
        return {"status": "failed", "error": str(e)}


@shared_task(name="tasks.ua_sources.batch_risk_assessment")
def batch_risk_assessment(edrpou_list: list):
    """Batch risk assessment for multiple companies"""
    logger.info(f"Starting batch assessment for {len(edrpou_list)} companies")
    
    try:
        from app.services.ai_engine import ai_engine
        
        results = []
        async def run_batch():
            tasks = [ai_engine.quick_check(edrpou) for edrpou in edrpou_list]
            return await asyncio.gather(*tasks, return_exceptions=True)
            
        batch_results = asyncio.run(run_batch())
        
        processed_count = 0
        for res in batch_results:
            if isinstance(res, dict):
                results.append(res)
                processed_count += 1
                
        return {
            "status": "completed",
            "total_requested": len(edrpou_list),
            "processed": processed_count,
            "results_preview": results[:5]
        }
    except Exception as e:
        logger.error(f"Batch assessment failed: {e}")
        return {"status": "failed", "error": str(e)}


@shared_task(name="tasks.ua_sources.build_entity_graph")
def build_entity_graph_task(entity_id: str, depth: int = 2):
    """Build entity relationship graph using GraphBuilderService"""
    logger.info(f"Building graph for {entity_id}")
    
    try:
        from app.services.graph_builder import graph_builder
        
        graph = asyncio.run(graph_builder.build_graph(entity_id, depth=depth))
        
        return {
            "status": "completed",
            "entity": entity_id,
            "nodes_count": len(graph.nodes),
            "edges_count": len(graph.edges),
            "depth": graph.depth
        }
    except Exception as e:
        logger.error(f"Graph build task failed: {e}")
        return {"status": "failed", "error": str(e)}


@shared_task(name="tasks.ua_sources.generate_report")
def generate_report(report_type: str, params: dict = None):
    """Generate analytical report (stub for PDF generation)"""
    logger.info(f"Generating {report_type} report")
    
    # Simulate PDF generation time
    import time
    time.sleep(2)
    
    return {
        "status": "completed",
        "type": report_type,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "url": f"/reports/{report_type}_{int(time.time())}.pdf"
    }
