"""Проста стратегія прийняття рішень (заглушка)."""
from __future__ import annotations


def decide(event: str) -> str:
    if "fail" in event:
        return "rollback"
    if "vuln" in event:
        return "block"
    if "feature" in event:
        return "add_feature"
    return "refactor"
