"""
🏛️ CONSTITUTIONAL CORE (Unified Monolith)
=========================================
Реальне об'єднання логіки 5 сервісів.
Використовує Hybrid Mounting Strategy:
1. Include Router - для модулів, що вже мають /api/v1/... префікси (SOM, RCE, VPC)
2. Mount App - для модулів без префіксів (Arbiter, Ledger)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import logging

# --- IMPORT MODULES ---
try:
    from .modules.arbiter.app.main import app as arbiter_app
    from .modules.ledger.app.main import app as ledger_app
    from .modules.som.app.main import app as som_app
    from .modules.rce.app.main import app as rce_app
    from .modules.vpc.app.main import app as vpc_app
except ImportError as e:
    logging.error(f"❌ Failed to import modules: {e}")
    # Fallback placeholders
    arbiter_app = ledger_app = som_app = rce_app = vpc_app = FastAPI()

app = FastAPI(
    title="Predator Constitutional Core",
    description="Unified Governance & Security Service",
    version="28.6.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- HYBRID MOUNTING STRATEGY ---

# 1. ARBITER (No prefix in module -> Mount at /api/v1/arbiter)
# Original URL: /decide -> New URL: /api/v1/arbiter/decide
app.mount("/api/v1/arbiter", arbiter_app)

# 2. LEDGER (No prefix in module -> Mount at /api/v1/ledger)
# Original URL: /entry -> New URL: /api/v1/ledger/entry
app.mount("/api/v1/ledger", ledger_app)

# 3. SOM (Has /api/v1/som prefix -> Include Router)
# Original URL: /api/v1/som/health -> New URL: /api/v1/som/health (Preserved)
app.include_router(som_app.router)

# 4. RCE (Has /api/v1/rce prefix -> Include Router)
# Original URL: /api/v1/rce/analyze -> New URL: /api/v1/rce/analyze (Preserved)
app.include_router(rce_app.router)

# 5. VPC (Has /api/v1/vpc prefix -> Include Router)
# Original URL: /api/v1/vpc/verify -> New URL: /api/v1/vpc/verify (Preserved)
app.include_router(vpc_app.router)


@app.get("/health")
async def core_health():
    return {
        "status": "operational",
        "mode": "unified_monolith",
        "strategies": {
            "arbiter": "mounted_subapp",
            "ledger": "mounted_subapp",
            "som": "included_router",
            "rce": "included_router",
            "vpc": "included_router"
        }
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
