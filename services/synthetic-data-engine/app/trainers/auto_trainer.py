"""AutoTrainer — автоматичне навчання моделей на згенерованих даних."""

import pandas as pd
import numpy as np
from typing import Any, Dict, Optional, Tuple
import structlog
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, mean_squared_error, f1_score, roc_auc_score
from xgboost import XGBClassifier, XGBRegressor

logger = structlog.get_logger("sde.trainers.auto")

class AutoTrainer:
    """Клас для тренування baseline моделей на синтетичних даних."""

    def __init__(self, target_column: str, task_type: str = "auto", config: Dict[str, Any] = None):
        self.target_column = target_column
        self.task_type = task_type
        self.config = config or {}
        self.model = None
        self.metrics = {}
        
    def _detect_task_type(self, series: pd.Series) -> str:
        """Автоматичне визначення типу задачі (класифікація чи регресія)."""
        if pd.api.types.is_numeric_dtype(series):
            unique_ratio = series.nunique() / len(series)
            if unique_ratio < 0.05 or series.nunique() <= 10:
                return "classification"
            return "regression"
        return "classification"

    def _preprocess(self, X: pd.DataFrame) -> pd.DataFrame:
        """Базовий препроцесинг: кодування категорій, заповнення пропусків."""
        X_proc = X.copy()
        
        # Заповнення пропусків
        for col in X_proc.columns:
            if X_proc[col].isnull().any():
                if pd.api.types.is_numeric_dtype(X_proc[col]):
                    X_proc[col] = X_proc[col].fillna(X_proc[col].median())
                else:
                    X_proc[col] = X_proc[col].fillna(X_proc[col].mode()[0])
                    
        # Кодування категорій для XGBoost
        for col in X_proc.select_dtypes(include=['object', 'category']).columns:
            X_proc[col] = X_proc[col].astype('category')
            
        return X_proc

    def train(self, data: pd.DataFrame) -> Dict[str, Any]:
        """Тренування моделі та розрахунок метрик."""
        if self.target_column not in data.columns:
            raise ValueError(f"Target column {self.target_column} not found in data")
            
        logger.info(f"AutoTrainer: підготовка до навчання, target={self.target_column}")
        
        X = data.drop(columns=[self.target_column])
        y = data[self.target_column]
        
        if self.task_type == "auto":
            self.task_type = self._detect_task_type(y)
            logger.info(f"Auto-detected task type: {self.task_type}")
            
        X = self._preprocess(X)
        
        # Label encoding for target if classification
        if self.task_type == "classification" and not pd.api.types.is_numeric_dtype(y):
            y = pd.Categorical(y).codes
            
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        if self.task_type == "classification":
            self.model = XGBClassifier(enable_categorical=True, random_state=42)
        else:
            self.model = XGBRegressor(enable_categorical=True, random_state=42)
            
        logger.info(f"Початок тренування {self.model.__class__.__name__}")
        self.model.fit(X_train, y_train)
        
        # Оцінка
        preds = self.model.predict(X_test)
        
        if self.task_type == "classification":
            num_classes = len(np.unique(y))
            self.metrics["accuracy"] = accuracy_score(y_test, preds)
            
            # F1 score
            if num_classes > 2:
                self.metrics["f1_macro"] = f1_score(y_test, preds, average="macro")
            else:
                self.metrics["f1"] = f1_score(y_test, preds)
                
            # AUC (якщо можливо)
            try:
                probas = self.model.predict_proba(X_test)
                if num_classes == 2:
                    self.metrics["roc_auc"] = roc_auc_score(y_test, probas[:, 1])
            except Exception as e:
                logger.debug(f"AUC calculation skipped: {e}")
                
        else: # Regression
            self.metrics["mse"] = mean_squared_error(y_test, preds)
            self.metrics["rmse"] = np.sqrt(self.metrics["mse"])
            
        logger.info(f"Тренування завершено. Метрики: {self.metrics}")
        return self.metrics
