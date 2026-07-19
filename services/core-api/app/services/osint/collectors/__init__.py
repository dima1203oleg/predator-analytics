"""Collectors — Модулі збору даних для Deep Intelligence Engine.

Кожен збирач наслідує BaseCollector та реалізує метод collect().
Класифікація джерел:
  WHITE  — публічні державні реєстри, офіційні API
  GREY   — OSINT (соціальні мережі, scraping, blockchain)
  BLACK  — витоки, darknet, нелегальні бази
"""
from .base import BaseCollector, CollectorResult, DossierQuery

__all__ = ["BaseCollector", "CollectorResult", "DossierQuery"]
