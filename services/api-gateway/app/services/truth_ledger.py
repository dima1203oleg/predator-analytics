
"""
📜 Truth Ledger v1.0 (UA) - Predator Analytics v28-S
Забезпечує прозорість та імутабельність записів дій системи.
Axiom-003 Compliance.
"""

import json
import hashlib
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional

from libs.core.structured_logger import get_logger

logger = get_logger("services.truth_ledger")

class TruthLedger:
    def __init__(self, storage_path: str = "/app/.azr/ledger.jsonl"):
        self.path = Path(storage_path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._last_hash = self._get_last_hash()

    def _get_last_hash(self) -> str:
        """Отримує хеш останнього запису для ланцюжка (chaining)."""
        if not self.path.exists():
            return "0000000000000000000000000000000000000000000000000000000000000000"

        try:
            with open(self.path, "rb") as f:
                # Читаємо останній рядок
                f.seek(0, os.SEEK_END)
                pos = f.tell() - 2
                while pos > 0:
                    f.seek(pos)
                    if f.read(1) == b"\n":
                         break
                    pos -= 1
                last_line = f.readline().decode().strip()
                if last_line:
                    data = json.loads(last_line)
                    return data.get("hash", "")
        except Exception as e:
            logger.error(f"Failed to read last hash: {e}")

        return "0" * 64

    def record_action(self, action_type: str, payload: Dict[str, Any], status: str = "COMMITTED") -> str:
        """Створює імутабельний запис про дію."""
        record = {
            "timestamp": datetime.now().isoformat(),
            "action_type": action_type,
            "payload": payload,
            "status": status,
            "previous_hash": self._last_hash
        }

        # Розрахунок хешу для забезпечення цілісності (Axiom-003)
        record_json = json.dumps(record, sort_keys=True)
        record_hash = hashlib.sha256(record_json.encode()).hexdigest()
        record["hash"] = record_hash

        try:
            with open(self.path, "a") as f:
                f.write(json.dumps(record) + "\n")

            self._last_hash = record_hash
            logger.info("ledger_entry_created", action=action_type, hash=record_hash[:10])
            return record_hash
        except Exception as e:
            logger.error(f"Failed to write to Truth Ledger: {e}")
            return ""

    def verify_integrity(self) -> bool:
        """Перевіряє ланцюжок хешів (Audit mode)."""
        if not self.path.exists():
            return True

        current_prev_hash = "0" * 64
        try:
            with open(self.path, "r") as f:
                for line in f:
                    data = json.loads(line)
                    actual_hash = data.pop("hash")
                    if data["previous_hash"] != current_prev_hash:
                        return False

                    # Перерахунок хешу
                    recalculated = hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()
                    if recalculated != actual_hash:
                        return False

                    current_prev_hash = actual_hash
            return True
        except Exception:
            return False

# Global instance for easy access
truth_ledger = TruthLedger()
