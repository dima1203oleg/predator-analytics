from __future__ import annotations


#!/usr/bin/env python3
"""
Open Data Portal Scraper

Main script to automate scraping, parsing, and saving data from open data portals.
"""

from pathlib import Path
import sys


# Add the ETL module to Python path
etl_module_path = Path(__file__).parent / "src"
sys.path.insert(0, str(etl_module_path))

from distribution.data_distributor import DataDistributor, DistributionTarget
from parsing.data_parser import DataFormat, DataParser
from scraping.data_scraper import DataScraper, ScrapeFormat
from transformation.data_transformer import DataTransformer


def main():
    """Main function to demonstrate the scraping pipeline."""
    print("=== AtlasTrinity Open Data Portal Scraper ===")

    # Example configuration
    DATA_DIR = Path(__file__).parent.parent / "data" / "etl" / "scraped_data"
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    config = {
        "output_dir": str(DATA_DIR),
        "sample_url": "https://jsonplaceholder.typicode.com/users",  # Example API
        "sample_selectors": {
            "item": "div.user-card",
            "name": "h2.user-name",
            "email": "p.user-email",
            "phone": "p.user-phone",
        },
    }

    # Initialize components
    scraper = DataScraper(user_agent="AtlasTrinity-ETL/1.0")
    parser = DataParser()
    transformer = DataTransformer()
    distributor = DataDistributor()

    print(f"Scraper initialized: {scraper.get_scraping_stats()}")
    print(f"Supported formats: {parser.get_supported_formats()}")
    print(f"Enabled distribution targets: {[t.value for t in distributor.get_enabled_targets()]}")

    # Example 1: Scrape API endpoint and save as JSON
    print("\n--- Example 1: API Scraping ---")
    api_result = scraper.scrape_api_endpoint(config["sample_url"])

    if api_result.success:
        print(f"Successfully scraped API: {len(api_result.data)} records")

        # Save as JSON
        json_path = Path(config["output_dir"]) / "api_data.json"
        save_result = scraper.save_data(api_result.data, json_path, ScrapeFormat.JSON)

        if save_result.success:
            print(f"Saved to: {save_result.data}")

            # Parse the saved data
            parse_result = parser.parse(json_path, DataFormat.JSON)
            if parse_result.success:
                print(f"Parsed {len(parse_result.data)} records from JSON")

                # Transform to unified schema (this would need mapping for real data)
                # For demo, we'll just show the transformation capability
                print("Data ready for transformation and distribution")
    else:
        print(f"API scraping failed: {api_result.error}")

    # Example 2: Scrape web page with structured extraction
    print("\n--- Example 2: Web Scraping with Selectors ---")

    # Note: This is a placeholder example. In a real scenario, you would:
    # 1. Use a real open data portal URL
    # 2. Define appropriate CSS selectors for the target site
    # 3. Handle pagination if needed

    web_url = "https://example.com/open-data"  # Replace with real open data portal
    selectors = config["sample_selectors"]

    scrape_save_result = scraper.scrape_and_save(
        url=web_url,
        output_path=Path(config["output_dir"]) / "web_data.csv",
        format=ScrapeFormat.CSV,
        selectors=selectors,
    )

    if scrape_save_result.success:
        print(f"Successfully scraped and saved: {scrape_save_result.data}")
        print(f"Metadata: {scrape_save_result.metadata}")
    else:
        print(f"Web scraping failed: {scrape_save_result.error}")

    # Example 3: Full ETL pipeline demonstration
    print("\n--- Example 3: Full ETL Pipeline ---")

    # Create sample data that matches our unified schema
    sample_data = [
        {"name": "John Doe", "age": 30, "city": "New York", "score": 85.5},
        {"name": "Jane Smith", "age": 25, "city": "Los Angeles", "score": 92.3},
    ]

    # Save sample data
    sample_path = Path(config["output_dir"]) / "sample_data.json"
    save_result = scraper.save_data(sample_data, sample_path, ScrapeFormat.JSON)

    if save_result.success:
        print(f"Created sample data: {save_result.data}")

        # Parse the data
        parse_result = parser.parse(sample_path, DataFormat.JSON)
        if parse_result.success:
            print("Parsed data successfully")

            # Transform to unified schema
            transform_result = transformer.transform_from_dataframe(parse_result.data, source_format="json")

            if transform_result.success:
                print(f"Transformed {len(transform_result.data)} records")

                # Distribute the data
                dist_results = distributor.distribute(
                    transform_result.data,
                    targets=[DistributionTarget.MINIO],  # Just MinIO for demo
                )

                for dist_result in dist_results:
                    if dist_result.success:
                        print(f"Successfully distributed to {dist_result.target}")
                    else:
                        print(f"Distribution to {dist_result.target} failed: {dist_result.error}")
            else:
                print(f"Transformation failed: {transform_result.error}")
        else:
            print(f"Parsing failed: {parse_result.error}")

    print("\n=== Scraping Pipeline Complete ===")
    from scraping.data_scraper import LOG_DIR

    print(f"Check {LOG_DIR / 'scraping_audit.log'} for detailed logs")


if __name__ == "__main__":
    main()
