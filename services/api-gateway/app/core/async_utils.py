"""
Async utilities for Celery tasks
Safe execution of async code in synchronous contexts
"""
import asyncio
from typing import Coroutine, Any, TypeVar
from functools import wraps
import logging

logger = logging.getLogger(__name__)

T = TypeVar("T")

def run_async(coro: Coroutine[Any, Any, T]) -> T:
    """
    Safely run an async coroutine in a synchronous context.
    Handles existing loops and creates new ones if needed.
    Best performance for Celery tasks.
    """
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        # We are inside a running loop (e.g. nested call?)
        # This is dangerous in Celery prefork, but handled here
        logger.warning("Detected running loop inside sync task, using thread runner")
        # For nested execution, we must use a thread to avoid blocking the loop
        from concurrent.futures import ThreadPoolExecutor
        with ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(asyncio.run, coro)
            return future.result()
    else:
        # Standard case for Celery: new loop
        return asyncio.run(coro)


def async_task(func):
    """
    Decorator to wrap sync Celery task that calls async code

    Usage:
    @shared_task
    @async_task
    async def my_task():
        await something()
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        # Allow defining task as async def
        if asyncio.iscoroutinefunction(func):
            return asyncio.run(func(*args, **kwargs))
        return func(*args, **kwargs)
    return wrapper
