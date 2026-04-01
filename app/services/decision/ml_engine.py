"""
🤖 Decision Intelligence ML Engine

Система машинного навчання для Decision Intelligence Engine.
Підтримує:
- Прогнозування ризиків контрагентів
- Оптимізація закупівельних рішень
- Прогнозування ринкових тенденцій
- Рекомендації на основі історичних даних
- Автоматичне навчання моделей

Моделі:
- RiskPredictionModel — прогнозування CERS скору
- ProcurementOptimizationModel — оптимізація закупівель
- MarketTrendModel — прогнозування ринкових тенденцій
- RecommendationEngine — рекомендаційна система
"""

import asyncio
import json
import logging
import pickle
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.metrics import accuracy_score, mean_squared_error, precision_score, recall_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

logger = logging.getLogger("predator.decision.ml")


@dataclass
class MLModelConfig:
    """Конфігурація ML моделі"""
    model_type: str
    features: List[str]
    target: str
    hyperparameters: Dict[str, Any]
    metrics: List[str]
    retrain_interval_days: int = 7


@dataclass
class PredictionResult:
    """Результат прогнозування"""
    prediction: Union[float, int, str]
    confidence: float
    features_used: List[str]
    model_version: str
    timestamp: datetime
    metadata: Dict[str, Any] = None


class RiskPredictionModel:
    """ML модель для прогнозування ризиків контрагентів"""
    
    def __init__(self, model_path: Optional[str] = None):
        self.model_path = Path(model_path) if model_path else Path("/tmp/models/risk_model.pkl")
        self.scaler_path = self.model_path.with_suffix(".scaler.pkl")
        self.model = None
        self.scaler = None
        self.feature_columns = [
            "court_cases_count",
            "offshore_connections", 
            "revenue_change_pct",
            "sanctions_status",
            "payment_delay_days",
            "pep_connections",
            "prozorro_violations",
            "total_declarations",
            "total_value_usd",
            "last_activity_days"
        ]
        self.model_version = "1.0.0"
        self.last_trained = None
    
    async def train(self, training_data: pd.DataFrame) -> Dict[str, float]:
        """
        Навчання моделі прогнозування ризиків
        
        Args:
            training_data: DataFrame з даними для навчання
            
        Returns:
            Метрики якості моделі
        """
        try:
            # Підготовка даних
            X = training_data[self.feature_columns].copy()
            y = training_data["cers_score"]
            
            # Обробка пропущених значень
            X = X.fillna(X.mean())
            
            # Розподіл на train/test
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
            
            # Масштабування ознак
            self.scaler = StandardScaler()
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            
            # Навчання моделі
            self.model = RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                random_state=42,
                n_jobs=-1
            )
            
            self.model.fit(X_train_scaled, y_train)
            
            # Оцінка якості
            y_pred = self.model.predict(X_test_scaled)
            mse = mean_squared_error(y_test, y_pred)
            rmse = np.sqrt(mse)
            mae = np.mean(np.abs(y_test - y_pred))
            r2 = self.model.score(X_test_scaled, y_test)
            
            # Збереження моделі
            await self._save_model()
            
            self.last_trained = datetime.now(UTC)
            
            metrics = {
                "mse": mse,
                "rmse": rmse,
                "mae": mae,
                "r2": r2,
                "samples": len(training_data)
            }
            
            logger.info("Risk model trained: R²=%.3f, RMSE=%.2f", r2, rmse)
            return metrics
            
        except Exception as e:
            logger.error("Error training risk model: %s", e)
            raise
    
    async def predict_risk(self, features: Dict[str, Any]) -> PredictionResult:
        """
        Прогнозування ризику для компанії
        
        Args:
            features: Ознаки компанії
            
        Returns:
            Прогноз CERS скору з впевненістю
        """
        if self.model is None:
            await self._load_model()
        
        if self.model is None:
            raise ValueError("Model not trained or loaded")
        
        # Підготовка ознак
        feature_vector = []
        for col in self.feature_columns:
            value = features.get(col, 0)
            if isinstance(value, str):
                # Кодування категоріальних ознак
                if col == "sanctions_status":
                    value = 0 if value == "none" else 1 if value == "watchlist" else 2
                else:
                    value = 0
            feature_vector.append(float(value))
        
        # Масштабування
        feature_vector_scaled = self.scaler.transform([feature_vector])
        
        # Прогнозування
        prediction = self.model.predict(feature_vector_scaled)[0]
        
        # Розрахунок впевненості (на основі дисперсії дерев)
        if hasattr(self.model, 'estimators_'):
            predictions = [tree.predict(feature_vector_scaled)[0] for tree in self.model.estimators_]
            confidence = 1.0 - (np.std(predictions) / np.mean(predictions)) if np.mean(predictions) > 0 else 0.5
            confidence = max(0.1, min(0.95, confidence))
        else:
            confidence = 0.8
        
        # Обмеження діапазону
        prediction = max(0, min(100, prediction))
        
        return PredictionResult(
            prediction=float(prediction),
            confidence=float(confidence),
            features_used=self.feature_columns,
            model_version=self.model_version,
            timestamp=datetime.now(UTC),
            metadata={
                "risk_level": self._get_risk_level(prediction),
                "verdict": self._get_verdict(prediction)
            }
        )
    
    def _get_risk_level(self, score: float) -> str:
        """Отримати рівень ризику за скором"""
        if score >= 75:
            return "critical"
        elif score >= 50:
            return "high"
        elif score >= 25:
            return "medium"
        else:
            return "low"
    
    def _get_verdict(self, score: float) -> str:
        """Отримати вердикт за скором"""
        if score >= 75:
            return "УНИКАЙТЕ"
        elif score >= 50:
            return "ПЕРЕВІРТЕ"
        elif score >= 25:
            return "З ОБЕРЕЖНІСТЮ"
        else:
            return "БЕЗПЕЧНО"
    
    async def _save_model(self):
        """Зберегти модель"""
        self.model_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(self.model_path, 'wb') as f:
            pickle.dump(self.model, f)
        
        with open(self.scaler_path, 'wb') as f:
            pickle.dump(self.scaler, f)
        
        logger.info("Risk model saved to %s", self.model_path)
    
    async def _load_model(self):
        """Завантажити модель"""
        try:
            if self.model_path.exists() and self.scaler_path.exists():
                with open(self.model_path, 'rb') as f:
                    self.model = pickle.load(f)
                
                with open(self.scaler_path, 'rb') as f:
                    self.scaler = pickle.load(f)
                
                logger.info("Risk model loaded from %s", self.model_path)
        except Exception as e:
            logger.error("Error loading risk model: %s", e)
            self.model = None
            self.scaler = None


class ProcurementOptimizationModel:
    """ML модель для оптимізації закупівель"""
    
    def __init__(self, model_path: Optional[str] = None):
        self.model_path = Path(model_path) if model_path else Path("/tmp/models/procurement_model.pkl")
        self.model = None
        self.feature_columns = [
            "product_price",
            "supplier_reliability",
            "delivery_time_days",
            "payment_terms_days",
            "quality_score",
            "country_risk_score",
            "market_demand",
            "seasonality_factor"
        ]
        self.model_version = "1.0.0"
    
    async def train(self, training_data: pd.DataFrame) -> Dict[str, float]:
        """
        Навчання моделі оптимізації закупівель
        
        Args:
            training_data: DataFrame з даними закупівель
            
        Returns:
            Метрики якості моделі
        """
        try:
            # Підготовка даних
            X = training_data[self.feature_columns].copy()
            y = training_data["total_cost_savings"]
            
            # Обробка пропущених значень
            X = X.fillna(X.mean())
            
            # Розподіл на train/test
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
            
            # Навчання моделі
            self.model = RandomForestRegressor(
                n_estimators=100,
                max_depth=15,
                random_state=42,
                n_jobs=-1
            )
            
            self.model.fit(X_train, y_train)
            
            # Оцінка якості
            y_pred = self.model.predict(X_test)
            mse = mean_squared_error(y_test, y_pred)
            rmse = np.sqrt(mse)
            r2 = self.model.score(X_test, y_test)
            
            # Збереження моделі
            await self._save_model()
            
            metrics = {
                "mse": mse,
                "rmse": rmse,
                "r2": r2,
                "samples": len(training_data)
            }
            
            logger.info("Procurement model trained: R²=%.3f, RMSE=%.2f", r2, rmse)
            return metrics
            
        except Exception as e:
            logger.error("Error training procurement model: %s", e)
            raise
    
    async def optimize_procurement(
        self, 
        suppliers: List[Dict[str, Any]], 
        constraints: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Оптимізація закупівель
        
        Args:
            suppliers: Список постачальників з характеристиками
            constraints: Обмеження (бюджет, терміни і т.д.)
            
        Returns:
            Оптимальні рекомендації
        """
        if self.model is None:
            await self._load_model()
        
        if self.model is None:
            raise ValueError("Model not trained or loaded")
        
        # Прогнозування економії для кожного постачальника
        supplier_scores = []
        for supplier in suppliers:
            features = []
            for col in self.feature_columns:
                value = supplier.get(col, 0)
                features.append(float(value))
            
            # Прогноз економії
            predicted_savings = self.model.predict([features])[0]
            
            # Розрахунок загального рейтингу
            reliability = supplier.get("supplier_reliability", 0.5)
            price = supplier.get("product_price", 0)
            delivery_time = supplier.get("delivery_time_days", 30)
            
            # Комплексний рейтинг
            rating = (
                predicted_savings * 0.4 +
                reliability * 100 * 0.3 +
                (1 - price / max(price for s in suppliers)) * 100 * 0.2 +
                (1 - delivery_time / max(s.get("delivery_time_days", 30) for s in suppliers)) * 100 * 0.1
            )
            
            supplier_scores.append({
                "supplier": supplier,
                "predicted_savings": predicted_savings,
                "rating": rating,
                "recommendation": self._get_recommendation(rating)
            })
        
        # Сортування за рейтингом
        supplier_scores.sort(key=lambda x: x["rating"], reverse=True)
        
        # Застосування обмежень
        if constraints:
            max_suppliers = constraints.get("max_suppliers", len(supplier_scores))
            supplier_scores = supplier_scores[:max_suppliers]
        
        return {
            "optimized_suppliers": supplier_scores,
            "total_predicted_savings": sum(s["predicted_savings"] for s in supplier_scores),
            "best_supplier": supplier_scores[0] if supplier_scores else None,
            "recommendations": self._generate_procurement_recommendations(supplier_scores)
        }
    
    def _get_recommendation(self, rating: float) -> str:
        """Отримати рекомендацію за рейтингом"""
        if rating >= 80:
            return "Рекомендується"
        elif rating >= 60:
            return "Прийнятно"
        elif rating >= 40:
            return "З обережністю"
        else:
            return "Не рекомендується"
    
    def _generate_procurement_recommendations(self, supplier_scores: List[Dict]) -> List[str]:
        """Генерація рекомендацій для закупівель"""
        recommendations = []
        
        if not supplier_scores:
            return ["Немає доступних постачальників"]
        
        best = supplier_scores[0]
        recommendations.append(f"Найкращий постачальник: {best['supplier'].get('name', 'Unknown')}")
        
        total_savings = sum(s["predicted_savings"] for s in supplier_scores[:3])
        recommendations.append(f"Потенційна економія (ТОП-3): ${total_savings:,.0f}")
        
        avg_reliability = sum(s["supplier"].get("supplier_reliability", 0.5) for s in supplier_scores[:3]) / 3
        if avg_reliability >= 0.8:
            recommendations.append("Високій надійності постачальники")
        elif avg_reliability >= 0.6:
            recommendations.append("Середня надійність постачальників")
        else:
            recommendations.append("Низька надійність - рекомендується додаткова перевірка")
        
        return recommendations
    
    async def _save_model(self):
        """Зберегти модель"""
        self.model_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(self.model_path, 'wb') as f:
            pickle.dump(self.model, f)
        
        logger.info("Procurement model saved to %s", self.model_path)
    
    async def _load_model(self):
        """Завантажити модель"""
        try:
            if self.model_path.exists():
                with open(self.model_path, 'rb') as f:
                    self.model = pickle.load(f)
                
                logger.info("Procurement model loaded from %s", self.model_path)
        except Exception as e:
            logger.error("Error loading procurement model: %s", e)
            self.model = None


class MarketTrendModel:
    """ML модель для прогнозування ринкових тенденцій"""
    
    def __init__(self, model_path: Optional[str] = None):
        self.model_path = Path(model_path) if model_path else Path("/tmp/models/market_model.pkl")
        self.model = None
        self.feature_columns = [
            "price_trend_7d",
            "price_trend_30d", 
            "volume_trend_7d",
            "volume_trend_30d",
            "seasonal_index",
            "market_volatility",
            "competitor_count",
            "demand_growth_rate"
        ]
        self.model_version = "1.0.0"
    
    async def train(self, training_data: pd.DataFrame) -> Dict[str, float]:
        """
        Навчання моделі прогнозування ринкових тенденцій
        
        Args:
            training_data: DataFrame з ринковими даними
            
        Returns:
            Метрики якості моделі
        """
        try:
            # Підготовка даних
            X = training_data[self.feature_columns].copy()
            y = training_data["price_change_30d"]
            
            # Обробка пропущених значень
            X = X.fillna(X.mean())
            
            # Розподіл на train/test
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
            
            # Навчання моделі
            self.model = LinearRegression()
            self.model.fit(X_train, y_train)
            
            # Оцінка якості
            y_pred = self.model.predict(X_test)
            mse = mean_squared_error(y_test, y_pred)
            rmse = np.sqrt(mse)
            r2 = self.model.score(X_test, y_test)
            
            # Збереження моделі
            await self._save_model()
            
            metrics = {
                "mse": mse,
                "rmse": rmse,
                "r2": r2,
                "samples": len(training_data)
            }
            
            logger.info("Market trend model trained: R²=%.3f, RMSE=%.2f", r2, rmse)
            return metrics
            
        except Exception as e:
            logger.error("Error training market trend model: %s", e)
            raise
    
    async def predict_trend(self, market_data: Dict[str, Any]) -> PredictionResult:
        """
        Прогнозування ринкової тенденції
        
        Args:
            market_data: Ринкові дані
            
        Returns:
            Прогноз зміни ціни з впевненістю
        """
        if self.model is None:
            await self._load_model()
        
        if self.model is None:
            raise ValueError("Model not trained or loaded")
        
        # Підготовка ознак
        feature_vector = []
        for col in self.feature_columns:
            value = market_data.get(col, 0)
            feature_vector.append(float(value))
        
        # Прогнозування
        prediction = self.model.predict([feature_vector])[0]
        
        # Розрахунок впевненості
        confidence = min(0.9, max(0.3, 1.0 - abs(prediction) / 100))
        
        # Інтерпретація тенденції
        trend = "зростання" if prediction > 2 else "падіння" if prediction < -2 else "стабільний"
        
        return PredictionResult(
            prediction=float(prediction),
            confidence=float(confidence),
            features_used=self.feature_columns,
            model_version=self.model_version,
            timestamp=datetime.now(UTC),
            metadata={
                "trend": trend,
                "trend_strength": "сильний" if abs(prediction) > 5 else "помірний" if abs(prediction) > 2 else "слабкий"
            }
        )
    
    async def _save_model(self):
        """Зберегти модель"""
        self.model_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(self.model_path, 'wb') as f:
            pickle.dump(self.model, f)
        
        logger.info("Market trend model saved to %s", self.model_path)
    
    async def _load_model(self):
        """Завантажити модель"""
        try:
            if self.model_path.exists():
                with open(self.model_path, 'rb') as f:
                    self.model = pickle.load(f)
                
                logger.info("Market trend model loaded from %s", self.model_path)
        except Exception as e:
            logger.error("Error loading market trend model: %s", e)
            self.model = None


class RecommendationEngine:
    """Рекомендаційна система на основі ML моделей"""
    
    def __init__(self):
        self.risk_model = RiskPredictionModel()
        self.procurement_model = ProcurementOptimizationModel()
        self.market_model = MarketTrendModel()
        self.models_trained = False
    
    async def train_all_models(self, training_data: Dict[str, pd.DataFrame]) -> Dict[str, Any]:
        """
        Навчання всіх ML моделей
        
        Args:
            training_data: Дані для навчання моделей
            
        Returns:
            Метрики всіх моделей
        """
        results = {}
        
        try:
            # Навчання моделі ризиків
            if "risk_data" in training_data:
                risk_metrics = await self.risk_model.train(training_data["risk_data"])
                results["risk_model"] = risk_metrics
            
            # Навчання моделі закупівель
            if "procurement_data" in training_data:
                procurement_metrics = await self.procurement_model.train(training_data["procurement_data"])
                results["procurement_model"] = procurement_metrics
            
            # Навчання моделі ринкових тенденцій
            if "market_data" in training_data:
                market_metrics = await self.market_model.train(training_data["market_data"])
                results["market_model"] = market_metrics
            
            self.models_trained = True
            logger.info("All ML models trained successfully")
            
        except Exception as e:
            logger.error("Error training models: %s", e)
            raise
        
        return results
    
    async def get_comprehensive_recommendation(
        self,
        company_data: Dict[str, Any],
        procurement_data: List[Dict[str, Any]],
        market_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Отримання комплексної рекомендації
        
        Args:
            company_data: Дані компанії
            procurement_data: Дані постачальників
            market_data: Ринкові дані
            
        Returns:
            Комплексна рекомендація
        """
        if not self.models_trained:
            # Завантажуємо моделі, якщо не навчено
            await self.risk_model._load_model()
            await self.procurement_model._load_model()
            await self.market_model._load_model()
        
        recommendations = {}
        
        # Прогноз ризику компанії
        try:
            risk_prediction = await self.risk_model.predict_risk(company_data)
            recommendations["risk_assessment"] = {
                "cers_score": risk_prediction.prediction,
                "confidence": risk_prediction.confidence,
                "risk_level": risk_prediction.metadata.get("risk_level"),
                "verdict": risk_prediction.metadata.get("verdict")
            }
        except Exception as e:
            logger.error("Error in risk prediction: %s", e)
            recommendations["risk_assessment"] = {"error": str(e)}
        
        # Оптимізація закупівель
        try:
            procurement_optimization = await self.procurement_model.optimize_procurement(procurement_data)
            recommendations["procurement_optimization"] = procurement_optimization
        except Exception as e:
            logger.error("Error in procurement optimization: %s", e)
            recommendations["procurement_optimization"] = {"error": str(e)}
        
        # Прогноз ринкових тенденцій
        try:
            market_trend = await self.market_model.predict_trend(market_data)
            recommendations["market_trend"] = {
                "price_change": market_trend.prediction,
                "confidence": market_trend.confidence,
                "trend": market_trend.metadata.get("trend"),
                "trend_strength": market_trend.metadata.get("trend_strength")
            }
        except Exception as e:
            logger.error("Error in market trend prediction: %s", e)
            recommendations["market_trend"] = {"error": str(e)}
        
        # Комплексна рекомендація
        recommendations["overall_recommendation"] = self._generate_overall_recommendation(recommendations)
        
        return recommendations
    
    def _generate_overall_recommendation(self, predictions: Dict[str, Any]) -> Dict[str, Any]:
        """Генерація комплексної рекомендації"""
        risk_level = "unknown"
        procurement_savings = 0
        market_trend = "stable"
        
        # Аналіз ризиків
        if "risk_assessment" in predictions and "risk_level" in predictions["risk_assessment"]:
            risk_level = predictions["risk_assessment"]["risk_level"]
        
        # Аналіз закупівель
        if "procurement_optimization" in predictions and "total_predicted_savings" in predictions["procurement_optimization"]:
            procurement_savings = predictions["procurement_optimization"]["total_predicted_savings"]
        
        # Аналіз ринку
        if "market_trend" in predictions and "trend" in predictions["market_trend"]:
            market_trend = predictions["market_trend"]["trend"]
        
        # Формування рекомендації
        if risk_level == "critical":
            recommendation = "УНИКАЙТЕ - критичний ризик компанії"
            action_items = ["Негайно припинити співпрацю", "Знайти альтернативних постачальників"]
        elif risk_level == "high":
            recommendation = "ПЕРЕВІРТЕ - підвищений ризик"
            action_items = ["Провести повну due diligence", "Зменшити обсяги закупівель"]
        elif risk_level == "medium":
            recommendation = "З ОБЕРЕЖНІСТЮ - помірний ризик"
            action_items = ["Перевірити документи", "Моніторити активність"]
        else:
            recommendation = "БЕЗПЕЧНО - низький ризик"
            action_items = ["Можна розширювати співпрацю", "Розглянути довгострокові контракти"]
        
        # Додавання рекомендацій по закупівлях та ринку
        if procurement_savings > 1000:
            action_items.append(f"Оптимізуйте закупівлі для економії ${procurement_savings:,.0f}")
        
        if market_trend == "зростання":
            action_items.append("Ринок зростає - можна розширювати закупівлі")
        elif market_trend == "падіння":
            action_items.append("Ринок падає - зменште обсяги")
        
        return {
            "recommendation": recommendation,
            "action_items": action_items,
            "confidence_score": self._calculate_confidence_score(predictions),
            "priority": self._get_priority(risk_level, procurement_savings, market_trend)
        }
    
    def _calculate_confidence_score(self, predictions: Dict[str, Any]) -> float:
        """Розрахунок загальної впевненості"""
        confidences = []
        
        if "risk_assessment" in predictions and "confidence" in predictions["risk_assessment"]:
            confidences.append(predictions["risk_assessment"]["confidence"])
        
        # Додаємо інші впевненості при необхідності
        
        return sum(confidences) / len(confidences) if confidences else 0.5
    
    def _get_priority(self, risk_level: str, savings: float, trend: str) -> str:
        """Отримати пріоритет рекомендації"""
        if risk_level == "critical":
            return "HIGH"
        elif risk_level == "high":
            return "HIGH"
        elif risk_level == "medium" and savings > 5000:
            return "MEDIUM"
        elif trend == "падіння" and savings > 2000:
            return "MEDIUM"
        else:
            return "LOW"


# Фабричні функції
def get_risk_prediction_model(model_path: Optional[str] = None) -> RiskPredictionModel:
    """Отримати інстанс моделі прогнозування ризиків"""
    return RiskPredictionModel(model_path)


def get_procurement_optimization_model(model_path: Optional[str] = None) -> ProcurementOptimizationModel:
    """Отримати інстанс моделі оптимізації закупівель"""
    return ProcurementOptimizationModel(model_path)


def get_market_trend_model(model_path: Optional[str] = None) -> MarketTrendModel:
    """Отримати інстанс моделі ринкових тенденцій"""
    return MarketTrendModel(model_path)


def get_recommendation_engine() -> RecommendationEngine:
    """Отримати інстанс рекомендаційної системи"""
    return RecommendationEngine()


# Приклади використання
async def example_ml_usage():
    """Приклади використання ML моделей"""
    
    engine = get_recommendation_engine()
    
    # Демонстраційні дані для навчання
    risk_data = pd.DataFrame({
        "court_cases_count": np.random.randint(0, 10, 1000),
        "offshore_connections": np.random.randint(0, 5, 1000),
        "revenue_change_pct": np.random.uniform(-50, 50, 1000),
        "sanctions_status": np.random.choice(["none", "watchlist", "sanctioned"], 1000),
        "payment_delay_days": np.random.randint(0, 90, 1000),
        "pep_connections": np.random.randint(0, 3, 1000),
        "prozorro_violations": np.random.randint(0, 5, 1000),
        "total_declarations": np.random.randint(0, 100, 1000),
        "total_value_usd": np.random.uniform(0, 1000000, 1000),
        "last_activity_days": np.random.randint(0, 365, 1000),
        "cers_score": np.random.uniform(0, 100, 1000)
    })
    
    procurement_data = pd.DataFrame({
        "product_price": np.random.uniform(100, 10000, 500),
        "supplier_reliability": np.random.uniform(0.3, 1.0, 500),
        "delivery_time_days": np.random.randint(1, 90, 500),
        "payment_terms_days": np.random.randint(0, 120, 500),
        "quality_score": np.random.uniform(0.5, 1.0, 500),
        "country_risk_score": np.random.uniform(0, 1, 500),
        "market_demand": np.random.uniform(0, 1, 500),
        "seasonality_factor": np.random.uniform(0.5, 1.5, 500),
        "total_cost_savings": np.random.uniform(0, 50000, 500)
    })
    
    market_data = pd.DataFrame({
        "price_trend_7d": np.random.uniform(-10, 10, 300),
        "price_trend_30d": np.random.uniform(-20, 20, 300),
        "volume_trend_7d": np.random.uniform(-15, 15, 300),
        "volume_trend_30d": np.random.uniform(-25, 25, 300),
        "seasonal_index": np.random.uniform(0.8, 1.2, 300),
        "market_volatility": np.random.uniform(0.1, 0.5, 300),
        "competitor_count": np.random.randint(1, 50, 300),
        "demand_growth_rate": np.random.uniform(-0.1, 0.2, 300),
        "price_change_30d": np.random.uniform(-15, 15, 300)
    })
    
    # Навчання моделей
    training_data = {
        "risk_data": risk_data,
        "procurement_data": procurement_data,
        "market_data": market_data
    }
    
    metrics = await engine.train_all_models(training_data)
    print("Models trained with metrics:", metrics)
    
    # Комплексна рекомендація
    company_features = {
        "court_cases_count": 2,
        "offshore_connections": 1,
        "revenue_change_pct": -15,
        "sanctions_status": "none",
        "payment_delay_days": 30,
        "pep_connections": 0,
        "prozorro_violations": 1,
        "total_declarations": 25,
        "total_value_usd": 500000,
        "last_activity_days": 45
    }
    
    suppliers = [
        {
            "name": "Tech Solutions Ltd",
            "product_price": 1000,
            "supplier_reliability": 0.85,
            "delivery_time_days": 14,
            "payment_terms_days": 30,
            "quality_score": 0.9,
            "country_risk_score": 0.2,
            "market_demand": 0.8,
            "seasonality_factor": 1.0
        }
    ]
    
    market_features = {
        "price_trend_7d": 2.5,
        "price_trend_30d": 5.0,
        "volume_trend_7d": -1.2,
        "volume_trend_30d": 3.4,
        "seasonal_index": 1.1,
        "market_volatility": 0.25,
        "competitor_count": 15,
        "demand_growth_rate": 0.05
    }
    
    recommendation = await engine.get_comprehensive_recommendation(
        company_features, suppliers, market_features
    )
    
    print("Comprehensive recommendation:", recommendation)


if __name__ == "__main__":
    asyncio.run(example_ml_usage())
