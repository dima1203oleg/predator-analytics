"""🔐 SOVEREIGN JWT HANDLER - Native JWT implementation without external deps.
========================================================================
Core component for AZR v40 Sovereign Architecture.
Provides secure token generation and verification using HMAC-SHA256.
"""

import base64
import hashlib
import hmac
import json
import time
from typing import Any


# Secret key should be in environment in production
SECRET_KEY = "PREDATOR_SOVEREIGN_MASTER_KEY_v45"
ALGORITHM = "HS256"


def _base64_url_encode(data: bytes) -> str:
    """Encode bytes to base64url string."""
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _base64_url_decode(text: str) -> bytes:
    """Decode base64url string to bytes."""
    padding = "=" * (4 - len(text) % 4)
    return base64.urlsafe_b64decode(text + padding)


def create_access_token(data: dict[str, Any], expires_delta: int = 3600) -> str:
    """Create a signed JWT token."""
    header = {"alg": ALGORITHM, "typ": "JWT"}

    payload = data.copy()
    payload.update(
        {
            "exp": int(time.time()) + expires_delta,
            "iat": int(time.time()),
            "iss": "predator-sovereign-core",
        }
    )

    header_json = json.dumps(header, sort_keys=True).encode("utf-8")
    payload_json = json.dumps(payload, sort_keys=True).encode("utf-8")

    header_b64 = _base64_url_encode(header_json)
    payload_b64 = _base64_url_encode(payload_json)

    signing_input = f"{header_b64}.{payload_b64}".encode()
    signature = hmac.new(SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()

    signature_b64 = _base64_url_encode(signature)

    return f"{header_b64}.{payload_b64}.{signature_b64}"


def decode_access_token(token: str) -> dict[str, Any] | None:
    """Verify and decode a JWT token."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None

        header_b64, payload_b64, signature_b64 = parts

        # Verify Signature
        signing_input = f"{header_b64}.{payload_b64}".encode()
        expected_signature = hmac.new(
            SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256
        ).digest()

        if _base64_url_encode(expected_signature) != signature_b64:
            return None

        # Decode Payload
        payload_json = _base64_url_decode(payload_b64)
        payload = json.loads(payload_json.decode("utf-8"))

        # Check Expiration
        if payload.get("exp", 0) < time.time():
            return None

        return payload
    except Exception:
        return None
