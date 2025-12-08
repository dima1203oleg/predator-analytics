
import asyncio
import logging
import uuid
import sys
import os
from unittest.mock import MagicMock, patch

from sqlalchemy import text

# Add parent directory to path
sys.path.append(os.getcwd())

from app.services.si_orchestrator import SIOrchestrator, SignalCollector
from app.models import Document, SICycle, AugmentedDataset
from app.core.db import async_session_maker, init_db

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("verify_si_loop")

async def seed_dummy_document(session):
    """Ensure at least one document exists for augmentation."""
    result = await session.execute(
        text("SELECT id FROM documents LIMIT 1")
    )
    doc = result.scalar()
    
    if not doc:
        logger.info("🌱 Seeding dummy document...")
        new_doc = Document(
            title="Test Doc for SIO",
            content="This is a test document about artificial intelligence and self-improvement loops.",
            source_type="script",
            meta={"category": "test"},
            tenant_id=uuid.uuid4()
        )
        session.add(new_doc)
        await session.commit()
        return new_doc.id
    return doc

async def verify_sio_flow():
    logger.info("🧪 Starting Self-Improvement Loop Verification...")
    
    # 0. Init DB Tables
    logger.info("📦 Initializing DB Schema...")
    await init_db()
    
    # 1. Setup Wrapper wrapper to intercept get_signals
    orchestrator = SIOrchestrator()
    
    # Force diagnosis to trigger "quality_drop"
    async def mock_get_signals():
        logger.info("📊 Mocking Signals: Low NDCG detected")
        return {
            "ndcg_at_10": 0.65, # Below 0.80 threshold
            "latency_p95": 200,
            "error_rate": 0.00,
            "cost_daily": 10.0
        }
    
    orchestrator.collector.get_signals = mock_get_signals
    
    # 2. Run Cycle
    cycle_id = uuid.uuid4()
    
    async with async_session_maker() as session:
        # Seed data
        try:
            await seed_dummy_document(session)
        except Exception as e:
            logger.error(f"Failed to seed DB (is Postgres running?): {e}")
            import traceback
            traceback.print_exc()
            return
            
        logger.info(f"🔄 Executing Cycle {cycle_id}...")
        try:
            await orchestrator.run_cycle(cycle_id)
        except Exception as e:
            logger.error(f"Cycle execution failed: {e}")
            import traceback
            traceback.print_exc()
            return

        # 3. Verify Persistence
        logger.info("🔍 Verifying Database Persistence...")
        
        # Check SICycle
        cycle_res = await session.execute(
            text(f"SELECT status, trigger_type FROM si_cycles WHERE id = '{cycle_id}'")
        )
        cycle_row = cycle_res.first()
        
        if cycle_row:
            logger.info(f"✅ SICycle Found: Status={cycle_row[0]}, Trigger={cycle_row[1]}")
        else:
            logger.error("❌ SICycle NOT found!")
            
        # Check AugmentedDataset
        # We assume the loop ran 'augment_data'
        aug_res = await session.execute(
            text("SELECT COUNT(*) FROM augmented_datasets")
        )
        aug_count = aug_res.scalar()
        logger.info(f"✅ Augmented Records Count: {aug_count}")
        
        if cycle_row and cycle_row[0] == 'succeeded' and aug_count > 0:
             logger.info("🚀 VERIFICATION SUCCESSFUL: full SIO loop executed and persisted.")
        else:
             logger.warning("⚠️ Verification partial or failed.")

if __name__ == "__main__":
    try:
        if os.name == 'nt':
            asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        asyncio.run(verify_sio_flow())
    except KeyboardInterrupt:
        pass
