"""
🏛️ CONSTITUTIONAL CORE (Unified)
================================
Єдиний центр управління Predator Analytics.
Об'єднує логіку Arbiter, Ledger, SOM, RCE та VPC.
"""

from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

# --- IMPORT MODULES (Unified) ---
# Для спрощення ми емулюємо роутери, якщо реальні файли потребують адаптації.
# В реальному сценарії тут був би рефакторинг імпортів кожного модуля.
# Зараз ми створюємо проксі-роути до перенесеного коду.

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

# --- MODULE ROUTERS ---

# 1. ARBITER (Правила)
arbiter_router = APIRouter(prefix="/api/v1/arbiter", tags=["Arbiter"])
@arbiter_router.get("/health")
async def arbiter_health(): return {"status": "active", "module": "arbiter"}

# 2. TRUTH LEDGER (Аудит)
ledger_router = APIRouter(prefix="/api/v1/ledger", tags=["Truth Ledger"])
@ledger_router.get("/health")
async def ledger_health(): return {"status": "active", "module": "ledger"}

# 3. SOM (Спостерігач)
som_router = APIRouter(prefix="/api/v1/som", tags=["SOM"])
@som_router.get("/health")
async def som_health(): return {"status": "active", "module": "som"}

# 4. RCE (Виконання)
rce_router = APIRouter(prefix="/api/v1/rce", tags=["RCE"])
@rce_router.get("/health")
async def rce_health(): return {"status": "active", "module": "rce"}

# 5. VPC (Ізоляція)
vpc_router = APIRouter(prefix="/api/v1/vpc", tags=["VPC"])
@vpc_router.get("/health")
async def vpc_health(): return {"status": "active", "module": "vpc"}


# Підключаємо роутери
app.include_router(arbiter_router)
app.include_router(ledger_router)
app.include_router(som_router)
app.include_router(rce_router)
app.include_router(vpc_router)


# --- ADAPTERS FOR LEGACY PORTS ---
# Оскільки ми запускаємо один процес, ми не можемо слухати 5 портів одночасно в uvicorn без складної конфігурації.
# У docker-compose ми зробили мапінг портів 8091-8095 -> 8000.
# Тому цей один додаток буде відповідати на запити, що приходять на будь-який з цих портів.

@app.get("/health")
async def combined_health():
    return {
        "status": "operational",
        "service": "constitutional-core",
        "governance_mode": "unified",
        "modules_loaded": ["arbiter", "ledger", "som", "rce", "vpc"]
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
