"""Geospatial розрахунки для аналізу маршрутних аномалій.

Модуль для розрахунку відстаней та виявлення аномалій в маршрутах.
"""

from __future__ import annotations

import logging
import math
from dataclasses import dataclass
from typing import Any

logger = logging.getLogger(__name__)


@dataclass
class Coordinates:
    """Географічні координати."""
    latitude: float
    longitude: float


@dataclass
class RouteMetrics:
    """Метрики маршруту."""
    actual_distance_km: float
    optimal_distance_km: float
    detour_ratio: float
    is_suspicious: bool


class GeospatialCalculator:
    """Калькулятор геопросторових метрик."""

    @staticmethod
    def haversine_distance(
        coord1: Coordinates,
        coord2: Coordinates,
    ) -> float:
        """Розрахувати відстань між двома точками за формулою Haversine.
        
        Args:
            coord1: Перша точка (широта, довгота)
            coord2: Друга точка (широта, довгота)
            
        Returns:
            Відстань в кілометрах
        """
        # Радіус Землі в км
        R = 6371.0
        
        # Конвертація в радіани
        lat1 = math.radians(coord1.latitude)
        lon1 = math.radians(coord1.longitude)
        lat2 = math.radians(coord2.latitude)
        lon2 = math.radians(coord2.longitude)
        
        # Різниці координат
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        # Формула Haversine
        a = (
            math.sin(dlat / 2) ** 2
            + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        distance = R * c
        return distance

    @staticmethod
    def calculate_detour_ratio(
        actual_distance: float,
        optimal_distance: float,
    ) -> float:
        """Розрахувати коефіцієнт обходу.
        
        Args:
            actual_distance: Фактична відстань
            optimal_distance: Оптимальна відстань
            
        Returns:
            Коефіцієнт обходу (actual / optimal)
        """
        if optimal_distance == 0:
            return 0.0
        return actual_distance / optimal_distance

    @staticmethod
    def is_route_suspicious(
        detour_ratio: float,
        threshold: float = 2.0,
    ) -> bool:
        """Визначити чи є маршрут підозрілим.
        
        Args:
            detour_ratio: Коефіцієнт обходу
            threshold: Поріг підозрілості (за замовчуванням 2.0)
            
        Returns:
            True якщо маршрут підозрілий
        """
        return detour_ratio > threshold

    def analyze_route(
        self,
        origin: Coordinates,
        destination: Coordinates,
        actual_distance: float | None = None,
    ) -> RouteMetrics:
        """Проаналізувати маршрут на аномалії.
        
        Args:
            origin: Точка відправлення
            destination: Точка призначення
            actual_distance: Фактична відстань (якщо None, розраховується)
            
        Returns:
            Метрики маршруту
        """
        # Розраховуємо оптимальну відстань
        optimal_distance = self.haversine_distance(origin, destination)
        
        # Якщо фактична відстань не надана, використовуємо оптимальну
        if actual_distance is None:
            actual_distance = optimal_distance
        
        # Розраховуємо коефіцієнт обходу
        detour_ratio = self.calculate_detour_ratio(actual_distance, optimal_distance)
        
        # Визначаємо чи підозрілий
        is_suspicious = self.is_route_suspicious(detour_ratio)
        
        return RouteMetrics(
            actual_distance_km=actual_distance,
            optimal_distance_km=optimal_distance,
            detour_ratio=detour_ratio,
            is_suspicious=is_suspicious,
        )


class CustomsPostGeoService:
    """Сервіс для отримання геоданих митних постів."""

    def __init__(self):
        self.calculator = GeospatialCalculator()
        # Кеш координат митних постів
        self._coordinates_cache: dict[str, Coordinates] = {}

    def get_customs_post_coordinates(
        self,
        post_code: str,
    ) -> Coordinates | None:
        """Отримати координати митного посту.
        
        Args:
            post_code: Код митного посту
            
        Returns:
            Координати або None якщо не знайдено
        """
        # TODO: Отримувати з БД або API
        # Тимчасові дані для демонстрації
        known_posts = {
            "UA-KH-001": Coordinates(50.4501, 30.5234),  # Київ
            "UA-OD-001": Coordinates(46.4825, 30.7233),  # Одеса
            "UA-LV-001": Coordinates(49.8397, 24.0297),  # Львів
            "UA-KH-002": Coordinates(49.9808, 36.2527),  # Харків
        }
        
        return known_posts.get(post_code)

    def calculate_route_anomaly(
        self,
        origin_post_code: str,
        destination_post_code: str,
        actual_distance: float | None = None,
    ) -> RouteMetrics:
        """Розрахувати аномалію маршруту між митними постами.
        
        Args:
            origin_post_code: Код посту відправлення
            destination_post_code: Код посту призначення
            actual_distance: Фактична відстань
            
        Returns:
            Метрики маршруту
        """
        origin_coords = self.get_customs_post_coordinates(origin_post_code)
        dest_coords = self.get_customs_post_coordinates(destination_post_code)
        
        if not origin_coords or not dest_coords:
            logger.warning(f"Не знайдено координати для постів: {origin_post_code}, {destination_post_code}")
            return RouteMetrics(
                actual_distance_km=0.0,
                optimal_distance_km=0.0,
                detour_ratio=0.0,
                is_suspicious=False,
            )
        
        return self.calculator.analyze_route(origin_coords, dest_coords, actual_distance)


# Синглтон
_geospatial_service: CustomsPostGeoService | None = None


def get_geospatial_service() -> CustomsPostGeoService:
    """Отримати синглтон інстанс геопросторового сервісу."""
    global _geospatial_service
    if _geospatial_service is None:
        _geospatial_service = CustomsPostGeoService()
    return _geospatial_service
