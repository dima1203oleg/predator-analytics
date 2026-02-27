from __future__ import annotations


#!/usr/bin/env python3
"""Seed demo data for Predator v45 | Neural Analytics."""
from datetime import datetime, timedelta
import random

import requests


BASE_URL = "http://localhost:8090/api"

def seed_cases():
    """Create demo cases via API."""
    sectors = ["GOV", "BIZ", "MED", "SCI"]
    statuses = ["NEW", "IN_PROGRESS", "RESOLVED"]

    for i in range(10):
        case_data = {
            "title": f"Аномалія #{i+1}: Підозріла активність",
            "description": f"Виявлено підозрілу активність в секторі {random.choice(sectors)}",
            "status": random.choice(statuses),
            "sector": random.choice(sectors),
            "risk_score": round(random.uniform(0.3, 0.95), 2),
            "tenant_id": "default"
        }

        try:
            resp = requests.post(f"{BASE_URL}/v45/cases", json=case_data, timeout=5)
            if resp.status_code in [200, 201]:
                print(f"✅ Created case #{i+1}")
            else:
                print(f"⚠️  Case #{i+1} failed: {resp.status_code}")
        except Exception as e:
            print(f"❌ Error creating case #{i+1}: {e}")

if __name__ == "__main__":
    print("🌱 Seeding demo data...")
    seed_cases()
    print("✅ Done!")
