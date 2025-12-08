from opensearchpy import OpenSearch, helpers
from sqlalchemy import create_engine, text
import logging

# Config
PG_URL = "postgresql://predator:predator_password@localhost:5432/predator_db"
OS_HOST = "localhost"
OS_PORT = 9200
INDEX_NAME = "customs-v1"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ETL-Search")

def get_opensearch_client():
    return OpenSearch(
        hosts=[{'host': OS_HOST, 'port': OS_PORT}],
        http_compress=True,
        use_ssl=False,
        verify_certs=False,
        ssl_assert_hostname=False,
        ssl_show_warn=False
    )

def create_index(client):
    if not client.indices.exists(index=INDEX_NAME):
        settings = {
            "settings": {
                "number_of_shards": 1,
                "number_of_replicas": 0
            },
            "mappings": {
                "properties": {
                    "опис_товару": {"type": "text", "analyzer": "standard"},
                    "код_товару": {"type": "keyword"},
                    "торгуюча_країна": {"type": "keyword"},
                    "митниця_оформлення": {"type": "keyword"},
                    "номер_митної_декларації": {"type": "keyword"},
                    "ingested_at": {"type": "date"}
                }
            }
        }
        client.indices.create(index=INDEX_NAME, body=settings)
        logger.info(f"✅ Created index '{INDEX_NAME}'")
    else:
        logger.info(f"ℹ️ Index '{INDEX_NAME}' already exists")

def run_sync():
    os_client = get_opensearch_client()
    create_index(os_client)
    
    pg_engine = create_engine(PG_URL)
    
    logger.info("📥 Reading from PostgreSQL...")
    with pg_engine.connect() as conn:
        # Fetch all data (1000 rows is small enough for memory)
        result = conn.execute(text("SELECT * FROM ua_customs_imports"))
        columns = result.keys()
        rows = result.fetchall()
        
    logger.info(f"🔄 Indexing {len(rows)} documents to OpenSearch...")
    
    actions = []
    for row in rows:
        # Convert row to dict
        doc = dict(zip(columns, row))
        
        # Handle date serialization if needed, or remove non-serializable fields
        if 'ingested_at' in doc and doc['ingested_at']:
             doc['ingested_at'] = doc['ingested_at'].isoformat()
             
        action = {
            "_index": INDEX_NAME,
            "_source": doc
        }
        actions.append(action)
        
    # Bulk insert
    success, failed = helpers.bulk(os_client, actions, stats_only=True)
    logger.info(f"✅ Indexed: {success}, Failed: {failed}")
    
    # Refresh to make visible immediately
    os_client.indices.refresh(index=INDEX_NAME)

if __name__ == "__main__":
    run_sync()
