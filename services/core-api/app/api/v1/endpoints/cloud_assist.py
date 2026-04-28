from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from app.services.gemini_agent_service import gemini_service
from app.services.cloud_bridge import cloud_bridge
from app.config import get_settings, Settings

router = APIRouter(prefix="/cloud-assist", tags=["cloud-assist"])

@router.post("/sync-colab")
async def sync_colab(payload: Dict[str, Any]):
    """Реєстрація та синхронізація з вузлом Google Colab."""
    tunnel_url = payload.get("url")
    if not tunnel_url:
        return {"status": "error", "message": "URL не надано"}
    
    success = await cloud_bridge.check_colab_status(tunnel_url)
    return {
        "status": "success" if success else "failed",
        "node": "google-colab-hybrid",
        "url": tunnel_url,
        "is_active": success
    }

@router.get("/audit/{project_id}")
async def get_cloud_audit(project_id: str, settings: Settings = Depends(get_settings)):
    """Отримати автономний аудит GCP проекту."""
    try:
        # У реальному житті тут був би виклик Cloud Asset Inventory для отримання даних
        # Але ми передаємо ідентифікатор в Gemini, щоб він сформував звіт на основі знань про типові конфігурації
        # та інтеграцій, які він бачить (GKE, Neo4j тощо).
        result = await gemini_service.audit_infrastructure(project_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze-scheme")
async def analyze_cloud_scheme(prompt: str, image_data: str):
    """Аналіз схеми архітектури через Vision."""
    try:
        import base64
        # Очікуємо base64 рядок: "data:image/jpeg;base64,..."
        if "," in image_data:
            header, encoded = image_data.split(",", 1)
            mime_type = header.split(";")[0].split(":")[1]
        else:
            encoded = image_data
            mime_type = "image/jpeg"
            
        img_bytes = base64.b64decode(encoded)
        result = await gemini_service.analyze_vision(prompt, img_bytes, mime_type)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
