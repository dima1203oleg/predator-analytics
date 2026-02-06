from __future__ import annotations

import os
import sys


# Add scripts to path
project_root = "/Users/dima-mac/Documents/Predator_21"
scripts_dir = os.path.join(project_root, "scripts")
sys.path.insert(0, scripts_dir)

try:
    from triple_cli import MixedCLIStack
    stack = MixedCLIStack()
    print("✅ MixedCLIStack initialized successfully")
    print(f"Environment: {stack.env}")
    print(f"Gemini Key: {'Found' if stack.gemini_key else 'Missing'}")
    print(f"Mistral Key: {'Found' if stack.mistral_key else 'Missing'}")
except Exception as e:
    print(f"❌ Failed to initialize MixedCLIStack: {e}")
