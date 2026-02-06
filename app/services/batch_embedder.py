from __future__ import annotations

import asyncio
from concurrent.futures import Future
import logging
import time
from typing import Any, Dict, List, Tuple


logger = logging.getLogger("predator.ml.batch_embedder")

class BatchEmbeddingService:
    """Background worker for dynamic batch processing of embedding requests.
    Collects individual requests and processes them in batches for maximum throughput.
    """
    def __init__(self, embedding_service, batch_size: int = 32, wait_time: float = 0.05):
        """Initialize batching service.

        Args:
            embedding_service: The underlying EmbeddingService containing the model
            batch_size: Maximum batch size for inference
            wait_time: Maximum time to wait for a full batch in seconds
        """
        self.embedding_service = embedding_service
        self.batch_size = batch_size
        self.wait_time = wait_time
        self.queue = asyncio.Queue()
        self._worker_task = None
        self._running = False

    def start(self):
        """Start the background worker if not already running."""
        if not self._running:
            self._running = True
            self._worker_task = asyncio.create_task(self._process_batches())
            logger.info(f"BatchEmbeddingService started (batch_size={self.batch_size}, wait_time={self.wait_time}s)")

    def stop(self):
        """Stop the background worker."""
        self._running = False
        if self._worker_task:
            self._worker_task.cancel()
            logger.info("BatchEmbeddingService stopped")

    async def embed_async(self, text: str) -> list[float]:
        """Queue a single text for embedding and wait for the result.

        Args:
            text: Input text

        Returns:
            Embedding vector
        """
        if not self._running:
            self.start()

        future = asyncio.get_event_loop().create_future()
        await self.queue.put((text, future))
        return await future

    async def _process_batches(self):
        """Background loop that gathers requests and processes them."""
        while self._running:
            batch_texts = []
            futures = []

            # 1. Wait for the FIRST item in the batch
            try:
                text, future = await asyncio.wait_for(self.queue.get(), timeout=1.0)
                batch_texts.append(text)
                futures.append(future)
            except TimeoutError:
                continue # No requests, keep waiting
            except asyncio.CancelledError:
                break

            # 2. Try to fill the batch until batch_size OR wait_time
            start_time = time.time()
            while len(batch_texts) < self.batch_size:
                remaining_time = self.wait_time - (time.time() - start_time)
                if remaining_time <= 0:
                    break

                try:
                    text, future = await asyncio.wait_for(self.queue.get(), timeout=remaining_time)
                    batch_texts.append(text)
                    futures.append(future)
                except (TimeoutError, asyncio.QueueEmpty):
                    break
                except asyncio.CancelledError:
                    break

            # 3. Process the batch
            if batch_texts:
                try:
                    logger.debug(f"Processing batch of {len(batch_texts)} texts")
                    # Use the underlying service to encode
                    embeddings = self.embedding_service.generate_batch_embeddings(batch_texts)

                    # 4. Resolve futures
                    for i, future in enumerate(futures):
                        if not future.cancelled():
                            future.set_result(embeddings[i])
                except Exception as e:
                    logger.exception(f"Batch processing error: {e}")
                    for future in futures:
                        if not future.done():
                            future.set_exception(e)

    def __del__(self):
        self.stop()
