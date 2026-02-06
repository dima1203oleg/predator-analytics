try:
    import fastapi
    print("fastapi: OK")
except ImportError:
    print("fastapi: MISSING")

try:
    import uvicorn
    print("uvicorn: OK")
except ImportError:
    print("uvicorn: MISSING")

try:
    import sqlalchemy
    print("sqlalchemy: OK")
except ImportError:
    print("sqlalchemy: MISSING")

try:
    import structlog
    print("structlog: OK")
except ImportError:
    print("structlog: MISSING")

try:
    import telethon
    print("telethon: OK")
except ImportError:
    print("telethon: MISSING")
