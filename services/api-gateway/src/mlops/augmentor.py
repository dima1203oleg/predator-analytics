import logging
import uuid
from typing import List
import nlpaug.augmenter.word as naw
import nlpaug.augmenter.char as nac
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from libs.core.models import Document, AugmentedDataset

logger = logging.getLogger(__name__)

class AugmentorManager:
    """
    Manager for data augmentation (synthetic data generation).
    Uses nlpaug and simple linguistic rules.
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        # Character level augmentation (simulating OCR noise or typos)
        self.char_aug = nac.KeyboardAug(aug_char_min=1, aug_char_p=0.1)

        # Word level augmentation (synonyms)
        # Note: In production we might use ContextualWordEmbsAug with BERT/RoBERTa
        # But for demo/speed we use SynonymAug
        self.word_aug = naw.SynonymAug(aug_src='wordnet')

    async def generate_synthetic_data(self, doc_id: uuid.UUID, num_variants: int = 2) -> List[uuid.UUID]:
        """
        Generate multiple synthetic variants of a document.
        """
        logger.info(f"Generating {num_variants} synthetic variants for doc {doc_id}")

        # 1. Fetch original document
        result = await self.db.execute(select(Document).where(Document.id == doc_id))
        doc = result.scalar_one_or_none()

        if not doc:
            logger.error(f"Document {doc_id} not found for augmentation")
            return []

        generated_ids = []

        # 2. Generate variants
        for i in range(num_variants):
            try:
                # Apply character augmentation (typos)
                text_with_typos = self.char_aug.augment(doc.content)[0]

                # Apply word augmentation (synonyms)
                # nlpaug returns a list
                final_text = self.word_aug.augment(text_with_typos)[0]

                # 3. Create AugmentedDataset record
                aug_record = AugmentedDataset(
                    tenant_id=doc.tenant_id,
                    original_id=doc.id,
                    content=final_text,
                    aug_type="combo_char_word"
                )

                self.db.add(aug_record)
                generated_ids.append(aug_record.id)

            except Exception as e:
                logger.error(f"Failed to generate variant {i} for doc {doc_id}: {e}")

        await self.db.commit()
        logger.info(f"Successfully generated {len(generated_ids)} variants for {doc_id}")
        return generated_ids

    async def augment_for_tenant(self, tenant_id: uuid.UUID, limit: int = 10):
        """
        Augment multiple documents for a tenant.
        """
        result = await self.db.execute(
            select(Document).where(Document.tenant_id == tenant_id).limit(limit)
        )
        docs = result.scalars().all()

        total_variants = 0
        for doc in docs:
            variants = await self.generate_synthetic_data(doc.id, num_variants=1)
            total_variants += len(variants)

        return total_variants
