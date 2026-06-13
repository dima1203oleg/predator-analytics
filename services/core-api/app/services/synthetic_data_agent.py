import logging
import random
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class SyntheticDataAgent:
    def __init__(self):
        self.augmentation_types = [
            'paraphrase',
            'q_and_a',
            'instruction_tuning',
            'role_play',
            'reasoning'
        ]

    def augment_dataset(self, data: List[Dict[str, str]], augmentation_factor: int = 1) -> List[Dict[str, str]]:
        """
        Augments the dataset by creating synthetic variations of the existing records.
        """
        augmented_data = []
        for record in data:
            augmented_data.append(record)
            for _ in range(augmentation_factor):
                try:
                    aug_type = random.choice(self.augmentation_types)
                    new_record = self._generate_synthetic_record(record, aug_type)
                    if new_record:
                        augmented_data.append(new_record)
                except Exception as e:
                    logger.error(f"Error generating synthetic record: {e}")
        
        return augmented_data

    def _generate_synthetic_record(self, record: Dict[str, str], aug_type: str) -> Dict[str, str]:
        """
        Mock implementation of synthetic generation using an LLM.
        In a real scenario, this would call LiteLLM or an Ollama local model.
        """
        instruction = record.get("instruction", "")
        input_text = record.get("input", "")
        output_text = record.get("output", "")

        if aug_type == 'paraphrase':
            return {
                "instruction": f"Can you rephrase: {instruction}",
                "input": input_text,
                "output": f"Rephrased version of: {output_text}"
            }
        elif aug_type == 'q_and_a':
            return {
                "instruction": "Answer the following question based on the input.",
                "input": f"Question: {instruction} Context: {input_text}",
                "output": output_text
            }
        elif aug_type == 'role_play':
            return {
                "instruction": "Act as a Senior Data Analyst. " + instruction,
                "input": input_text,
                "output": "As an analyst, " + output_text
            }
        else:
            # Fallback for reasoning and instruction_tuning
            return {
                "instruction": f"[Reasoning step] {instruction}",
                "input": input_text,
                "output": f"Let's think step by step. {output_text}"
            }

synthetic_data_agent = SyntheticDataAgent()
