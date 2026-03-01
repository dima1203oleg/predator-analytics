from __future__ import annotations

import contextlib
from datetime import datetime
import hashlib
import json
import os
from typing import Any


class AZRSovereignMemory:
    """🏛️ AZR Sovereign Memory
    STORES high-entropy solutions in a PERMITTED root location.
    """

    def __init__(self, project_root: str = "/Users/dima-mac/Documents/Predator_21", storage_path: str | None = None):
        self.project_root = project_root
        if storage_path:
            self.storage_path = storage_path
        else:
            self.storage_path = os.path.join(self.project_root, "azr_memory.jsonl")

    def record_solution(self, mutation_type: str, target: str, solution: str, metrics: dict[str, Any]):
        """Records a successful mutation into permanent history."""
        entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "sovereign_id": f"SOL-{int(datetime.utcnow().timestamp())}",
            "mutation_type": mutation_type,
            "target_hash": self._generate_hash(target),
            "target_path": target,
            "solution_hash": self._generate_hash(solution),
            "solution_snippet": solution[:500],  # Keep snippet for easy lookup
            "impact_metrics": metrics,
            "status": "VALIDATED",
        }
        with open(self.storage_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")

    def find_historical_fix(self, target_path: str) -> str | None:
        """Search for a previously successful fix for the same object."""
        if not os.path.exists(self.storage_path):
            return None

        target_hash = self._generate_hash(target_path)
        solutions = []

        with open(self.storage_path, encoding="utf-8") as f:
            for line in f:
                try:
                    exp = json.loads(line)
                    if exp["target_hash"] == target_hash:
                        solutions.append(exp)
                except:
                    continue

        if solutions:
            # Return most recent validated solution
            return solutions[-1]["solution_snippet"]
        return None

    def _generate_hash(self, text: str) -> str:
        return hashlib.sha256(text.encode()).hexdigest()

    def get_stats(self) -> dict[str, Any]:
        """Returns statistics of the Neural Memory."""
        if not os.path.exists(self.storage_path):
            return {"solutions_stored": 0, "active_neurons": 0}

        count = 0
        targets = set()
        with open(self.storage_path) as f:
            for line in f:
                count += 1
                with contextlib.suppress(BaseException):
                    targets.add(json.loads(line)["target_hash"])

        return {"solutions_stored": count, "unique_targets_mastered": len(targets), "memory_integrity": "STABLE"}
