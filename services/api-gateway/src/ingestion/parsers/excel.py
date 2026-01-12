
from typing import List, Dict, Any
import pandas as pd
from pathlib import Path
import hashlib

class ExcelParser:
    """
    Standardizes Excel ingestion for Predator Analytics v25.
    Handles:
    - .xlsx, .xls, .csv
    - dirty headers normalization
    - empty rows filtering
    """
    
    def __init__(self, file_path: Path):
        self.file_path = file_path
        self.df = None
        self.content_hash = ""

    def parse(self) -> List[Dict[str, Any]]:
        """Parses file and returns list of dictionaries (rows)."""
        if self.file_path.suffix == '.csv':
            self.df = pd.read_csv(self.file_path)
        else:
            self.df = pd.read_excel(self.file_path)
            
        # Calculate hash of content for idempotency
        self.content_hash = hashlib.md5(pd.util.hash_pandas_object(self.df, index=False).values).hexdigest()
        
        self.clean()
        return self.df.to_dict(orient='records')

    def clean(self):
        """Basic cleaning pipeline."""
        if self.df is not None:
            # Drop completely empty rows
            self.df.dropna(how='all', inplace=True)
            # Fill NaNs with None/Empty string for JSON compatibility
            self.df.fillna("", inplace=True)
            # Normalize headers: generic normalization
            self.df.columns = [str(c).strip().lower().replace(" ", "_").replace("\n", "_") for c in self.df.columns]
