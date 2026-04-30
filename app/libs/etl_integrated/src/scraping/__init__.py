from __future__ import annotations

"""
Scraping Module

Provides data scraping functionality for the ETL pipeline.
"""

from .data_scraper import DataScraper, ScrapeFormat, ScrapeResult, create_data_scraper

__all__ = ["DataScraper", "ScrapeFormat", "ScrapeResult", "create_data_scraper"]
