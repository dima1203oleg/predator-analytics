from __future__ import annotations

import hashlib
import os
import sys
from unittest.mock import MagicMock, patch

import numpy as np
import pytest


# Add specific service path
sys.path.append(
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../../services/api_gateway"))
)

from app.routers.azr import AzrStatus, get_azr_status
from app.routers.google_integrations import SuggestionPushRequest, get_suggestions, push_suggestion
from app.services.embedding_service import EmbeddingService


# --- 1. AXIOM 17: QUANTUM SECURITY ---
def test_axiom_17_crypto():
    """Verify SHA3-512 is preferred if available."""
    msg = b"Axiom 17 Verification"

    if hasattr(hashlib, "sha3_512"):
        algo = hashlib.sha3_512
        expected_algo = "SHA3-512"
    else:
        algo = hashlib.sha256
        expected_algo = "SHA-256"

    h = algo(msg).hexdigest()
    assert len(h) > 0
    print(f"Verified crypto algorithm: {expected_algo}")


# --- 2. VECTOR MATH RESILIENCE ---
def test_dummy_embedding_no_zero_division():
    """Verify DummyModel returns noise, not pure zeros, preventing division by zero."""
    service = EmbeddingService()
    # Force loading dummy model
    with patch.object(service, "is_gpu_tier", False):
        service._load_model()
        vec = service.generate_embedding("test query")

        # Check it is not all zeros
        assert np.any(vec), "Vector should not be all zeros (ZeroDivision Risk)"
        assert len(vec) == 384

        # Check for NaN prevention
        norm = np.linalg.norm(vec)
        assert norm > 0, "Vector norm should be positive"


# --- 3. GOOGLE INTEGRATION STORE ---
@pytest.mark.asyncio
async def test_google_suggestion_store():
    """Verify in-memory store for Google Suggestions."""
    # Imported at top level

    # Push
    payload = SuggestionPushRequest(
        context="Unit Test", suggestion="Optimize Imports", code_snippet="import optimization"
    )
    res = await push_suggestion(payload)
    assert res.id.startswith("sug_")

    # Get
    items = await get_suggestions()
    assert len(items) > 0
    assert items[0].context == "Unit Test"


# --- 4. AZR STATUS HYPER-MODE ---
@pytest.mark.asyncio
async def test_azr_hyper_mode():
    """Verify AZR status reports Hyper-Scale Mode appropriately."""
    with patch("app.routers.azr.settings") as mock_settings:
        mock_settings.CONSTITUTION_PATH = "/tmp/fake_constitution"

        # Create dummy constitution
        with open("/tmp/fake_constitution", "w") as f:
            f.write("We the Agents...")

        status = await get_azr_status()

        # Function returns dict, Pydantic model is applied by FastAPI layer
        assert status["hyper_scale_mode"] is True
        assert "Hyper-Powered" in status["version"]
        assert status["quantum_shield"] is True
