"""
Document Summarization Service
Generates concise summaries using T5 or BART models
"""
from transformers import pipeline
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class SummarizerService:
    """
    Abstractive summarization for documents.
    Suitable for generating short summaries (~100 words) for search results.
    """
    
    def __init__(self, model_name: str = "facebook/bart-large-cnn"):
        """
        Initialize summarizer with pre-trained model.
        
        Args:
            model_name: HuggingFace model (bart-large-cnn or t5-small)
        """
        logger.info(f"Loading summarizer model: {model_name}")
        self.summarizer = pipeline(
            "summarization", 
            model=model_name,
            device=-1  # CPU, change to 0 for GPU
        )
        logger.info("Summarizer model loaded")
    
    def summarize(
        self, 
        text: str, 
        max_length: int = 130,
        min_length: int = 30
    ) -> Optional[str]:
        """
        Generate summary for input text.
        
        Args:
            text: Full document text
            max_length: Maximum summary length (tokens)
            min_length: Minimum summary length
        
        Returns:
            Summary text or None if error
        """
        if not text or len(text) < 50:
            return None
        
        try:
            # Truncate if too long (models have token limits)
            text_truncated = text[:2048]
            
            result = self.summarizer(
                text_truncated,
                max_length=max_length,
                min_length=min_length,
                do_sample=False
            )
            
            summary = result[0]['summary_text']
            logger.info(f"Generated summary ({len(summary)} chars)")
            return summary
            
        except Exception as e:
            logger.error(f"Summarization failed: {e}")
            return None


# Singleton
_summarizer_instance = None

def get_summarizer() -> SummarizerService:
    """Dependency for FastAPI"""
    global _summarizer_instance
    if _summarizer_instance is None:
        _summarizer_instance = SummarizerService()
    return _summarizer_instance
