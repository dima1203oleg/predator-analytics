import os
import asyncio
import pandas as pd
from services.synthetic_data_engine.app.engine import DatasetGeneratorTrainer

async def test_pipeline():
    print("Testing Hybrid Pipeline...")
    engine = DatasetGeneratorTrainer()
    
    custom_schema = {
        "id": "uuid4",
        "date": "date_this_year",
        "company": "company",
        "amount": "pyfloat:min_value=100,max_value=500000",
        "risk_score": "random_int:min=0,max=1"
    }
    
    # 1. Zero Shot
    print("Running Zero Shot Generator...")
    zero_shot_result = await engine.zero_shot(domain="custom", num_rows=100, custom_schema=custom_schema)
    synthetic_path = zero_shot_result["dataset_path"]
    print(f"Synthetic data path: {synthetic_path}")
    
    synthetic_df = pd.read_parquet(synthetic_path)
    
    # 2. Hybrid Pipeline
    print("Running Hybrid Pipeline...")
    hybrid_result = await engine.hybrid_pipeline(
        real_data=synthetic_df,
        target_column="risk_score",
        synthetic_ratio=0.5
    )
    
    print(f"Hybrid Result: {hybrid_result['status']}")
    print(f"Metrics: {hybrid_result['metrics']}")
    print(f"Model Card Path: {hybrid_result['model_card_path']}")

if __name__ == "__main__":
    asyncio.run(test_pipeline())
