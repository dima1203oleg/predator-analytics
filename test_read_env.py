from __future__ import annotations

import os


try:
    with open('.env') as f:
        print("PYTHON READ SUCCESS")
        print(f.readline())
except Exception as e:
    print(f"PYTHON READ FAILED: {e}")
