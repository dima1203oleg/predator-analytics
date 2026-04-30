from __future__ import annotations

import asyncio
import contextlib

from sqlalchemy import select, text

from libs.core.database import get_db_ctx
from libs.core.models.truth_ledger import TruthLedger


async def corrupt_last_entry():
    async with get_db_ctx() as sess:
        # Find last entry
        stmt = select(TruthLedger).order_by(TruthLedger.id.desc()).limit(1)
        res = await sess.execute(stmt)
        entry = res.scalar_one_or_none()

        if not entry:
            return


        # Malicious Update via SQL injection style (bypassing ORM checks if any)
        # Direct SQL to modify hash without triggering python logic
        sql = text(f"UPDATE truth.truth_ledger SET current_hash = 'DEADBEEF00000000000000000000000000000000000000000000000000000000' WHERE id = {entry.id}")
        await sess.execute(sql)
        await sess.commit()

if __name__ == "__main__":
    with contextlib.suppress(Exception):
        asyncio.run(corrupt_last_entry())
