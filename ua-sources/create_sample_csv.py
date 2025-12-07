import pandas as pd
import sys

file_path = "/Users/dima-mac/Downloads/Березень_2024.xlsx"
csv_path = "/Users/dima-mac/Downloads/Березень_2024.csv"

print(f"Reading first 1000 rows from {file_path}...")
try:
    df = pd.read_excel(file_path, nrows=1000)
    df.to_csv(csv_path, index=False)
    print("Sample conversion successful.")
except Exception as e:
    print(f"Sample conversion failed: {e}")
