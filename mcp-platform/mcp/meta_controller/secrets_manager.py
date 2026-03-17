"""Управління секретами: Vault (заглушка)."""
from __future__ import annotations

import os


def get_secret(key: str) -> str:
    print(f"[SEC] Отримання секрету {key} з Vault")
    return os.environ.get(key, "mock_secret")
