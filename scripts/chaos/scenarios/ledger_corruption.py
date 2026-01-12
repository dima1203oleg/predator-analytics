
import asyncio
import sys
import os
from sqlalchemy import select, update, text
from libs.core.database import get_db_ctx
from libs.core.models.truth_ledger import TruthLedger

async def corrupt_last_entry():
    print("🔥 [CHAOS] Attempting Ledger Corruption...")
    async with get_db_ctx() as sess:
        # Find last entry
        stmt = select(TruthLedger).order_by(TruthLedger.id.desc()).limit(1)
        res = await sess.execute(stmt)
        entry = res.scalar_one_or_none()

        if not entry:
            print("❌ No entries to corrupt.")
            return

        print(f"🎯 Target: Ledger ID {entry.id}, Hash: {entry.current_hash[:8]}...")

        # Malicious Update via SQL injection style (bypassing ORM checks if any)
        # Direct SQL to modify hash without triggering python logic
        sql = text(f"UPDATE truth.truth_ledger SET current_hash = 'DEADBEEF00000000000000000000000000000000000000000000000000000000' WHERE id = {entry.id}")
        await sess.execute(sql)
        await sess.commit()
        print("✅ [CHAOS] Corruption Applied. Hash destroyed.")

if __name__ == "__main__":
    try:
        asyncio.run(corrupt_last_entry())
    except Exception as e:
        print(f"Error: {e}")
