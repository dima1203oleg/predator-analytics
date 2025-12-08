import sys
import os
import logging
from datetime import datetime

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'ua-sources')))

from opensearchpy import OpenSearch, helpers
from sqlalchemy import create_engine, text
from app.core.naming import NamingPolicy, DataLayerType

# Config
PG_URL = "postgresql://predator:predator_password@localhost:5432/predator_db"
OS_HOST = "localhost"
OS_PORT = 9200
BASE_NAME = "customs"
TARGET_VERSION = 2

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger("ReindexJob")

def get_opensearch_client():
    return OpenSearch(
        hosts=[{'host': OS_HOST, 'port': OS_PORT}],
        http_compress=True,
        use_ssl=False,
        verify_certs=False,
        ssl_assert_hostname=False,
        ssl_show_warn=False
    )

def main():
    logger.info("🚀 Starting Zero-Downtime Reindexing (Migration to v2)")
    
    # 1. Resolve Names
    new_index_name = NamingPolicy.get_index_name(BASE_NAME, TARGET_VERSION, DataLayerType.OPENSEARCH)
    alias_name = NamingPolicy.get_alias_name(BASE_NAME, DataLayerType.OPENSEARCH)
    
    logger.info(f"📍 Target Index: {new_index_name}")
    logger.info(f"📍 Target Alias: {alias_name}")
    
    client = get_opensearch_client()
    
    # 2. Create v2 Index (with Improved Mapping: N-Grams)
    if client.indices.exists(index=new_index_name):
        logger.warning(f"⚠️ Index {new_index_name} already exists! Deleting to start fresh...")
        client.indices.delete(index=new_index_name)
        
    settings = {
        "settings": {
            "index.max_ngram_diff": 10, # Allow difference between min_gram and max_gram
            "number_of_shards": 1,
            "analysis": {
                "analyzer": {
                    "ngram_analyzer": {
                        "tokenizer": "ngram_tokenizer",
                        "filter": ["lowercase"]
                    }
                },
                "tokenizer": {
                    "ngram_tokenizer": {
                        "type": "ngram",
                        "min_gram": 3,
                        "max_gram": 8,
                        "token_chars": ["letter", "digit"]
                    }
                }
            }
        },
        "mappings": {
            "properties": {
                "опис_товару": {
                    "type": "text", 
                    "analyzer": "standard", # Standard for full words
                    "fields": {
                        "ngram": {"type": "text", "analyzer": "ngram_analyzer"} # Subfield for partials
                    }
                },
                "код_товару": {"type": "keyword"},
                "торгуюча_країна": {"type": "keyword"},
                "митниця_оформлення": {"type": "keyword"},
                "номер_митної_декларації": {"type": "keyword"},
                "ingested_at": {"type": "date"}
            }
        }
    }
    
    client.indices.create(index=new_index_name, body=settings)
    logger.info(f"✅ Created index '{new_index_name}' with N-Gram analyzer")
    
    # 3. Ingest Data from Postgres (Truth)
    pg_engine = create_engine(PG_URL)
    logger.info("📥 Reading from PostgreSQL...")
    
    with pg_engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM ua_customs_imports"))
        columns = result.keys()
        rows = result.fetchall()
        
    logger.info(f"🔄 Indexing {len(rows)} documents to '{new_index_name}'...")
    
    actions = []
    for row in rows:
        doc = dict(zip(columns, row))
        if 'ingested_at' in doc and doc['ingested_at']:
             doc['ingested_at'] = doc['ingested_at'].isoformat()
        
        actions.append({"_index": new_index_name, "_source": doc})
        
    success, failed = helpers.bulk(client, actions, stats_only=True)
    logger.info(f"✅ Indexed {success} docs. Failed: {failed}")
    
    # Refresh to make searchable
    client.indices.refresh(index=new_index_name)
    
    # 4. Atomic Alias Swap
    logger.info("⚡ Performing Atomic Alias Swap...")
    
    # Check if alias exists and where it points
    alias_exists = client.indices.exists_alias(name=alias_name)
    current_indices = list(client.indices.get_alias(name=alias_name).keys()) if alias_exists else []
    
    logger.info(f"ℹ️ Alias '{alias_name}' currently points to: {current_indices}")
    
    alias_actions = []
    # Remove from old indices
    for old_idx in current_indices:
        alias_actions.append({"remove": {"index": old_idx, "alias": alias_name}})
        
    # Add to new index
    alias_actions.append({"add": {"index": new_index_name, "alias": alias_name}})
    
    client.indices.update_aliases(body={"actions": alias_actions})
    
    logger.info(f"✅ SUCCESS! Alias '{alias_name}' now points to '{new_index_name}'.")
    logger.info("🎉 Zero-Downtime Migration Complete.")

if __name__ == "__main__":
    main()
