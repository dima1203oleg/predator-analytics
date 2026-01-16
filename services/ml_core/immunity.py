"""
Immunity Memory System
Stores 'Antigens' (errors, false positives, failures) to prevent recurrence.
Part of the Predator Analytics Autonomy Stack.
"""

import logging
import json
import os
from typing import List, Dict, Any
from datetime import datetime

logger = logging.getLogger("ml_core.immunity")

class ImmunityMemory:
    def __init__(self, memory_path: str = "data/memory/immunity_antigens.jsonl"):
        self.memory_path = memory_path
        os.makedirs(os.path.dirname(self.memory_path), exist_ok=True)

    def record_failure(self, error_type: str, context: Dict[str, Any], correction: str):
        """
        Record a system or model failure as an 'Antigen'.
        """
        antigen = {
            "id": datetime.now().strftime("%Y%m%d%H%M%S"),
            "timestamp": datetime.now().isoformat(),
            "type": error_type,
            "context": context,
            "correction": correction,
            "severity": "high"
        }

        with open(self.memory_path, 'a') as f:
            f.write(json.dumps(antigen, ensure_ascii=False) + "\n")

        logger.warning(f"🦠 New Antigen Recorded: {error_type}")

    def get_vaccines(self, query_context: str) -> List[Dict]:
        """
        Retrieves relevant corrections for a given context to avoid repeating errors.
        In a full implementation, this would use Vector Search (Qdrant).
        """
        # Linear search for now (MVP)
        vaccines = []
        if not os.path.exists(self.memory_path):
            return []

        with open(self.memory_path, 'r') as f:
            for line in f:
                antigen = json.loads(line)
                # Simple keyword matching for demo purposes
                if any(word.lower() in str(antigen['context']).lower() for word in query_context.split()):
                    vaccines.append(antigen)

        return vaccines[:3] # Return top 3 most relevant failures

    def export_for_training(self) -> List[Dict]:
        """
        Converts failures into training instructions for the next fine-tuning cycle.
        This closes the feedback loop.
        """
        knowledge_base = []
        if not os.path.exists(self.memory_path):
            return []

        with open(self.memory_path, 'r') as f:
            for line in f:
                a = json.loads(line)
                knowledge_base.append({
                    "instruction": f"Усунь наступну помилку у своїй логіці: {a['type']}",
                    "input": json.dumps(a['context'], ensure_ascii=False),
                    "output": f"Виправлення: {a['correction']}. Більше ніколи не допускай цієї помилки."
                })
        return knowledge_base
