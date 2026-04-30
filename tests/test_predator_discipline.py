from pathlib import Path
import shutil
import tempfile
from unittest.mock import patch

import pytest

from app.libs.core.storage import FileStorageProvider
from app.services.azr_engine_v32 import AZRAction, AZREngineV32
from app.services.evolution_service import EvolutionService


@pytest.fixture
def temp_storage():
    """Provides a clean temporary directory for each test."""
    tmpdir = tempfile.mkdtemp()
    storage_path = Path(tmpdir)
    yield storage_path

    # Simple teardown
    if storage_path.exists():
        try:
            shutil.rmtree(storage_path)
        except OSError:
            pass # Windows or lock issues

@pytest.mark.asyncio
async def test_engine_boot_with_injected_storage(temp_storage):
    """
    STABILIZATION TEST 1: Absolute StorageProvider Injection
    Ensures that AZREngineV32 correctly adopts an injected StorageProvider.
    """
    # 1. Prepare storage
    storage = FileStorageProvider(temp_storage)

    # 2. Inject storage into engine (Problem #1 fix)
    engine = AZREngineV32(storage=storage)

    assert engine.storage == storage
    assert engine.root == temp_storage

    # 3. Start engine
    await engine.start()
    assert engine.is_running

    # 4. Verify behavioral status
    status = engine.get_status()
    assert status["is_running"] is True
    assert "health_details" in status

    await engine.stop()
    assert not engine.is_running

@pytest.mark.asyncio
async def test_ledger_integrity_and_persistence(temp_storage):
    """
    STABILIZATION TEST 2: Truth Ledger Persistence
    Ensures that ledger entries survive across engine restarts.
    """
    storage = FileStorageProvider(temp_storage)

    # --- PHASE 1: Initial Write ---
    engine1 = AZREngineV32(storage=storage)
    await engine1.start()

    # Record an action that triggers audit logging explicitly
    action = AZRAction(id="tx-001", type="AUTH_SCAN")
    engine1._log_audit(action, status="SUCCESS")

    # Manually append to truth ledger for testing
    engine1.truth_ledger.append("TEST_EVENT", {"val": 1})
    root1 = engine1.truth_ledger.merkle_root

    await engine1.stop()

    # Verify file exists (Problem #3 fix)
    assert storage.exists("truth_ledger.jsonl")

    # --- PHASE 2: Restart and Verify ---
    # Clear global state if any (using keyed singletons now)
    from app.libs.core.mcp_integration import reset_mcp_singletons
    from app.libs.core.merkle_ledger import reset_ledger_singletons
    reset_ledger_singletons()
    reset_mcp_singletons()

    engine2 = AZREngineV32(storage=storage)
    # MerkleTruthLedger loader should restore root1
    assert engine2.truth_ledger.merkle_root == root1
    assert engine2.truth_ledger.length == 2

    # Add second entry
    engine2.truth_ledger.append("TEST_EVENT_2", {"val": 2})
    assert engine2.truth_ledger.merkle_root != root1
    assert engine2.truth_ledger.length == 3

@pytest.mark.asyncio
async def test_memory_serialization_cycle(temp_storage):
    """
    STABILIZATION TEST 3: Memory Persistence Cycle
    Ensures experience data is correctly serialized and reloaded.
    """
    storage = FileStorageProvider(temp_storage)

    # 1. Create and write
    engine = AZREngineV32(storage=storage)
    action = AZRAction(type="OPTIMIZATION", meta={"worker": "test-agent"})
    engine.memory.record_experience(action, outcome="SUCCESS", impact_score=0.99)

    # Check physical file creation
    assert storage.exists("experience/experience_memory.jsonl")

    # 2. Reload in new instance
    # Reload in new instance (will use fresh keyed singleton for same path)
    # But wait, for Persistence test we want to clear the dict to force reload from file
    from app.libs.core.merkle_ledger import reset_ledger_singletons
    reset_ledger_singletons()
    new_engine = AZREngineV32(storage=storage)
    stats = new_engine.memory.get_stats()

    # Verify stats reloaded
    assert stats["total_experiences"] >= 1

@pytest.mark.asyncio
async def test_evolution_hardened_snapshot(temp_storage):
    """
    STABILIZATION TEST 4: Evolution Hardened Snapshot
    Uses mocking to avoid heavy background analysis and verify storage effect.
    """
    storage = FileStorageProvider(temp_storage)
    evolution = EvolutionService(storage=storage)

    # Mocking system state to avoid timeout
    with patch.object(EvolutionService, 'get_latest_stats') as mock_stats:
        mock_stats.return_value = {
            "accuracy": 0.85,
            "latency": 150,
            "timestamp": "2026-03-03T03:00:00Z"
        }

        # Save snapshot
        await evolution.save_snapshot()

    # Verify file existence
    assert storage.exists(evolution.history_rel_path)

    # Verify data integrity in file
    raw_data = storage.read_text(evolution.history_rel_path)
    assert "accuracy" in raw_data
    assert "0.85" in raw_data

@pytest.mark.asyncio
async def test_consensus_fallback_mechanism(temp_storage):
    """
    STABILIZATION TEST 5: Consensus Recovery
    Ensures engine doesn't hang if no models are available.
    """
    storage = FileStorageProvider(temp_storage)
    engine = AZREngineV32(storage=storage)

    # Execute consensus without models
    result = await engine.consensus.vote(
        prompt="Execute cleanup?",
        options=["YES", "NO"]
    )

    assert "winner" in result
    assert "method" in result
    assert result["winner"] in ["YES", "NO"]
