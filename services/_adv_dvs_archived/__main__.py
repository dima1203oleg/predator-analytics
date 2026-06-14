"""
Entry point for ADV-DVS module
"""

import sys
from pathlib import Path

# Додавання шляху до проекту
sys.path.insert(0, str(Path(__file__).parent))

from main import main

if __name__ == '__main__':
    import asyncio
    asyncio.run(main())
