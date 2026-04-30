import sys

import pandas as pd

FILE_PATH = "/Users/dima-mac/Desktop/Березень_2024.xlsx"

def analyze_excel():
    try:
        # Read only the first few rows to get headers and sample data
        df = pd.read_excel(FILE_PATH, nrows=5)

        for _col in df.columns:
            pass



    except Exception:
        sys.exit(1)

if __name__ == "__main__":
    analyze_excel()
