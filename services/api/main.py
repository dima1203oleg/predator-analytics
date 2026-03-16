"""Module: main
Component: api
Predator Analytics v45.1.
"""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from services.api.routes import analytics, health, insights, osint_ua
from services.shared.logging_config import setup_logging

setup_logging("predator-api")
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Predator Analytics API",
    version="25.1",
    description="Primary User-Facing API for the Predator Platform",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS (Allow UI access)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routes
app.include_router(health.router, tags=["Health"])
app.include_router(analytics.router, prefix="/v1/analytics", tags=["Analytics"])
app.include_router(insights.router, prefix="/v1/insights", tags=["Insights"])
app.include_router(osint_ua.router, prefix="/v1/osint_ua", tags=["OSINT UA"])


@app.get("/")
async def root():
    return {"system": "Predator Analytics", "status": "online", "version": "25.1"}
