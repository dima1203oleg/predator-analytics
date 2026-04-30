from functools import lru_cache

from .deepfake_detector import DeepfakeDetector


@lru_cache
def get_deepfake_detector() -> DeepfakeDetector:
    return DeepfakeDetector()

__all__ = ["DeepfakeDetector", "get_deepfake_detector"]
