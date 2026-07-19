#!/usr/bin/env python3
import sys
import os
import json
import logging
import random

# Add services to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'services', 'core-api', 'app'))
from services.ml.osint_automl import OsintAutoML

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

def generate_mock_data(n_samples=500):
    logger.info(f"Generating {n_samples} mock OSINT profiles...")
    data = []
    for i in range(n_samples):
        # 20% high risk
        is_high_risk = 1 if random.random() < 0.2 else 0
        
        # High risk individuals have more bad things
        taxes_debt = random.randint(10000, 1000000) if is_high_risk else random.randint(0, 5000)
        courts_cases = random.randint(3, 15) if is_high_risk else random.randint(0, 2)
        vulnerabilities = random.randint(2, 10) if is_high_risk else random.randint(0, 1)
        darknet = random.randint(5, 50) if is_high_risk else random.randint(0, 2)
        onion = True if is_high_risk and random.random() < 0.7 else False
        interpol = True if is_high_risk and random.random() < 0.3 else False
        
        profile = {
            "id": f"person_{i}",
            "type": "person",
            "taxes": {"debt": f"{taxes_debt} UAH"},
            "courts": {"totalCases": courts_cases, "criminalCases": int(courts_cases / 2)},
            "cyber": {
                "vulnerabilities": [f"CVE-MOCK-{j}" for j in range(vulnerabilities)],
                "darknetMentions": darknet,
                "hasOnionLinks": onion
            },
            "interpol": {"isWanted": interpol},
            "is_high_risk": is_high_risk
        }
        data.append(profile)
    return data

def main():
    logger.info("Initializing OSINT AutoML Pipeline...")
    automl = OsintAutoML()
    
    # 1. Generate Mock Data
    mock_data = generate_mock_data(n_samples=1000)
    
    # 2. Unsupervised Anomaly Detection
    logger.info("--- Phase 1: Anomaly Detection (Unsupervised) ---")
    anomalies = automl.detect_anomalies(mock_data)
    logger.info(f"Found {len(anomalies)} anomalies. Saving sample to 'anomalies.json'")
    
    # Save anomalies for manual review
    with open("anomalies.json", "w") as f:
        # Just save the first 5 for review
        sample = anomalies.head(5).to_dict(orient="records")
        json.dump(sample, f, indent=2)

    # 3. Supervised Risk Scoring with Optuna
    logger.info("--- Phase 2: Risk Scoring (Supervised + Optuna) ---")
    metrics = automl.train_risk_model(mock_data, n_trials=20)
    
    if metrics:
        logger.info("--- Final Pipeline Metrics ---")
        logger.info(json.dumps(metrics, indent=2))
    
    logger.info("AutoML Pipeline complete.")

if __name__ == "__main__":
    main()
