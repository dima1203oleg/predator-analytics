"""
Data Augmentor Service
Generates synthetic data for expanding training datasets using NLPAug
"""
import logging
from typing import List, Dict, Any, Optional
import random

logger = logging.getLogger("service.augmentor")


class DataAugmentor:
    """
    Generates synthetic variations of text data for ML training.
    
    Supports:
    - Synonym replacement
    - Back-translation simulation
    - Random insertion/deletion
    - Contextual word embeddings augmentation
    """
    
    def __init__(self):
        self._aug_synonym = None
        self._aug_contextual = None
        self._initialized = False
        logger.info("DataAugmentor initialized (lazy loading)")
    
    def _load_augmenters(self):
        """Lazy load augmentation models."""
        if self._initialized:
            return
        
        try:
            import nlpaug.augmenter.word as naw
            import nlpaug.augmenter.char as nac
            
            # Synonym augmenter (WordNet-based)
            self._aug_synonym = naw.SynonymAug(aug_src='wordnet')
            
            # Contextual augmenter (BERT-based) - heavier
            # Only load if explicitly needed
            # self._aug_contextual = naw.ContextualWordEmbsAug(
            #     model_path='bert-base-uncased',
            #     action="substitute"
            # )
            
            self._initialized = True
            logger.info("NLPAug augmenters loaded")
            
        except ImportError:
            logger.warning("nlpaug not installed. Using fallback augmentation.")
            self._initialized = True
    
    def augment_text(
        self,
        text: str,
        method: str = "synonym",
        num_variations: int = 3
    ) -> List[str]:
        """
        Generate variations of input text.
        
        Args:
            text: Original text
            method: Augmentation method (synonym, random, shuffle)
            num_variations: Number of variations to generate
        
        Returns:
            List of augmented texts
        """
        self._load_augmenters()
        
        variations = []
        
        if method == "synonym" and self._aug_synonym:
            try:
                for _ in range(num_variations):
                    augmented = self._aug_synonym.augment(text)
                    if isinstance(augmented, list):
                        augmented = augmented[0]
                    variations.append(augmented)
            except Exception as e:
                logger.warning(f"Synonym augmentation failed: {e}")
                variations = self._fallback_augment(text, num_variations)
        
        elif method == "random":
            variations = self._random_augment(text, num_variations)
        
        elif method == "shuffle":
            variations = self._shuffle_augment(text, num_variations)
        
        else:
            variations = self._fallback_augment(text, num_variations)
        
        logger.info(f"Generated {len(variations)} variations using '{method}'")
        return variations
    
    def _fallback_augment(self, text: str, num: int) -> List[str]:
        """Simple fallback augmentation without external libraries."""
        words = text.split()
        variations = []
        
        for _ in range(num):
            if len(words) > 3:
                # Random word deletion
                idx = random.randint(0, len(words) - 1)
                new_words = words[:idx] + words[idx+1:]
                variations.append(" ".join(new_words))
            else:
                # Duplicate some words
                idx = random.randint(0, len(words) - 1)
                new_words = words[:idx] + [words[idx]] + words[idx:]
                variations.append(" ".join(new_words))
        
        return variations
    
    def _random_augment(self, text: str, num: int) -> List[str]:
        """Random character-level augmentation."""
        variations = []
        chars = list(text)
        
        for _ in range(num):
            new_chars = chars.copy()
            # Random swap
            if len(new_chars) > 2:
                idx = random.randint(0, len(new_chars) - 2)
                new_chars[idx], new_chars[idx+1] = new_chars[idx+1], new_chars[idx]
            variations.append("".join(new_chars))
        
        return variations
    
    def _shuffle_augment(self, text: str, num: int) -> List[str]:
        """Sentence/word order shuffling."""
        sentences = text.split(". ")
        variations = []
        
        for _ in range(num):
            if len(sentences) > 1:
                shuffled = sentences.copy()
                random.shuffle(shuffled)
                variations.append(". ".join(shuffled))
            else:
                words = text.split()
                random.shuffle(words)
                variations.append(" ".join(words))
        
        return variations
    
    def augment_dataset(
        self,
        documents: List[Dict[str, Any]],
        content_field: str = "content",
        method: str = "synonym",
        variations_per_doc: int = 2
    ) -> List[Dict[str, Any]]:
        """
        Augment an entire dataset.
        
        Args:
            documents: List of document dicts
            content_field: Field containing text to augment
            method: Augmentation method
            variations_per_doc: Number of variations per document
        
        Returns:
            List of augmented documents with original_id reference
        """
        augmented = []
        
        for doc in documents:
            original_id = doc.get("id")
            original_content = doc.get(content_field, "")
            
            if not original_content or len(original_content) < 50:
                continue
            
            variations = self.augment_text(
                original_content,
                method=method,
                num_variations=variations_per_doc
            )
            
            for i, var_content in enumerate(variations):
                augmented_doc = {
                    "original_id": original_id,
                    "augmented_content": var_content,
                    "augmentation_type": method,
                    "variation_index": i,
                    "title": doc.get("title", f"Augmented {i}"),
                    "category": doc.get("category"),
                    "source": "augmented"
                }
                augmented.append(augmented_doc)
        
        logger.info(f"Augmented {len(documents)} docs -> {len(augmented)} variations")
        return augmented


# Singleton
_augmentor: Optional[DataAugmentor] = None


def get_augmentor() -> DataAugmentor:
    """Get augmentor singleton."""
    global _augmentor
    if _augmentor is None:
        _augmentor = DataAugmentor()
    return _augmentor
