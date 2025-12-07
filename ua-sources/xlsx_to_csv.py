import pandas as pd
import sys
import os

file_path = "/Users/dima-mac/Downloads/Березень_2024.xlsx"
csv_path = "/Users/dima-mac/Downloads/Березень_2024.csv"

print(f"Converting {file_path} to {csv_path}...")
try:
    # Use openpyxl engine
    df = pd.read_excel(file_path, engine="openpyxl")
    df.to_csv(csv_path, index=False)
    print("Conversion successful.")
except Exception as e:
    print(f"Conversion failed: {e}")
