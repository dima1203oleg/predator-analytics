from __future__ import annotations


"""
Data Scraper Module

Provides functionality to scrape data from open data portals and save it in various formats.
"""

import csv
from datetime import datetime
from enum import Enum
import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Union
import xml.etree.ElementTree as ET

from bs4 import BeautifulSoup
import requests


# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ScrapeFormat(Enum):
    """Supported output formats for scraped data."""
    CSV = "csv"
    JSON = "json"
    XML = "xml"


class ScrapeResult:
    """Result container for scraping operations."""

    def __init__(self, success: bool, data: Any | None = None, error: str | None = None):
        self.success = success
        self.data = data
        self.error = error
        self.timestamp = datetime.now()
        self.metadata = {}

    def __repr__(self) -> str:
        if self.success:
            return f"ScrapeResult(success=True, records={len(self.data) if isinstance(self.data, list) else 1})"
        return f"ScrapeResult(success=False, error={self.error})"


class DataScraper:
    """Data scraper for open data portals.

    This class provides functionality to:
    - Scrape data from web portals
    - Save data in multiple formats (CSV, JSON, XML)
    - Log all actions for audit purposes
    - Handle errors gracefully
    """

    def __init__(self, user_agent: str = "AtlasTrinity-ETL/1.0"):
        """Initialize the data scraper.

        Args:
            user_agent: User agent string for HTTP requests
        """
        self.user_agent = user_agent
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': self.user_agent,
            'Accept': 'text/html,application/json,application/xml,*/*',
            'Accept-Language': 'en-US,en;q=0.5'
        })
        logger.info("DataScraper initialized")

    def scrape_web_page(self, url: str, timeout: int = 30) -> ScrapeResult:
        """Scrape data from a web page.

        Args:
            url: URL to scrape
            timeout: Request timeout in seconds

        Returns:
            ScrapeResult containing scraped HTML content or error
        """
        try:
            logger.info(f"Scraping URL: {url}")

            response = self.session.get(url, timeout=timeout)
            response.raise_for_status()

            # Parse HTML content
            soup = BeautifulSoup(response.content, 'html.parser')

            result = ScrapeResult(True, data=soup)
            result.metadata = {
                'url': url,
                'status_code': response.status_code,
                'content_type': response.headers.get('Content-Type', 'unknown')
            }

            logger.info(f"Successfully scraped {url}")
            return result

        except requests.exceptions.RequestException as e:
            error_msg = f"Failed to scrape {url}: {e!s}"
            logger.error(error_msg)
            return ScrapeResult(False, error=error_msg)
        except Exception as e:
            error_msg = f"Unexpected error scraping {url}: {e!s}"
            logger.error(error_msg)
            return ScrapeResult(False, error=error_msg)

    def scrape_api_endpoint(self, url: str, params: dict | None = None,
                           timeout: int = 30) -> ScrapeResult:
        """Scrape data from a REST API endpoint.

        Args:
            url: API endpoint URL
            params: Query parameters
            timeout: Request timeout in seconds

        Returns:
            ScrapeResult containing API response data or error
        """
        try:
            logger.info(f"Scraping API endpoint: {url}")

            response = self.session.get(url, params=params, timeout=timeout)
            response.raise_for_status()

            # Try to parse JSON response
            try:
                data = response.json()
            except ValueError:
                # If not JSON, return raw text
                data = response.text

            result = ScrapeResult(True, data=data)
            result.metadata = {
                'url': url,
                'status_code': response.status_code,
                'content_type': response.headers.get('Content-Type', 'unknown')
            }

            logger.info(f"Successfully scraped API endpoint {url}")
            return result

        except requests.exceptions.RequestException as e:
            error_msg = f"Failed to scrape API endpoint {url}: {e!s}"
            logger.error(error_msg)
            return ScrapeResult(False, error=error_msg)
        except Exception as e:
            error_msg = f"Unexpected error scraping API endpoint {url}: {e!s}"
            logger.error(error_msg)
            return ScrapeResult(False, error=error_msg)

    def extract_structured_data(self, html_content: Any,
                               selectors: dict[str, str]) -> ScrapeResult:
        """Extract structured data from HTML content using CSS selectors.

        Args:
            html_content: BeautifulSoup parsed HTML content
            selectors: Dictionary mapping field names to CSS selectors

        Returns:
            ScrapeResult containing extracted data or error
        """
        try:
            if not isinstance(html_content, BeautifulSoup):
                return ScrapeResult(False, error="html_content must be BeautifulSoup object")

            extracted_data = []

            # Find all items matching the main selector
            items = html_content.select(selectors.get('item', ''))

            if not items:
                logger.warning("No items found with provided selectors")
                return ScrapeResult(True, data=[])

            for item in items:
                record = {}

                for field_name, selector in selectors.items():
                    if field_name == 'item':
                        continue

                    elements = item.select(selector)
                    if elements:
                        # Get text content and clean it
                        text_content = elements[0].get_text(strip=True)
                        record[field_name] = text_content
                    else:
                        record[field_name] = None

                extracted_data.append(record)

            result = ScrapeResult(True, data=extracted_data)
            result.metadata = {
                'records_extracted': len(extracted_data),
                'fields': list(selectors.keys())
            }

            logger.info(f"Extracted {len(extracted_data)} records using selectors")
            return result

        except Exception as e:
            error_msg = f"Failed to extract structured data: {e!s}"
            logger.error(error_msg)
            return ScrapeResult(False, error=error_msg)

    def save_data(self, data: list[dict[str, Any]] | dict[str, Any],
                 file_path: str | Path,
                 format: ScrapeFormat = ScrapeFormat.JSON) -> ScrapeResult:
        """Save scraped data to a file in the specified format.

        Args:
            data: Data to save
            file_path: Output file path
            format: Output format (CSV, JSON, XML)

        Returns:
            ScrapeResult with save operation status
        """
        file_path = Path(file_path)

        try:
            logger.info(f"Saving data to {file_path} as {format.value}")

            # Ensure directory exists
            file_path.parent.mkdir(parents=True, exist_ok=True)

            if format == ScrapeFormat.JSON:
                return self._save_json(data, file_path)
            if format == ScrapeFormat.CSV:
                return self._save_csv(data, file_path)
            if format == ScrapeFormat.XML:
                return self._save_xml(data, file_path)
            return ScrapeResult(False, error=f"Unsupported format: {format}")

        except Exception as e:
            error_msg = f"Failed to save data to {file_path}: {e!s}"
            logger.error(error_msg)
            return ScrapeResult(False, error=error_msg)

    def _save_json(self, data: list[dict[str |  Any], dict[str, Any]],
                  file_path: Path) -> ScrapeResult:
        """Save data as JSON file."""
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)

            result = ScrapeResult(True, data=str(file_path))
            result.metadata = {
                'format': 'json',
                'file_size': file_path.stat().st_size
            }

            logger.info(f"Successfully saved JSON data to {file_path}")
            return result

        except Exception as e:
            error_msg = f"Failed to save JSON data: {e!s}"
            logger.error(error_msg)
            return ScrapeResult(False, error=error_msg)

    def _save_csv(self, data: list[dict[str |  Any], dict[str, Any]],
                 file_path: Path) -> ScrapeResult:
        """Save data as CSV file."""
        try:
            if isinstance(data, dict):
                data = [data]

            if not data:
                return ScrapeResult(False, error="No data to save as CSV")

            # Get fieldnames from first record
            fieldnames = list(data[0].keys())

            with open(file_path, 'w', encoding='utf-8', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(data)

            result = ScrapeResult(True, data=str(file_path))
            result.metadata = {
                'format': 'csv',
                'records': len(data),
                'file_size': file_path.stat().st_size
            }

            logger.info(f"Successfully saved CSV data to {file_path}")
            return result

        except Exception as e:
            error_msg = f"Failed to save CSV data: {e!s}"
            logger.error(error_msg)
            return ScrapeResult(False, error=error_msg)

    def _save_xml(self, data: list[dict[str |  Any], dict[str, Any]],
                 file_path: Path) -> ScrapeResult:
        """Save data as XML file."""
        try:
            if isinstance(data, dict):
                data = [data]

            if not data:
                return ScrapeResult(False, error="No data to save as XML")

            # Create root element
            root = ET.Element('data')

            for i, record in enumerate(data):
                item = ET.SubElement(root, 'item', {'id': str(i)})

                for key, value in record.items():
                    if value is not None:
                        field = ET.SubElement(item, key)
                        field.text = str(value)

            # Create XML tree and save
            tree = ET.ElementTree(root)
            ET.indent(tree, space='  ', level=0)
            tree.write(file_path, encoding='utf-8', xml_declaration=True)

            result = ScrapeResult(True, data=str(file_path))
            result.metadata = {
                'format': 'xml',
                'records': len(data),
                'file_size': file_path.stat().st_size
            }

            logger.info(f"Successfully saved XML data to {file_path}")
            return result

        except Exception as e:
            error_msg = f"Failed to save XML data: {e!s}"
            logger.error(error_msg)
            return ScrapeResult(False, error=error_msg)

    def scrape_and_save(self, url: str, output_path: str |  Path,
                       format: ScrapeFormat = ScrapeFormat.JSON,
                       selectors: dict[str, str | None] = None) -> ScrapeResult:
        """Convenience method to scrape a web page and save the extracted data.

        Args:
            url: URL to scrape
            output_path: Output file path
            format: Output format
            selectors: CSS selectors for structured data extraction

        Returns:
            ScrapeResult with overall operation status
        """
        try:
            # Step 1: Scrape the web page
            scrape_result = self.scrape_web_page(url)

            if not scrape_result.success:
                return scrape_result

            # Step 2: Extract structured data if selectors provided
            if selectors:
                extract_result = self.extract_structured_data(scrape_result.data, selectors)

                if not extract_result.success:
                    return extract_result

                data = extract_result.data
            else:
                # If no selectors, try to extract all text content
                data = [{'content': scrape_result.data.get_text(strip=True)}]

            # Step 3: Save the data
            save_result = self.save_data(data, output_path, format)

            if not save_result.success:
                return save_result

            # Combine metadata
            combined_result = ScrapeResult(True, data=str(output_path))
            combined_result.metadata = {
                'scrape': scrape_result.metadata,
                'extract': extract_result.metadata if selectors else None,
                'save': save_result.metadata
            }

            logger.info(f"Successfully completed scrape-and-save operation: {url} -> {output_path}")
            return combined_result

        except Exception as e:
            error_msg = f"Scrape-and-save operation failed: {e!s}"
            logger.error(error_msg)
            return ScrapeResult(False, error=error_msg)

    def get_scraping_stats(self) -> dict[str, Any]:
        """Get statistics about scraping operations.

        Returns:
            Dictionary containing scraping statistics
        """
        return {
            'user_agent': self.user_agent,
            'session_active': bool(self.session),
            'timestamp': datetime.now().isoformat()
        }


def create_data_scraper(user_agent: str = "AtlasTrinity-ETL/1.0") -> DataScraper:
    """Factory function to create a DataScraper instance.

    Args:
        user_agent: User agent string for HTTP requests

    Returns:
        DataScraper instance
    """
    return DataScraper(user_agent)
