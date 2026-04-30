import contextlib
import json
from pathlib import Path
import shutil
import tempfile

import pytest

from app.libs.core.mcp_integration import reset_mcp_singletons
from app.libs.core.merkle_ledger import reset_ledger_singletons
from app.libs.core.storage import FileStorageProvider
from app.services.azr_engine_v32 import AZRAction, AZREngineV32


@pytest.fixture
def clean_storage():
    """Provides a fresh temporary directory and resets all singletons."""
    reset_ledger_singletons()
    reset_mcp_singletons()
    tmpdir = tempfile.mkdtemp()
    yield Path(tmpdir)
    if Path(tmpdir).exists():
        with contextlib.suppress(OSError):
            shutil.rmtree(tmpdir)
    reset_ledger_singletons()
    reset_mcp_singletons()

@pytest.mark.asyncio
async def test_experience_memory_persistence(clean_storage):
    """
    STABILIZATION TEST - PERSISTENCE 1: Experience Memory
    Ensures recorded experiences survive engine restarts.
    """
    storage = FileStorageProvider(clean_storage)

    # 1. Create engine and record experience
    engine1 = AZREngineV32(storage=storage)
    await engine1.start()

    action = AZRAction(type="TEST_PERSISTENCE", meta={"id": "persist-001"})
    engine1.memory.record_experience(action, outcome="SUCCESS", impact_score=0.9)

    # Check that file was created
    assert storage.exists("experience/experience_memory.jsonl")

    await engine1.stop()

    # 2. Reset and reload
    reset_ledger_singletons()
    engine2 = AZREngineV32(storage=storage)

    # Verify the experience is reloaded
    stats = engine2.memory.get_stats()
    assert stats["total_experiences"] == 1

    # Verify patterns are reloaded
    assert engine2.memory.success_patterns.get("TEST_PERSISTENCE") == 1

@pytest.mark.asyncio
async def test_merkle_ledger_persistence(clean_storage):
    """
    STABILIZATION TEST - PERSISTENCE 2: Merkle Ledger
    Ensures the cryptographic ledger is reconstructed from disk.
    """
    storage = FileStorageProvider(clean_storage)

    # 1. Write entries
    engine1 = AZREngineV32(storage=storage)
    await engine1.start()

    engine1.truth_ledger.append("EVENT_A", {"data": 1})
    engine1.truth_ledger.append("EVENT_B", {"data": 2})
    final_root = engine1.truth_ledger.merkle_root
    final_len = engine1.truth_ledger.length

    await engine1.stop()

    # 2. Restart and verify
    reset_ledger_singletons()
    engine2 = AZREngineV32(storage=storage)

    assert engine2.truth_ledger.length == final_len
    assert engine2.truth_ledger.merkle_root == final_root

    # Verify history integrity
    valid, msg = engine2.truth_ledger.verify_chain_integrity()
    assert valid, f"Ledger corrupted on reload: {msg}"

@pytest.mark.asyncio
async def test_evolution_state_restoration(clean_storage):
    """
    STABILIZATION TEST - PERSISTENCE 3: Evolution History
    Ensures system evolution snapshots are readable after restart.
    """
    from unittest.mock import patch

    from app.services.evolution_service import EvolutionService

    storage = FileStorageProvider(clean_storage)
    evolution = EvolutionService(storage=storage)

    # 1. Save snapshot
    with patch.object(EvolutionService, 'get_latest_stats') as mock_stats:
        mock_stats.return_value = {"metric": "evolved", "value": 1.0, "timestamp": "2026-03-03T00:00:00Z"}
        await evolution.save_snapshot()

    # 2. Verify file
    assert storage.exists(evolution.history_rel_path)

    # 3. Reload and check (assuming the service reads history if needed, for now just checking the file is intact)
    content = storage.read_text(evolution.history_rel_path)
    data = json.loads(content)
    assert data["metric"] == "evolved"
