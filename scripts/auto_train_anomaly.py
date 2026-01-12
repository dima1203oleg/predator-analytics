import pandas as pd
import numpy as np
from sqlalchemy import create_engine
import logging
import os

# Setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AutoML")

DB_URL = "postgresql://predator:predator_password@localhost:5432/predator_db"

def train_anomaly_model():
    logger.info("🤖 Starting Auto-ML: Anomaly Detection for Customs Data...")

    # 1. Load Data (Chunk)
    engine = create_engine(DB_URL)
    query = """
    SELECT
        hs_code,
        CAST(mass_net AS FLOAT) as net_weight,
        CAST(calc_customs_gross_usd AS FLOAT) as customs_val
    FROM staging_march_2024
    WHERE mass_net != '' AND calc_customs_gross_usd != ''
    LIMIT 5000
    """

    try:
        df = pd.read_sql(query, engine)
        logger.info(f"Loaded {len(df)} records for training.")

        if df.empty:
            logger.warning("No data for training.")
            return

        # 2. Simple Rule-Based / Statistical Model
        # Calculate Average Price per KG per HS Code
        df['price_per_kg'] = df['customs_val'] / df['net_weight']
        df = df.replace([np.inf, -np.inf], np.nan).dropna()

        stats = df.groupby('hs_code')['price_per_kg'].agg(['mean', 'std', 'count']).reset_index()
        # Filter sparse codes
        stats = stats[stats['count'] > 5]

        # Define anomaly threshold (e.g. 2 std devs below mean)
        stats['lower_bound'] = stats['mean'] - (2 * stats['std'])

        # Save Model (JSON artifacts)
        model_path = "/Users/dima-mac/Documents/Predator_21/models/anomaly_prices_march_2024.json"

        # Ensure dir
        os.makedirs(os.path.dirname(model_path), exist_ok=True)

        stats.to_json(model_path, orient='records')
        logger.info(f"✅ Anomaly Model trained and saved to {model_path}")
        logger.info(f"Learned patterns for {len(stats)} HS codes.")

    except Exception as e:
        logger.error(f"Training failed: {e}")

if __name__ == "__main__":
    train_anomaly_model()
