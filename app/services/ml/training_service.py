from __future__ import annotations

"""
PREDATOR ML Training Service (v4.2.0)

Handles automated model training, validation and registration for the analytics suite.
(COMP-053)
"""

import logging
import uuid
import json
from datetime import datetime, UTC
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_percentage_error, r2_score

from app.libs.core.database import get_db_sync
from app.services.ml.forecast_service import get_forecast_service
from app.services.ml.mlflow_utils import tracker

logger = logging.getLogger(__name__)

class TrainingService:
    """Service for managing ML model training lifecycles."""

    def __init__(self):
        self.model_registry = {} # In-memory registry for now
        logger.info("ML Training Service initialized")

    async def train_forecast_model(self, product_code: str, training_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Train a specific forecast model for a product code.
        
        Args:
            product_code: HS Code or product identifier.
            training_data: List of historical records with 'date' and 'volume'.
        """
        job_id = str(uuid.uuid4())[:8]
        logger.info(f"Starting training job {job_id} for product {product_code}")

        try:
            if not training_data or len(training_data) < 10:
                return {
                    "status": "failed",
                    "error": "Insufficient data for training (min 10 records required)",
                    "records": len(training_data) if training_data else 0
                }

            # 1. Data Preparation
            df = pd.DataFrame(training_data)
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date')
            
            # Feature engineering
            df['t'] = np.arange(len(df))
            df['month'] = df['date'].dt.month
            df['quarter'] = df['date'].dt.quarter
            
            X = df[['t', 'month', 'quarter']].values
            y = df['volume'].values

            # 2. Split and Train
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            
            # Start tracking run if needed
            run_name = f"forecast_{product_code}_{job_id}"
            tracker.start_run(run_name=run_name)
            tracker.log_param("product_code", product_code)
            tracker.log_param("data_points", len(df))
            
            model = GradientBoostingRegressor(
                n_estimators=150, 
                learning_rate=0.05, 
                max_depth=4,
                random_state=42
            )
            model.fit(X_train, y_train)
            
            tracker.log_param("n_estimators", 150)
            tracker.log_param("learning_rate", 0.05)

            # 3. Validation
            y_pred = model.predict(X_test)
            mape = mean_absolute_percentage_error(y_test, y_pred)
            r2 = r2_score(y_test, y_pred)
            
            tracker.log_metric("mape", float(mape))
            tracker.log_metric("r2", float(r2))
            tracker.end_run()

            # 4. Registration (Metadata)
            model_info = {
                "model_id": f"forecast_{product_code}_{job_id}",
                "algorithm": "GradientBoostingRegressor",
                "metrics": {
                    "mape": float(mape),
                    "r2": float(r2),
                    "data_points": len(df)
                },
                "parameters": model.get_params(),
                "trained_at": datetime.now(UTC).isoformat(),
                "status": "active" if r2 > 0.5 else "degraded"
            }
            
            self.model_registry[product_code] = model_info
            
            logger.info(f"Training completed for {product_code}. R2: {r2:.2f}, MAPE: {mape:.2f}")
            
            return {
                "status": "success",
                "job_id": job_id,
                "model_info": model_info
            }

        except Exception as e:
            logger.exception(f"Training job {job_id} failed: {e}")
            return {"status": "failed", "error": str(e)}

    def get_model_status(self, product_code: str) -> Optional[Dict[str, Any]]:
        """Get information about the latest trained model for a product."""
        return self.model_registry.get(product_code)

def get_training_service() -> TrainingService:
    """Dependency provider."""
    return TrainingService()
