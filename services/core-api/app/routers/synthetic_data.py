"""Роутер для Synthetic Data Engine у Core API."""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File, Form
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
import pandas as pd
import io
import uuid

from predator_common.logging import get_logger

logger = get_logger("core-api.synthetic")

router = APIRouter(prefix="/synthetic", tags=["Synthetic Data"])

# Опціональний імпорт рушія — не падаємо якщо модуль недоступний
try:
    import sys, os
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../")))
    from services.synthetic_data_engine.app.engine import DatasetGeneratorTrainer
    engine = DatasetGeneratorTrainer()
except Exception as e:
    logger.warning("Synthetic Data Engine недоступний", error=str(e))
    engine = None

class ZeroShotRequest(BaseModel):
    domain: str = Field(..., description="Домен (customs, finance, etc)")
    num_rows: int = Field(1000, description="Кількість рядків для генерації", le=50000)
    custom_schema: Optional[Dict[str, str]] = Field(None, description="Власна схема генерації")

class HybridPipelineRequest(BaseModel):
    target_column: str = Field(..., description="Цільова колонка для навчання")
    synthetic_ratio: float = Field(1.0, description="Відношення синтетики до оригіналу (1.0 = 100%)", gt=0.0, le=5.0)

@router.post("/generate/zero-shot", summary="Генерація з нуля (Zero-Shot)")
async def generate_zero_shot(request: ZeroShotRequest, background_tasks: BackgroundTasks):
    """Генерує датасет з нуля на основі конфігурації домену."""
    try:
        # Для простоти чекаємо (в реальності краще в bg task)
        result = await engine.zero_shot(
            domain=request.domain,
            num_rows=request.num_rows,
            custom_schema=request.custom_schema
        )
        return result
    except Exception as e:
        logger.error(f"Zero-shot generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate/from-file", summary="Генерація на основі існуючих даних")
async def generate_from_file(
    file: UploadFile = File(...),
    num_rows: int = Form(1000),
    force_generator: Optional[str] = Form(None)
):
    """Генерує датасет на основі завантаженого файлу (CSV)."""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
        
    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))
        
        # Обмеження для безпеки
        if len(df) > 50000:
            df = df.sample(50000)
            
        result = await engine.reference_based(
            real_data=df,
            num_rows=num_rows,
            force_generator=force_generator
        )
        return result
    except Exception as e:
        logger.error(f"Reference-based generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/train/hybrid", summary="Запуск Hybrid Training Pipeline")
async def run_hybrid_pipeline(
    file: UploadFile = File(...),
    target_column: str = Form(...),
    synthetic_ratio: float = Form(1.0)
):
    """Генерує синтетику на основі файлу та одразу тренує модель."""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
        
    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))
        
        if target_column not in df.columns:
            raise HTTPException(status_code=400, detail=f"Target column '{target_column}' not found in CSV")
            
        result = await engine.hybrid_pipeline(
            real_data=df,
            target_column=target_column,
            synthetic_ratio=synthetic_ratio
        )
        return result
    except Exception as e:
        logger.error(f"Hybrid pipeline failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
