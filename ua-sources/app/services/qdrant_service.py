import os
import logging
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
import uuid

logger = logging.getLogger("service.qdrant")

class QdrantService:
    """
    Service for vector search using Qdrant.
    Handles document embeddings storage and semantic search.
    """
    
    def __init__(self):
        self.host = os.getenv("QDRANT_URL", "http://localhost:6333")
        self.client = QdrantClient(url=self.host)
        self.collection_name = "documents_vectors"
        self.vector_size = 384  # all-MiniLM-L6-v2
        
        logger.info(f"Qdrant service initialized: {self.host}")
    
    async def create_collection(self, collection_name: str = None, vector_size: int = None):
        """
        Create a Qdrant collection for storing vectors.
        
        Args:
            collection_name: Name of collection (default: documents_vectors)
            vector_size: Dimension of vectors (default: 384)
        """
        collection_name = collection_name or self.collection_name
        vector_size = vector_size or self.vector_size
        
        try:
            # Check if collection exists
            collections = self.client.get_collections().collections
            if any(c.name == collection_name for c in collections):
                logger.info(f"Collection {collection_name} already exists")
                return
            
            # Create collection
            self.client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(
                    size=vector_size,
                    distance=Distance.COSINE
                )
            )
            logger.info(f"Created Qdrant collection: {collection_name}")
            
        except Exception as e:
            logger.error(f"Failed to create collection: {e}")
            raise
    
    def _ensure_uuid(self, id_val: Any) -> str:
        """
        Ensure ID is a valid Point ID (int or UUID).
        If input is an arbitrary string, hash it to a deterministic UUID.
        """
        if isinstance(id_val, int):
            return id_val
            
        str_id = str(id_val)
        try:
            # Check if already distinct UUID
            uuid.UUID(str_id)
            return str_id
        except ValueError:
            # Generate deterministic UUID from string
            return str(uuid.uuid5(uuid.NAMESPACE_DNS, str_id))

    async def index_document(
        self,
        doc_id: str,
        embedding: List[float],
        metadata: Dict[str, Any] = None
    ):
        """
        Index a single document vector.
        """
        try:
            point_id = self._ensure_uuid(doc_id)
            
            point = PointStruct(
                id=point_id,
                vector=embedding,
                payload=metadata or {}
            )
            
            self.client.upsert(
                collection_name=self.collection_name,
                points=[point]
            )
            
            logger.info(f"Indexed document: {doc_id} (UUID: {point_id})")
            
        except Exception as e:
            logger.error(f"Failed to index document {doc_id}: {e}")
            raise
    
    async def index_batch(
        self,
        documents: List[Dict[str, Any]]
    ):
        """
        Index multiple documents at once.
        """
        try:
            points = []
            for doc in documents:
                point_id = self._ensure_uuid(doc["id"])
                points.append(
                    PointStruct(
                        id=point_id,
                        vector=doc["embedding"],
                        payload=doc.get("metadata", {})
                    )
                )
            
            self.client.upsert(
                collection_name=self.collection_name,
                points=points
            )
            
            logger.info(f"Indexed {len(documents)} documents in batch")
            
        except Exception as e:
            logger.error(f"Batch indexing failed: {e}")
            raise
    
    async def search(
        self,
        query_vector: List[float],
        limit: int = 10,
        filter_conditions: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """
        Search for similar vectors.
        
        Args:
            query_vector: Query embedding
            limit: Number of results
            filter_conditions: Optional filters (e.g., {"category": "news"})
        
        Returns:
            List of results with id, score, and payload
        """
        try:
            # Build filter if provided
            query_filter = None
            if filter_conditions:
                must_conditions = []
                for key, value in filter_conditions.items():
                    must_conditions.append(
                        FieldCondition(
                            key=key,
                            match=MatchValue(value=value)
                        )
                    )
                query_filter = Filter(must=must_conditions)
            
            # Execute search
            results = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_vector,
                limit=limit,
                query_filter=query_filter
            )
            
            # Format results
            formatted_results = [
                {
                    "id": hit.id,
                    "score": hit.score,
                    "metadata": hit.payload
                }
                for hit in results
            ]
            
            logger.info(f"Found {len(formatted_results)} similar documents")
            return formatted_results
            
        except Exception as e:
            logger.error(f"Search failed: {e}")
            return []
    
    async def get_document(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a specific document by ID.
        
        Args:
            doc_id: Document identifier
        
        Returns:
            Document data or None
        """
        try:
            result = self.client.retrieve(
                collection_name=self.collection_name,
                ids=[doc_id]
            )
            
            if result:
                return {
                    "id": result[0].id,
                    "vector": result[0].vector,
                    "metadata": result[0].payload
                }
            return None
            
        except Exception as e:
            logger.error(f"Failed to retrieve document {doc_id}: {e}")
            return None
    
    async def delete_document(self, doc_id: str):
        """Delete a document from the collection."""
        try:
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=[doc_id]
            )
            logger.info(f"Deleted document: {doc_id}")
        except Exception as e:
            logger.error(f"Failed to delete document {doc_id}: {e}")
