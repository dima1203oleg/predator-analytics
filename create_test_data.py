from __future__ import annotations

from datetime import datetime, timedelta
import random

import pandas as pd


data = []
importers = ["TOV Logistics", "UkrImport", "Global Trade LLC", "Standard-MT"]
exporters = ["China Exp Ltd", "EU Goods Corp", "US Tech Solutions", "Zhejiang Trading"]
goods = [
    "Electronics: Smartwatches", "Agricultural Machinery Spare Parts",
    "Chemical Reagents for Lab", "Textiles: Cotton Fabric",
    "Car Parts: Brake Pads", "Industrial Sensors"
]

for i in range(1, 1001):
    data.append({
        "declaration_id": f"UA-2025-{i:04d}",
        "date": (datetime(2025, 1, 1) + timedelta(days=random.randint(0, 350))).strftime("%Y-%m-%d"),
        "importer": random.choice(importers),
        "exporter": random.choice(exporters),
        "goods_description": random.choice(goods),
        "value_USD": round(random.uniform(500, 50000), 2),
        "HS_code": str(random.randint(84000000, 85999999))
    })

df = pd.DataFrame(data)
df.to_excel("custom_declarations_registry.xlsx", index=False)
print("Created custom_declarations_registry.xlsx with 1000 rows.")
