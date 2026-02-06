import sys

import pandas as pd


FILE_PATH = "/Users/dima-mac/Desktop/Березень_2024.xlsx"

def analyze_excel():
    print(f"🔍 Analyzing {FILE_PATH}...")
    try:
        # Read only the first few rows to get headers and sample data
        df = pd.read_excel(FILE_PATH, nrows=5)

        print("\n📋 Columns detected:")
        for col in df.columns:
            print(f" - {col}")

        print("\n👀 Sample Data (first row):")
        print(df.iloc[0].to_dict())

        print("\n📊 Data Types:")
        print(df.dtypes)

    except Exception as e:
        print(f"❌ Error analyzing Excel: {e}")
        sys.exit(1)

if __name__ == "__main__":
    analyze_excel()
