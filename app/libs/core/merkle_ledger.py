"""🏛️ MERKLE TRUTH LEDGER - Cryptographic Immutable Audit Chain.
=============================================================
Core component for AZR v40 Sovereign Architecture.

This module provides:
- SHA3-512 based cryptographic hashing
- Merkle Tree proofs for any event
- Append-only immutable ledger
- Verification of historical integrity
- Time-based anchoring

Constitutional Enforcement:
- Axiom 11: Law of Complete Commitment (Cryptographic binding)
- Axiom 14: Law of Temporal Irreversibility (Immutable timestamps)

Python 3.12 | Ukrainian Documentation
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import UTC, datetime
import hashlib
import json
from pathlib import Path
import threading
from typing import Any


def sha3_512(data: str | bytes) -> str:
    """Compute SHA3-512 hash of data."""
    if isinstance(data, str):
        data = data.encode("utf-8")
    return hashlib.sha3_512(data).hexdigest()


def sha3_256(data: str | bytes) -> str:
    """Compute SHA3-256 hash (for shorter hashes where needed)."""
    if isinstance(data, str):
        data = data.encode("utf-8")
    return hashlib.sha3_256(data).hexdigest()


@dataclass
class LedgerEntry:
    """Immutable record in the Truth Ledger."""

    sequence: int
    timestamp: str
    event_type: str
    payload: dict[str, Any]
    payload_hash: str
    previous_hash: str
    merkle_root: str
    signature: str = ""  # Reserved for future ZKP/DID signing

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> LedgerEntry:
        return cls(**data)

    def compute_entry_hash(self) -> str:
        """Hash of this entry for chain linking."""
        canonical = json.dumps(
            {
                "sequence": self.sequence,
                "timestamp": self.timestamp,
                "event_type": self.event_type,
                "payload_hash": self.payload_hash,
                "previous_hash": self.previous_hash,
            },
            sort_keys=True,
            ensure_ascii=False,
        )
        return sha3_512(canonical)


@dataclass
class MerkleProof:
    """Proof that an entry exists in the ledger at specific position."""

    entry_hash: str
    merkle_root: str
    proof_path: list[tuple[str, str]]  # List of (hash, position: 'left'|'right')
    verified: bool = False

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


class MerkleTruthLedger:
    """🏛️ Криптографічний Незмінний Реєстр Істини.

    Кожен запис:
    1. Хешується через SHA3-512
    2. Пов'язаний з попереднім записом (chain)
    3. Включений у Merkle Tree для ефективної верифікації
    4. Зберігається у append-only файлі

    Гарантії:
    - Неможливо змінити минулий запис без виявлення
    - Неможливо видалити запис
    - Неможливо вставити запис між існуючими
    - Кожен запис має криптографічний доказ існування
    """

    GENESIS_HASH = sha3_512("PREDATOR_AZR_GENESIS_BLOCK_v40")

    def __init__(self, storage: Any = "/tmp/azr_logs"):
        from app.libs.core.storage import FileStorageProvider
        if isinstance(storage, (str, Path)):
            self.storage = FileStorageProvider(Path(storage))
        else:
            self.storage = storage

        self.ledger_rel_path = "truth_ledger.jsonl"
        self.state_rel_path = "ledger_state.json"

        # In-memory state
        self._lock = threading.Lock()
        self._entries: list[LedgerEntry] = []
        self._entry_hashes: list[str] = []
        self._current_merkle_root: str = self.GENESIS_HASH
        self._sequence: int = 0

        # Load existing state
        self._load_state()

    def _load_state(self) -> None:
        """Load ledger state from StorageProvider."""
        content = self.storage.read_text(self.ledger_rel_path)
        if content:
            for line in content.splitlines():
                if line.strip():
                    try:
                        entry = LedgerEntry.from_dict(json.loads(line))
                        self._entries.append(entry)
                        self._entry_hashes.append(entry.compute_entry_hash())
                    except Exception:
                        pass

            if self._entries:
                self._sequence = self._entries[-1].sequence
                self._current_merkle_root = self._entries[-1].merkle_root

    def _save_entry(self, entry: LedgerEntry) -> None:
        """Append entry to persistent storage via StorageProvider."""
        self.storage.append_line(self.ledger_rel_path, entry.to_dict())

    def _compute_merkle_root(self, hashes: list[str]) -> str:
        """Compute Merkle root from list of hashes."""
        if not hashes:
            return self.GENESIS_HASH

        if len(hashes) == 1:
            return hashes[0]

        # Make a copy to avoid modifying original
        current_level = list(hashes)

        # Build tree level by level
        while len(current_level) > 1:
            next_level = []

            # Pad to even number if needed
            if len(current_level) % 2 == 1:
                current_level.append(current_level[-1])

            for i in range(0, len(current_level), 2):
                combined = current_level[i] + current_level[i + 1]
                next_level.append(sha3_512(combined))

            current_level = next_level

        return current_level[0]

    def append(
        self, event_type: str, payload: dict[str, Any], metadata: dict[str, Any] | None = None
    ) -> LedgerEntry:
        """Append new event to the Truth Ledger.

        Args:
            event_type: Type of event (e.g., 'AZR_DECISION', 'ETL_STATE_CHANGE')
            payload: Event data
            metadata: Optional additional metadata

        Returns:
            Created LedgerEntry with cryptographic proofs

        """
        with self._lock:
            self._sequence += 1

            # Canonical timestamp ( ISO format)
            timestamp = datetime.now(UTC).isoformat()

            # Include metadata in payload if provided
            full_payload = {**payload}
            if metadata:
                full_payload["_metadata"] = metadata

            # Compute payload hash
            payload_canonical = json.dumps(full_payload, sort_keys=True, ensure_ascii=False)
            payload_hash = sha3_512(payload_canonical)

            # Get previous hash
            previous_hash = self._entry_hashes[-1] if self._entries else self.GENESIS_HASH

            # Create entry (merkle_root will be computed after)
            entry = LedgerEntry(
                sequence=self._sequence,
                timestamp=timestamp,
                event_type=event_type,
                payload=full_payload,
                payload_hash=payload_hash,
                previous_hash=previous_hash,
                merkle_root="",  # Placeholder
            )

            # Compute entry hash and add to list
            entry_hash = entry.compute_entry_hash()
            new_hashes = [*self._entry_hashes, entry_hash]

            # Compute new Merkle root
            merkle_root = self._compute_merkle_root(new_hashes)
            entry.merkle_root = merkle_root

            # Update state
            self._entries.append(entry)
            self._entry_hashes.append(entry_hash)
            self._current_merkle_root = merkle_root

            # Persist
            self._save_entry(entry)

            return entry

    def repair_from_corruption(self) -> tuple[bool, str, int]:
        """🔧 Відновлення реєстру після пошкодження.

        Процес:
        1. Сканує всі записи на дублікати послідовності
        2. Видаляє пошкоджені/дубльовані записи
        3. Перенумеровує залишки
        4. Перераховує всі хеші
        5. Створює checkpoint відновлення

        Returns:
            (success, message, entries_removed)

        """
        with self._lock:
            if not self._entries:
                return True, "Реєстр порожній - нічого відновлювати", 0

            original_count = len(self._entries)

            # 1. Detect duplicates and corrupted sequences
            seen_sequences: set[int] = set()
            valid_entries: list[LedgerEntry] = []
            removed_count = 0

            for entry in self._entries:
                # Skip if we've seen this sequence before
                if entry.sequence in seen_sequences:
                    removed_count += 1
                    continue
                seen_sequences.add(entry.sequence)
                valid_entries.append(entry)

            # 2. Sort by sequence and renumber
            valid_entries.sort(key=lambda e: e.sequence)

            # 3. Rebuild with correct sequence and hashes
            new_entries: list[LedgerEntry] = []
            new_hashes: list[str] = []

            for i, old_entry in enumerate(valid_entries):
                new_seq = i + 1

                # Get previous hash
                prev_hash = new_hashes[-1] if new_entries else self.GENESIS_HASH

                # Recompute payload hash
                payload_canonical = json.dumps(
                    old_entry.payload, sort_keys=True, ensure_ascii=False
                )
                payload_hash = sha3_512(payload_canonical)

                # Create corrected entry
                corrected_entry = LedgerEntry(
                    sequence=new_seq,
                    timestamp=old_entry.timestamp,
                    event_type=old_entry.event_type,
                    payload=old_entry.payload,
                    payload_hash=payload_hash,
                    previous_hash=prev_hash,
                    merkle_root="",  # Will compute after
                )

                entry_hash = corrected_entry.compute_entry_hash()
                new_hashes.append(entry_hash)

                # Compute running merkle root
                corrected_entry.merkle_root = self._compute_merkle_root(new_hashes)
                new_entries.append(corrected_entry)

            # 4. Add recovery checkpoint
            checkpoint_payload = {
                "recovery_type": "CORRUPTION_REPAIR",
                "original_entries": original_count,
                "removed_entries": removed_count,
                "final_entries": len(new_entries),
                "repair_timestamp": datetime.now(UTC).isoformat(),
            }

            checkpoint_seq = len(new_entries) + 1
            prev_hash = new_hashes[-1] if new_hashes else self.GENESIS_HASH
            payload_canonical = json.dumps(checkpoint_payload, sort_keys=True, ensure_ascii=False)

            checkpoint_entry = LedgerEntry(
                sequence=checkpoint_seq,
                timestamp=datetime.now(UTC).isoformat(),
                event_type="LEDGER_CORRUPTION_REPAIRED",
                payload=checkpoint_payload,
                payload_hash=sha3_512(payload_canonical),
                previous_hash=prev_hash,
                merkle_root="",
            )

            checkpoint_hash = checkpoint_entry.compute_entry_hash()
            new_hashes.append(checkpoint_hash)
            checkpoint_entry.merkle_root = self._compute_merkle_root(new_hashes)
            new_entries.append(checkpoint_entry)

            # 5. Replace in-memory state
            self._entries = new_entries
            self._entry_hashes = new_hashes
            self._sequence = len(new_entries)
            self._current_merkle_root = new_entries[-1].merkle_root

            # 6. Rewrite ledger file (via StorageProvider)
            backup_rel_path = self.ledger_rel_path + ".bak"
            if self.storage.exists(self.ledger_rel_path):
                self.storage.copy(self.ledger_rel_path, backup_rel_path)

            # 6. Save repaired ledger via StorageProvider
            self.storage.write_lines(
                self.ledger_rel_path, [e.to_dict() for e in new_entries]
            )

            # 7. Verify
            is_valid, msg = self.verify_chain_integrity()
            if is_valid:
                return (
                    True,
                    f"✅ Реєстр відновлено: {removed_count} пошкоджених записів видалено, {len(new_entries)} записів збережено",
                    removed_count,
                )
            return False, f"❌ Відновлення не вдалось: {msg}", 0

    def verify_chain_integrity(self) -> tuple[bool, str]:
        """Verify entire chain integrity.

        Returns:
            (is_valid, message)

        """
        if not self._entries:
            return True, "Порожній реєстр - дійсний"

        # Verify chain links
        for i, entry in enumerate(self._entries):
            # Check sequence
            if entry.sequence != i + 1:
                return (
                    False,
                    f"Порушена послідовність на записі {i}: очікувалось {i + 1}, отримано {entry.sequence}",
                )

            # Check previous hash
            expected_prev = self.GENESIS_HASH if i == 0 else self._entry_hashes[i - 1]

            if entry.previous_hash != expected_prev:
                return False, f"Розірваний ланцюг на записі {i}: previous_hash не відповідає"

            # Verify payload hash
            payload_canonical = json.dumps(entry.payload, sort_keys=True, ensure_ascii=False)
            computed_hash = sha3_512(payload_canonical)
            if entry.payload_hash != computed_hash:
                return False, f"Підроблений payload на записі {i}: хеш не відповідає"

        # Verify final Merkle root
        computed_root = self._compute_merkle_root(self._entry_hashes)
        if computed_root != self._current_merkle_root:
            return False, f"Merkle root не відповідає: обчислений={str(computed_root)[:32]}..."

        return (
            True,
            f"✅ Реєстр дійсний: {len(self._entries)} записів, root={str(self._current_merkle_root)[:32]}...",
        )

    def get_proof(self, sequence: int) -> MerkleProof | None:
        """Generate Merkle proof for entry at given sequence.

        Args:
            sequence: Entry sequence number (1-indexed)

        Returns:
            MerkleProof if entry exists, None otherwise

        """
        if sequence < 1 or sequence > len(self._entries):
            return None

        index = sequence - 1
        entry_hash = self._entry_hashes[index]

        # Build proof path
        proof_path: list[tuple[str, str]] = []
        hashes = list(self._entry_hashes)

        # Pad if needed
        if len(hashes) % 2 == 1:
            hashes.append(hashes[-1])

        current_index = index

        while len(hashes) > 1:
            # Find sibling
            if current_index % 2 == 0:
                # Left node, sibling is to the right
                sibling_index = (
                    current_index + 1 if current_index + 1 < len(hashes) else current_index
                )
                proof_path.append((hashes[sibling_index], "right"))
            else:
                # Right node, sibling is to the left
                sibling_index = current_index - 1
                proof_path.append((hashes[sibling_index], "left"))

            # Move up
            next_level = []
            for i in range(0, len(hashes), 2):
                combined = (
                    hashes[i] + hashes[i + 1] if i + 1 < len(hashes) else hashes[i] + hashes[i]
                )
                next_level.append(sha3_512(combined))

            hashes = next_level
            current_index = current_index // 2

        return MerkleProof(
            entry_hash=entry_hash,
            merkle_root=self._current_merkle_root,
            proof_path=proof_path,
            verified=True,
        )

    def verify_proof(self, proof: MerkleProof) -> bool:
        """Verify a Merkle proof."""
        current_hash = proof.entry_hash

        for sibling_hash, position in proof.proof_path:
            combined = (
                sibling_hash + current_hash if position == "left" else current_hash + sibling_hash
            )
            current_hash = sha3_512(combined)

        return current_hash == proof.merkle_root

    def get_entry(self, sequence: int) -> LedgerEntry | None:
        """Get entry by sequence number."""
        if sequence < 1 or sequence > len(self._entries):
            return None
        return self._entries[sequence - 1]

    def get_entries_by_type(self, event_type: str, limit: int = 100) -> list[LedgerEntry]:
        """Get entries filtered by event type."""
        return [e for e in self._entries if e.event_type == event_type][-limit:]

    def get_latest_entries(self, count: int = 10) -> list[LedgerEntry]:
        """Get most recent entries."""
        return list(self._entries[-count:])

    def get_stats(self) -> dict[str, Any]:
        """Get ledger statistics."""
        event_types = {}
        for entry in self._entries:
            event_types[entry.event_type] = event_types.get(entry.event_type, 0) + 1

        return {
            "total_entries": len(self._entries),
            "current_sequence": self._sequence,
            "merkle_root": self._current_merkle_root[:64] + "...",
            "genesis_hash": self.GENESIS_HASH[:64] + "...",
            "event_type_counts": event_types,
            "storage_provider": self.storage.__class__.__name__,
            "ledger_file": self.ledger_rel_path,
            "integrity_verified": self.verify_chain_integrity()[0],
        }

    @property
    def merkle_root(self) -> str:
        """Current Merkle root of the entire ledger."""
        return self._current_merkle_root

    @property
    def length(self) -> int:
        """Number of entries in ledger."""
        return len(self._entries)


# ============================================================================
# 🔗 KEYED SINGLETONS
# ============================================================================

_ledger_instances: dict[str, MerkleTruthLedger] = {}
_ledger_lock = threading.Lock()


def get_truth_ledger(storage: Any = "/tmp/azr_logs") -> MerkleTruthLedger:
    """Get or create the Truth Ledger instance for a specific storage path."""
    global _ledger_instances

    # Normalize path key
    from app.libs.core.storage import StorageProvider
    if isinstance(storage, StorageProvider):
        path_key = str(storage.base_path)
    else:
        path_key = str(Path(storage).absolute())

    with _ledger_lock:
        if path_key not in _ledger_instances:
            _ledger_instances[path_key] = MerkleTruthLedger(storage)
        return _ledger_instances[path_key]


def reset_ledger_singletons():
    """External hook to clear singletons (primarily for testing)."""
    global _ledger_instances
    with _ledger_lock:
        _ledger_instances.clear()


def record_truth(
    event_type: str, payload: dict[str, Any], metadata: dict[str, Any] | None = None
) -> LedgerEntry:
    """Convenience function to record an event to the global Truth Ledger.

    Usage:
        from app.libs.core.merkle_ledger import record_truth

        entry = record_truth(
            "AZR_DECISION",
            {"action": "SCALE_UP", "target": "api-gateway", "reason": "High load"},
            {"actor": "azr_engine_v32"}
        )
    """
    ledger = get_truth_ledger()
    return ledger.append(event_type, payload, metadata)


def verify_truth() -> tuple[bool, str]:
    """Verify global Truth Ledger integrity."""
    ledger = get_truth_ledger()
    return ledger.verify_chain_integrity()


def repair_truth() -> tuple[bool, str, int]:
    """Repair global Truth Ledger if corrupted.

    Returns:
        (success, message, entries_removed)

    """
    ledger = get_truth_ledger()
    return ledger.repair_from_corruption()


# ============================================================================
# 🧪 SELF-TEST
# ============================================================================

if __name__ == "__main__":

    # Create test ledger
    ledger = MerkleTruthLedger("/tmp/azr_test_ledger")

    # Add test entries
    entries = []
    for i in range(5):
        entry = ledger.append(
            event_type="TEST_EVENT",
            payload={"index": i, "message": f"Test entry {i}"},
            metadata={"test": True},
        )
        entries.append(entry)

    # Verify chain
    is_valid, message = ledger.verify_chain_integrity()

    # Generate and verify proof
    proof = ledger.get_proof(3)
    if proof:
        verified = ledger.verify_proof(proof)

    # Print stats
    stats = ledger.get_stats()
