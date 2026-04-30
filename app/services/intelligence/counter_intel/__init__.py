from functools import lru_cache

from .psychographic_profiler import PsychographicProfiler


@lru_cache
def get_psychographic_profiler() -> PsychographicProfiler:
    return PsychographicProfiler()

__all__ = ["PsychographicProfiler", "get_psychographic_profiler"]
