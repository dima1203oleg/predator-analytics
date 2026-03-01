import logging
from typing import TYPE_CHECKING


if TYPE_CHECKING:
    from app.schemas.canonical import CanonicalDeclaration


logger = logging.getLogger(__name__)


class PostgresDispatcher:
    def sync_fact(self, record: "CanonicalDeclaration"):
        logger.info(f"[POSTGRES] Facts saved for {record.declaration_id}, value: {record.financials.total_value}")
        return True


class GraphDispatcher:
    def sync_relation(self, record: "CanonicalDeclaration"):
        logger.info(f"[GRAPH DB] Linked {record.actor.company_name} to {len(record.items)} items")
        return True


class OpenSearchDispatcher:
    def index_search(self, record: "CanonicalDeclaration"):
        logger.info(f"[OPENSEARCH] Search index updated for items in {record.declaration_id}")
        return True


class QdrantDispatcher:
    def create_embedding(self, record: "CanonicalDeclaration"):
        logger.info(f"[QDRANT] Vectorized {len(record.items)} descriptions for {record.actor.company_name}")
        return True


class RouterEngine:
    """Data Reactor - Routing Protocol.
    Розсікає канонічну модель на 4 компоненти для різних сховищ.
    """

    def __init__(self):
        self.pg = PostgresDispatcher()
        self.graph = GraphDispatcher()
        self.os = OpenSearchDispatcher()
        self.qdrant = QdrantDispatcher()

    def process_and_distribute(self, declaration: "CanonicalDeclaration"):
        """Головний цикл переробки однієї події/рядка."""
        try:
            # 1. Fact storage (Транзакції)
            self.pg.sync_fact(declaration)

            # 2. Graph edges (Зв'язки)
            self.graph.sync_relation(declaration)

            # 3. Text Search (Текстовий індекс)
            self.os.index_search(declaration)

            # 4. Semantic Search (Вектори)
            self.qdrant.create_embedding(declaration)

            # Якщо всі 4 успішні - публікуємо подію DECLARATION_FULLY_ASSIMILATED в Redis/Kafka (mocked for now)
            logger.info(f"🚀 [REACTOR] Declaration {declaration.declaration_id} FULLY ASSIMILATED across 4 dimensions.")
            return True

        except Exception as e:
            logger.exception(f"[REACTOR ENGINE] Split failed for {declaration.declaration_id}: {e!s}")
            return False
