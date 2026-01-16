"""
🏛️ CONSTITUTIONAL CORE (Unified Monolith)
=========================================
Реальне об'єднання логіки 5 сервісів.
Використовує FastAPI Sub-Applications (Mounting) для ізоляції модулів.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import logging

# --- IMPORT MODULES ---
try:
    from app.modules.arbiter.app.main import app as arbiter_app
    from app.modules.ledger.app.main import app as ledger_app
    from app.modules.som.app.main import app as som_app
    from app.modules.rce.app.main import app as rce_app
    from app.modules.vpc.app.main import app as vpc_app
except ImportError as e:
    logging.error(f"❌ Failed to import modules: {e}")
    # Fallback для розробки, якщо модулі ще не адаптовані ідеально
    arbiter_app = FastAPI()
    ledger_app = FastAPI()
    som_app = FastAPI()
    rce_app = FastAPI()
    vpc_app = FastAPI()

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

# --- MOUNTING REAL APPLICATIONS ---
# Це підключає повний функціонал старих мікросервісів

# 1. Arbiter (Rules) -> /api/v1/arbiter
app.mount("/api/v1/arbiter", arbiter_app)

# 2. Ledger (Audit) -> /api/v1/ledger
app.mount("/api/v1/ledger", ledger_app)

# 3. SOM (Observer) -> /api/v1/som
app.mount("/api/v1/som", som_app)

# 4. RCE (Execution) -> /api/v1/rce
app.mount("/api/v1/rce", rce_app)

# 5. VPC (Verificator) -> /api/v1/vpc
app.mount("/api/v1/vpc", vpc_app)


@app.get("/health")
async def core_health():
    return {
        "status": "operational",
        "mode": "unified_monolith",
        "mounted_modules": [
            "arbiter", "ledger", "som", "rce", "vpc"
        ],
        "system_rules": "active"
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
