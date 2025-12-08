"""
Data Augmentor Service (v22.0)
Generates synthetic data for expanding training datasets using NLPAug and AugLy.
"""
import logging
from typing import List, Dict, Any, Optional
import random
import uuid

logger = logging.getLogger("service.augmentor")


class DataAugmentor:
    """
    Generates synthetic variations of text data for ML training.
    
    Supports:
    - Synonym replacement (WordNet)
    - AugLy (Text augmentation) - optional
    - Random insertion/deletion (Fallback)
    - Contextual embeddings (BERT)
    """
    
    def __init__(self):
        self._aug_synonym = None
        self._augly_text = None
        self._initialized = False
        logger.info("DataAugmentor initialized (lazy loading)")
    
    def _load_augmenters(self):
        """Lazy load augmentation models."""
        if self._initialized:
            return
        
        # 1. NLPAug
        try:
            import nlpaug.augmenter.word as naw
            self._aug_synonym = naw.SynonymAug(aug_src='wordnet')
            logger.info("✅ NLPAug (Synonym) loaded")
        except ImportError:
            logger.warning("nlpaug not installed. Synonym augmentation unavailable.")
        except Exception as e:
             logger.warning(f"NLPAug init failed: {e}")

        # 2. AugLy
        try:
            import augly.text as textaugs
            self._augly_text = textaugs
            logger.info("✅ AugLy (Text) loaded")
        except ImportError:
            logger.warning("augly not installed. Facebook AugLy features unavailable.")
        except Exception as e:
             logger.warning(f"AugLy init failed: {e}")

        self._initialized = True
    
    def augment_text(
        self,
        text: str,
        method: str = "synonym",
        num_variations: int = 3
    ) -> List[str]:
        """
        Generate variations of input text.
        """
        self._load_augmenters()
        variations = []
        
        # 1. AugLy Methods
        if method.startswith("augly_") and self._augly_text:
            try:
                for _ in range(num_variations):
                    if method == "augly_typo":
                        aug = self._augly_text.simulate_typos(text)
                    elif method == "augly_insert":
                        aug = self._augly_text.insert_punctuation_chars(text)
                    else:
                        aug = self._augly_text.replace_similar_chars(text)
                    
                    if isinstance(aug, list): aug = aug[0]
                    variations.append(aug)
            except Exception as e:
                 logger.warning(f"AugLy failed: {e}")
                 variations = self._fallback_augment(text, num_variations)

        # 2. NLPAug Methods
        elif method == "synonym" and self._aug_synonym:
            try:
                for _ in range(num_variations):
                    augmented = self._aug_synonym.augment(text)
                    if isinstance(augmented, list):
                        augmented = augmented[0]
                    variations.append(augmented)
            except Exception as e:
                logger.warning(f"Synonym augmentation failed: {e}")
                variations = self._fallback_augment(text, num_variations)
        
        # 3. Native Methods
        elif method == "random":
            variations = self._random_augment(text, num_variations)
        elif method == "shuffle":
            variations = self._shuffle_augment(text, num_variations)
        else:
            variations = self._fallback_augment(text, num_variations)
        
        # Deduplicate and return
        return list(set(variations))
    
    def _fallback_augment(self, text: str, num: int) -> List[str]:
        """Simple fallback augmentation without external libraries."""
        words = text.split()
        variations = []
        
        if not words: return [text]
        
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
        if not chars: return [text]
        
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
        tenant_id: str,
        content_field: str = "content",
        method: str = "synonym",
        variations_per_doc: int = 2
    ) -> List[Dict[str, Any]]:
        """
        Augment an entire dataset into AugmentedDataset schema structure.
        
        Args:
            documents: List of document dicts (must have 'id')
            tenant_id: UUID of the tenant
            content_field: Field containing text to augment
            method: Augmentation method
            variations_per_doc: Number of variations per document
        
        Returns:
            List of dicts matching AugmentedDataset model fields
        """
        augmented_records = []
        
        for doc in documents:
            original_id = doc.get("id")
            original_content = doc.get(content_field, "")
            
            if not original_content or len(original_content) < 20:
                continue
            
            variations = self.augment_text(
                original_content,
                method=method,
                num_variations=variations_per_doc
            )
            
            for var_content in variations:
                record = {
                    "id": str(uuid.uuid4()),
                    "tenant_id": str(tenant_id),
                    "original_id": str(original_id),
                    "content": var_content,
                    "aug_type": method,
                    "created_at": None # let DB handle default
                }
                augmented_records.append(record)
        
        logger.info(f"Augmented {len(documents)} docs -> {len(augmented_records)} records for tenant {tenant_id}")
        return augmented_records


# Singleton
_augmentor: Optional[DataAugmentor] = None


def get_augmentor() -> DataAugmentor:
    """Get augmentor singleton."""
    global _augmentor
    if _augmentor is None:
        _augmentor = DataAugmentor()
    return _augmentor
