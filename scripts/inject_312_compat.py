from __future__ import annotations

import os
import sys


# PREDATOR AZR COMPATIBILITY INJECTOR
# Enforces 3.12 syntax capability on legacy runtimes.

ROOT = "/Users/dima-mac/Documents/Predator_21"
DIRS = ["libs", "agents", "scripts", "services"]

def inject():
    count = 0
    for d in DIRS:
        path = os.path.join(ROOT, d)
        if not os.path.exists(path): continue

        for root, _, files in os.walk(path):
            if any(x in root for x in [".venv", "__pycache__", "node_modules"]): continue
            for f in files:
                if f.endswith(".py"):
                    file_path = os.path.join(root, f)
                    try:
                        with open(file_path) as file:
                            content = file.read()

                        if "from __future__ import annotations" not in content[:500]:
                            new_content = "from __future__ import annotations\n" + content
                            with open(file_path, 'w') as file:
                                file.write(new_content)
                            count += 1
                            print(f"✅ Injected: {f}")
                    except Exception as e:
                        print(f"❌ Failed {f}: {e}")
    print(f"\n🚀 Total files stabilized: {count}")

if __name__ == "__main__":
    inject()
