from __future__ import annotations

import os
import sys

import pandas as pd


FILE_PATH = "/Users/dima-mac/Desktop/Березень_2024.xlsx"

if not os.path.exists(FILE_PATH):
    print(f"❌ File not found: {FILE_PATH}")
    sys.exit(1)

print(f"📂 Loading: {FILE_PATH} ...")
try:
    df = pd.read_excel(FILE_PATH, nrows=5)
    print("\n✅ Columns found:")
    for col in df.columns:
        print(f"  - {col}")

    print("\n📊 First row sample:")
    print(df.iloc[0].to_dict())

except Exception as e:
    print(f"❌ Error reading Excel: {e}")
