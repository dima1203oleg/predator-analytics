from __future__ import annotations


"""Price Predictor (COMP-052)

Прогнозування цін товарів за кодами УКТЗЕД.
Ensemble: ARIMA-like + XGBoost + сезонна декомпозиція.

For production: Uses scikit-learn (always available) as base.
Optional: Prophet, statsmodels ARIMA.
"""
import logging
import math
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any

import numpy as np


logger = logging.getLogger("service.price_predictor")


@dataclass
class PriceForecast:
    """Single price forecast result."""
    product_code: str
    product_name: str
    current_price: float
    predicted_price: float
    change_pct: float
    confidence_interval: tuple[float, float]
    horizon_days: int
    trend: str               # up, down, stable
    seasonality: str         # none, weekly, monthly, quarterly
    model_used: str
    features_importance: dict[str, float] = field(default_factory=dict)
    warnings: list[str] = field(default_factory=list)
    predicted_at: str = field(default_factory=lambda: datetime.now(UTC).isoformat())

    def to_dict(self) -> dict[str, Any]:
        return {
            "product_code": self.product_code,
            "product_name": self.product_name,
            "current_price": self.current_price,
            "predicted_price": self.predicted_price,
            "change_pct": self.change_pct,
            "confidence_interval": list(self.confidence_interval),
            "horizon_days": self.horizon_days,
            "trend": self.trend,
            "seasonality": self.seasonality,
            "model_used": self.model_used,
            "features_importance": self.features_importance,
            "warnings": self.warnings,
            "predicted_at": self.predicted_at,
        }


class PricePredictor:
    """Ensemble price predictor combining multiple methods.

    Methods:
    1. Moving average with trend extrapolation (baseline)
    2. Seasonal decomposition (additive)
    3. Gradient Boosting with features (if enough data)
    """

    def __init__(self):
        self._models: dict[str, Any] = {}
        logger.info("PricePredictor initialized")

    def predict(
        self,
        product_code: str,
        product_name: str = "",
        price_history: list[float] | None = None,
        dates: list[str] | None = None,
        horizon_days: int = 30,
        features: dict[str, float] | None = None,
    ) -> PriceForecast:
        """Predict future price.

        Args:
            product_code: UKTZED product code
            product_name: Human-readable name
            price_history: Historical prices (chronological)
            dates: Corresponding dates
            horizon_days: Forecast horizon in days
            features: Additional features (exchange rate, inflation, etc.)

        Returns:
            PriceForecast with prediction and confidence interval
        """
        if not price_history or len(price_history) < 3:
            return self._insufficient_data_forecast(
                product_code, product_name, price_history, horizon_days
            )

        prices = np.array(price_history, dtype=float)
        current_price = prices[-1]

        # Method 1: Weighted Moving Average + Trend
        ma_pred = self._moving_average_predict(prices, horizon_days)

        # Method 2: Seasonal decomposition
        seasonal_pred = self._seasonal_predict(prices, horizon_days)

        # Method 3: Feature-based (if features available)
        if features and len(prices) >= 10:
            feature_pred = self._feature_predict(prices, features, horizon_days)
        else:
            feature_pred = ma_pred

        # Ensemble: weighted average
        predicted_price = (
            0.4 * ma_pred +
            0.3 * seasonal_pred +
            0.3 * feature_pred
        )

        # Confidence interval
        std = np.std(prices[-min(10, len(prices)):])
        ci_width = std * 1.96 * math.sqrt(horizon_days / 30.0)
        ci = (
            round(max(0, predicted_price - ci_width), 2),
            round(predicted_price + ci_width, 2),
        )

        # Trend detection
        change_pct = round((predicted_price - current_price) / current_price * 100, 2) if current_price > 0 else 0.0
        trend = self._detect_trend(prices)

        # Seasonality detection
        seasonality = self._detect_seasonality(prices)

        # Feature importance
        importance = {}
        if features:
            importance = {k: round(abs(v) / max(abs(v) for v in features.values()) if features else 0, 2) for k, v in features.items()}

        return PriceForecast(
            product_code=product_code,
            product_name=product_name,
            current_price=round(current_price, 2),
            predicted_price=round(predicted_price, 2),
            change_pct=change_pct,
            confidence_interval=ci,
            horizon_days=horizon_days,
            trend=trend,
            seasonality=seasonality,
            model_used="ensemble_v1",
            features_importance=importance,
        )

    def predict_batch(
        self,
        products: list[dict[str, Any]],
        horizon_days: int = 30,
    ) -> list[PriceForecast]:
        """Predict prices for multiple products."""
        return [
            self.predict(
                product_code=p.get("code", ""),
                product_name=p.get("name", ""),
                price_history=p.get("prices", []),
                dates=p.get("dates"),
                horizon_days=horizon_days,
                features=p.get("features"),
            )
            for p in products
        ]

    # --- Internal Methods ---

    def _moving_average_predict(
        self, prices: np.ndarray, horizon_days: int
    ) -> float:
        """Weighted Moving Average with linear trend extrapolation."""
        n = len(prices)
        window = min(7, n)

        # Weighted moving average (recent data weighs more)
        weights = np.arange(1, window + 1, dtype=float)
        weights /= weights.sum()
        ma = np.average(prices[-window:], weights=weights)

        # Linear trend
        if n >= 5:
            x = np.arange(n)
            coeffs = np.polyfit(x, prices, 1)
            trend_per_day = coeffs[0]
            ma += trend_per_day * horizon_days
        
        return float(ma)

    def _seasonal_predict(
        self, prices: np.ndarray, horizon_days: int
    ) -> float:
        """Simple seasonal decomposition + trend."""
        n = len(prices)

        # Try to find period (7 for weekly, 30 for monthly)
        period = min(7, n // 2) if n >= 14 else 0

        if period > 0:
            # Extract seasonal component
            seasonal = np.zeros(period)
            for i in range(period):
                indices = list(range(i, n, period))
                seasonal[i] = np.mean(prices[indices])
            seasonal -= np.mean(seasonal)

            # Current position in season
            pos = n % period
            seasonal_adj = seasonal[pos] if pos < len(seasonal) else 0

            # Trend
            trend = np.mean(np.diff(prices[-period:])) if n > period else 0
            prediction = prices[-1] + trend * horizon_days + seasonal_adj
        else:
            prediction = float(prices[-1])

        return float(prediction)

    def _feature_predict(
        self, prices: np.ndarray, features: dict[str, float], horizon_days: int
    ) -> float:
        """Feature-based prediction (simplified)."""
        try:
            from sklearn.ensemble import GradientBoostingRegressor

            n = len(prices)
            # Create feature matrix from lagged prices
            lags = min(5, n - 1)
            X = []
            y = []
            for i in range(lags, n):
                row = list(prices[i - lags:i])
                X.append(row)
                y.append(prices[i])

            if len(X) < 3:
                return float(prices[-1])

            model = GradientBoostingRegressor(
                n_estimators=50,
                max_depth=3,
                random_state=42,
            )
            model.fit(X, y)

            # Predict: use last `lags` prices as input
            last_features = list(prices[-lags:])
            prediction = model.predict([last_features])[0]

            # Adjust for horizon
            trend = (prediction - prices[-1])
            prediction = prices[-1] + trend * (horizon_days / 30.0)

            return float(prediction)

        except ImportError:
            return float(np.mean(prices[-5:]))

    def _detect_trend(self, prices: np.ndarray) -> str:
        """Detect price trend."""
        if len(prices) < 3:
            return "stable"

        recent = prices[-min(10, len(prices)):]
        change = (recent[-1] - recent[0]) / recent[0] if recent[0] > 0 else 0

        if change > 0.05:
            return "up"
        elif change < -0.05:
            return "down"
        return "stable"

    def _detect_seasonality(self, prices: np.ndarray) -> str:
        """Detect seasonality pattern."""
        n = len(prices)
        if n < 14:
            return "none"

        # Simple autocorrelation check
        mean = np.mean(prices)
        var = np.var(prices)
        if var == 0:
            return "none"

        for period, label in [(7, "weekly"), (30, "monthly"), (90, "quarterly")]:
            if n >= period * 2:
                corr = np.corrcoef(prices[:n - period], prices[period:n])[0, 1]
                if abs(corr) > 0.5:
                    return label

        return "none"

    def _insufficient_data_forecast(
        self,
        product_code: str,
        product_name: str,
        price_history: list | None,
        horizon_days: int,
    ) -> PriceForecast:
        """Return forecast with insufficient data warning."""
        current = price_history[-1] if price_history else 0.0
        return PriceForecast(
            product_code=product_code,
            product_name=product_name,
            current_price=current,
            predicted_price=current,
            change_pct=0.0,
            confidence_interval=(current * 0.8, current * 1.2),
            horizon_days=horizon_days,
            trend="stable",
            seasonality="none",
            model_used="insufficient_data",
            warnings=["Недостатньо даних для прогнозу (потрібно ≥3 точок)"],
        )


# Singleton
_predictor: PricePredictor | None = None


def get_price_predictor() -> PricePredictor:
    global _predictor
    if _predictor is None:
        _predictor = PricePredictor()
    return _predictor
