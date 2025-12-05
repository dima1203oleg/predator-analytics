"""API Routes Aggregator"""
from fastapi import APIRouter
from .routers import search, analytics, opponent, etl

api_router = APIRouter()
api_router.include_router(search.router)
api_router.include_router(analytics.router)
api_router.include_router(opponent.router)
api_router.include_router(etl.router)
