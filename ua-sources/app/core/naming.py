"""
Predator Data Layer - Naming Conventions & Versioning Policy.
Centralized logic for naming indexes, collections, and buckets to ensure
consistency across ETL, Search, and ML pipelines.
"""
from enum import Enum
from typing import Optional

class DataLayerType(Enum):
    OPENSEARCH = "os"
    QDRANT = "qdrant"
    POSTGRES_TABLE = "pg"
    MINIO_BUCKET = "s3"

class NamingPolicy:
    
    @staticmethod
    def get_index_name(base_name: str, version: int = 1, type: DataLayerType = DataLayerType.OPENSEARCH) -> str:
        """
        Generate canonical versioned name for an index/collection.
        
        Args:
            base_name: Functional name (e.g., 'customs', 'news')
            version: Integer version (e.g., 1)
            type: Target system
            
        Returns:
            Formatted name string
            
        Examples:
            OpenSearch -> "customs-v1"
            Qdrant -> "customs_vectors_v1"
            Postgres -> "ua_customs_v1" (if partition strategy used)
        """
        clean_name = base_name.lower().replace(" ", "_")
        
        if type == DataLayerType.OPENSEARCH:
            return f"{clean_name.replace('_', '-')}-v{version}"
            
        if type == DataLayerType.QDRANT:
            return f"{clean_name}_vectors_v{version}"
            
        if type == DataLayerType.POSTGRES_TABLE:
            # Tables usually aren't versioned by name, but schemas or partitions are.
            # However, for snapshots/staging tables:
            return f"{clean_name}_v{version}"
            
        if type == DataLayerType.MINIO_BUCKET:
            # S3 buckets must be DNS compliant (dashes, no underscores)
            return f"predator-{clean_name.replace('_', '-')}-v{version}"
            
        return f"{clean_name}-v{version}"

    @staticmethod
    def get_alias_name(base_name: str, type: DataLayerType) -> str:
        """
        Get the stable alias name that points to the active version.
        Applications should query this, not the versioned name directly.
        """
        clean_name = base_name.lower().replace(" ", "_")
        
        if type == DataLayerType.OPENSEARCH:
            return clean_name.replace('_', '-')
            
        if type == DataLayerType.QDRANT:
            return f"{clean_name}_vectors"
            
        return clean_name

    @staticmethod
    def resolve_minio_path(bucket_role: str, filename: str, contour: str = "prod") -> str:
        """
        Resolve object storage path based on contour.
        Ex: s3://raw-imports/prod/2024/file.xlsx
        """
        return f"{bucket_role}/{contour}/{filename}"

# --- Usage Example ---
if __name__ == "__main__":
    print(f"OS Index: {NamingPolicy.get_index_name('customs', 1, DataLayerType.OPENSEARCH)}")
    print(f"Qdrant Coll: {NamingPolicy.get_index_name('customs', 1, DataLayerType.QDRANT)}")
    print(f"Stable Alias: {NamingPolicy.get_alias_name('customs', DataLayerType.OPENSEARCH)}")
