from functools import lru_cache

from .cluster_manager import Neo4jClusterManager


@lru_cache
def get_neo4j_cluster_manager() -> Neo4jClusterManager:
    return Neo4jClusterManager()

__all__ = ["Neo4jClusterManager", "get_neo4j_cluster_manager"]
