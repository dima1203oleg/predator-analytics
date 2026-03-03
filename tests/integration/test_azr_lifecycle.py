import pytest
import asyncio
from pathlib import Path
import tempfile
import shutil
from app.services.azr_engine_v32 import AZREngineV32

@pytest.fixture
async def engine():
    from app.libs.core import merkle_ledger
    merkle_ledger._ledger_instance = None
    tmpdir = tempfile.mkdtemp()
    # Explicitly set AZR_HOME for testing
    with pytest.MonkeyPatch().context() as mp:
        mp.setenv("AZR_HOME", tmpdir)
        engine = AZREngineV32(azr_root=tmpdir)
        yield engine
        # cleanup
        if Path(tmpdir).exists():
            shutil.rmtree(tmpdir)

@pytest.mark.asyncio
async def test_engine_lifecycle_and_infrastructure(engine):
    """
    Ensure engine can start and automatically creates necessary infrastructure.
    """
    # Start engine (this triggers ensure_infrastructure)
    await engine.start()
    
    # Now it should be running
    status = engine.get_status()
    assert status["is_running"] is True
    assert "engine" in status

@pytest.mark.asyncio
async def test_engine_memory_write(engine):
    """
    Test that engine can write to memory using the new architecture.
    """
    from app.services.azr_engine_v32 import AZRAction
    await engine.start()
    
    action = AZRAction(id="test-1", type="SHELL", fingerprint="abc", meta={})
    
    # Use real method name
    engine.memory.record_experience(action, outcome="SUCCESS", impact_score=0.8)
    
    # Check file (ExperienceMemory uses experience_memory.jsonl)
    assert engine.storage.exists("experience/experience_memory.jsonl")
    content = engine.storage.read_text("experience/experience_memory.jsonl")
    assert "SUCCESS" in content
