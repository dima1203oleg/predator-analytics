import asyncio
import logging
import os
import sys

# Configure logging to stdout
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)8s] %(message)s (%(filename)s:%(lineno)s)")

# Ensure project root is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.discovery.engine import APIDiscoveryEngine
import yaml

# Set model to mistral/codestral-latest
os.environ["LITELLM_MODEL"] = "mistral/codestral-latest"

async def main():
    engine = APIDiscoveryEngine(
        neo4j_uri=os.getenv("NEO4J_URI", "bolt://localhost:7687"),
        neo4j_user=os.getenv("NEO4J_USER", "neo4j"),
        neo4j_password=os.getenv("NEO4J_PASSWORD", "password")
    )
    
    # Load first source from manifest
    manifest_path = os.path.join(os.path.dirname(__file__), "config", "global_discovery_manifest.yaml")
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = yaml.safe_load(f)
        
    first_category = manifest["categories"][0]
    first_source = first_category["sources"][0]
    
    # Enrich with category info
    first_source["category"] = first_category["name"]
    
    print(f"Testing engine on source: {first_source['name']}")
    
    await engine._process_discovered_source(first_source)
    
    await engine.close()

if __name__ == "__main__":
    asyncio.run(main())
