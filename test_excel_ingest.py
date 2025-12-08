import pandas as pd
import os
import sys

FILE_PATH = "/Users/dima-mac/Downloads/Березень_2024.xlsx"

def analyze_excel(path):
    print(f"🔍 Analyzing: {path}")
    
    try:
        # Load header and few rows
        # engine='openpyxl' usually safer for .xlsx
        df = pd.read_excel(path, nrows=10, engine='openpyxl')
        
        print("\n✅ File loaded successfully (preview).")
        print(f"📊 Total Columns: {len(df.columns)}")
        print(f"📋 Columns found: \n {list(df.columns)}")
        
        # Check for empty columns
        empty_cols = [col for col in df.columns if "Unnamed" in str(col)]
        if empty_cols:
            print(f"⚠️ Warning: Found {len(empty_cols)} unnamed columns (possible merging issue).")

        # Data Preview
        print("\n📝 Data Sample (First 2 rows):")
        print(df.head(2).to_markdown(index=False))
        
        # Structure analysis for Customs
        keywords = ['код', 'товар', 'варт', 'митн', 'країн', 'code', 'goods', 'price', 'country']
        matches = [col for col in df.columns if any(k in str(col).lower() for k in keywords)]
        
        if matches:
            print(f"\n✅ Identified potential Customs Data columns: {matches}")
            print("🚀 Readiness for Import: HIGH")
        else:
            print(f"\n⚠️ Did not find standard customs keywords. Mapped columns might be needed.")
            print("🚀 Readiness for Import: LOW (Manual Mapping Required)")

    except Exception as e:
        print(f"\n❌ Error reading file: {e}")
        # Hint about dependencies
        import importlib.util
        if not importlib.util.find_spec("openpyxl"):
             print("💡 Hint: 'openpyxl' library might be missing. Install it.")

if __name__ == "__main__":
    analyze_excel(FILE_PATH)
