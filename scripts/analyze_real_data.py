from __future__ import annotations

import os
import sys

import pandas as pd

FILE_PATH = "/Users/dima-mac/Desktop/Березень_2024.xlsx"

if not os.path.exists(FILE_PATH):
    sys.exit(1)

try:
    df = pd.read_excel(FILE_PATH, nrows=5)
    for _col in df.columns:
        pass


except Exception:
    pass
