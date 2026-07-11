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
        
        self._unload_model()
        import time
        time.sleep(5)  # Wait for VRAM to be physically freed
        return augmented_data

    def _generate_synthetic_record(self, record: Dict[str, str], aug_type: str) -> Dict[str, str]:
        """
        Real implementation of synthetic generation using an LLM.
        Calls the local Ollama instance on the NVIDIA server.
        """
        import httpx
        import json
        import re
        from app.config import get_settings
        
        settings = get_settings()
        ollama_url = getattr(settings, "OLLAMA_API_URL", "http://localhost:11434")
        model = getattr(settings, "OLLAMA_MODEL", "deepseek-r1:latest")

        instruction = record.get("instruction", "")
        input_text = record.get("input", "")
        output_text = record.get("output", "")

        prompt = f"Перефразуй або згенеруй синтетичний аналог цього запису у форматі JSON (з полями instruction, input, output). Тип генерації: {aug_type}.\n\nОригінал:\nInstruction: {instruction}\nInput: {input_text}\nOutput: {output_text}"

        try:
            with httpx.Client() as client:
                response = client.post(
                    f"{ollama_url}/api/generate",
                    json={
                        "model": model,
                        "prompt": prompt,
                        "stream": False,
                        "format": "json"
                    },
                    timeout=300.0
                )
            if response.status_code == 200:
                result_text = response.json().get("response", "")
                
                # Robust JSON extraction
                json_match = re.search(r'(\{.*\}|\[.*\])', result_text, re.DOTALL)
                if json_match:
                    result_text = json_match.group(1)
                
                parsed = json.loads(result_text)
                return {
                    "instruction": parsed.get("instruction", instruction),
                    "input": parsed.get("input", input_text),
                    "output": parsed.get("output", output_text)
                }
        except Exception as e:
            logger.error(f"Failed to generate synthetic data with real LLM: {e}")
            raise RuntimeError("Real LLM call failed. Mocks are forbidden.")
        
        raise RuntimeError("Failed to parse valid JSON from LLM response.")

    def _unload_model(self):
        """Forces Ollama to unload the model from VRAM to free memory for training."""
        import httpx
        from app.config import get_settings
        
        settings = get_settings()
        ollama_url = getattr(settings, "OLLAMA_API_URL", "http://localhost:11434")
        model = getattr(settings, "OLLAMA_MODEL", "deepseek-r1:latest")
        
        logger.info("Unloading Ollama model to free VRAM for PyTorch training...")
        try:
            with httpx.Client() as client:
                client.post(
                    f"{ollama_url}/api/generate",
                    json={
                        "model": model,
                        "keep_alive": 0
                    },
                    timeout=10.0
                )
        except Exception as e:
            logger.warning(f"Could not unload Ollama model: {e}")

synthetic_data_agent = SyntheticDataAgent()
