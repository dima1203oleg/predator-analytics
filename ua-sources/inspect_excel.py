import pandas as pd
import sys

file_path = "/Users/dima-mac/Downloads/Березень_2024.xlsx"
try:
    # Read only headers (nrows=0)
    df = pd.read_excel(file_path, nrows=0)
    print("Columns found:")
    for col in df.columns:
        print(f" - {col}")
except Exception as e:
    print(f"Error reading excel: {e}")
