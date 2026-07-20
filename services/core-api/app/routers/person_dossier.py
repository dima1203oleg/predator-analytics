"""
Person Dossier API Router — PREDATOR Core API
Ендпоінт для повної збірки досьє на фізичну особу (граф + AI портрет).
"""
import logging
from typing import Any, Dict
from fastapi import APIRouter, HTTPException
from app.services.dossier.person_aggregator import PersonDossierAggregator
from app.services.dossier.ai_profiler import AIProfiler

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/dossier/person",
    tags=["Person Intelligence"],
    responses={404: {"description": "Not found"}},
)

aggregator = PersonDossierAggregator()
profiler = AIProfiler()

@router.get("/{identifier}", response_model=Dict[str, Any])
async def get_person_dossier(identifier: str):
    """
    Збирає повний OSINT-портрет на фізичну особу.
    - Витягує всі активи, компанії, родичів, транспорт з графа (Neo4j).
    - Витягує цифрові сліди (Crypto, Leaks).
    - Генерує психологічний AI-портрет та оцінку ризиків відмивання коштів.
    """
    try:
        # 1. Збір даних (Graph Traversal)
        graph_data = await aggregator.compile_full_profile(identifier)
        
        if not graph_data:
            raise HTTPException(status_code=404, detail="Person not found in graph database")
            
        # 2. AI Аналітика
        ai_summary = await profiler.generate_portrait(graph_data)
        
        # 3. Об'єднання
        complete_dossier = {
            "metadata": {
                "identifier": identifier,
                "status": "compiled",
                "ai_verified": True
            },
            "graph_data": graph_data,
            "ai_analytics": ai_summary
        }
        
        return complete_dossier
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error compiling person dossier: {e}")
        raise HTTPException(status_code=500, detail=str(e))
