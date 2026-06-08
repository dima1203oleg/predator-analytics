import json
import os
import sqlite3
import uuid

storage_path = os.path.expanduser("~/Library/Application Support/Cursor/User/globalStorage/storage.json")
db_path = os.path.expanduser("~/Library/Application Support/Cursor/User/globalStorage/state.vscdb")
token = "crsr_f9e8937ebd63dfecf06ea06270114a950f92e0d9ae8097b40a291544f3608a6f"

print("🦅 PREDATOR SURGEON: Starting...")

# 1. Update storage.json
try:
    with open(storage_path) as f:
        data = json.load(f)

    data["telemetry.devDeviceId"] = str(uuid.uuid4())
    data["telemetry.machineId"] = str(uuid.uuid4())

    with open(storage_path, 'w') as f:
        json.dump(data, f, indent=4)
    print("✅ storage.json updated (devDeviceId & machineId)")
except Exception as e:
    print(f"❌ storage.json error: {e}")

# 2. Update state.vscdb
try:
    # Attempt to connect even if locked
    conn = sqlite3.connect(f"file:{db_path}?mode=rw", uri=True)
    cursor = conn.cursor()

    # Try to set Pro status
    cursor.execute("INSERT OR REPLACE INTO itemTable (key, value) VALUES ('cursorAuth/accessToken', ?)", (token,))
    cursor.execute("INSERT OR REPLACE INTO itemTable (key, value) VALUES ('cursorAuth/stripeMembershipType', 'pro')")

    conn.commit()
    conn.close()
    print("✅ state.vscdb updated (PRO Status injected)")
except Exception as e:
    print(f"❌ state.vscdb error: {e}")
    print("💡 Possible reason: Cursor is holding an exclusive lock on the database.")
