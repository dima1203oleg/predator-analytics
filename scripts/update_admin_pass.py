from __future__ import annotations

import asyncio
import hashlib
import os
import secrets

import asyncpg


# Configuration from .env or defaults
DB_URL = os.getenv("DATABASE_URL", "postgresql://predator:predator_password@localhost:5432/predator_db").replace("postgresql+asyncpg://", "postgresql://")

def hash_password(password: str) -> str:
    """Hash password with salt using SHA256."""
    salt = secrets.token_hex(16)
    hashed = hashlib.sha256((salt + password).encode()).hexdigest()
    return f"{salt}:{hashed}"

async def main():
    print("Connecting to database to set admin password to '666666'...")
    try:
        conn = await asyncpg.connect(DB_URL)

        # Hash '666666'
        new_hash = hash_password("666666")

        # Update or Insert admin user
        # User ID 1 is usually the admin
        await conn.execute("""
            INSERT INTO gold.users (id, email, password_hash, username, role, subscription_level, can_view_pii, created_at)
            VALUES (1, 'admin@predator.io', $1, 'admin', 'admin', 'pro', True, NOW())
            ON CONFLICT (id) DO UPDATE SET password_hash = $1, role = 'admin', can_view_pii = True;
        """, new_hash)

        # Also ensure email conflict is handled
        await conn.execute("""
            UPDATE gold.users SET id = 1 WHERE email = 'admin@predator.io' AND id != 1;
        """)

        print("✅ Password for admin@predator.io successfully set to '666666'")
        await conn.close()
    except Exception as e:
        print(f"❌ Failed to update password: {e}")

if __name__ == "__main__":
    asyncio.run(main())
