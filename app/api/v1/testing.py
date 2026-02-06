from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.services.auth_service import require_admin
from app.services.test_runner import get_test_runner


router = APIRouter(
    prefix="/testing",
    tags=["QA Lab"],
    dependencies=[Depends(require_admin)]
)

class TestRunRequest(BaseModel):
    suite_type: str = "unit"  # unit, integration, load, security

class TestRunResponse(BaseModel):
    status: str
    logs: list[str]
    duration: str
    raw_output: str | None = None

@router.post("/run", response_model=TestRunResponse)
async def run_test_suite(request: TestRunRequest):
    """Execute a test suite on the backend.

    Types:
    - 'unit': Pytest unit tests (logic)
    - 'integration': API integration tests
    - 'load': Simulated load testing
    - 'security': Vulnerability scan simulation
    """
    service = get_test_runner()

    try:
        result = await service.run_test_suite(request.suite_type)
        return TestRunResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
async def get_qa_status():
    """Get overall QA Lab system status."""
    return {
        "status": "ready",
        "available_suites": ["unit", "integration", "load", "security"],
        "runner_version": "pytest-7.4.3"
    }
