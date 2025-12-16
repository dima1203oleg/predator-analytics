import asyncio
import os
import sys

# Ensure we can import from parent directories
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from telegram.bot import main

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
