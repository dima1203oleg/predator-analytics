from __future__ import annotations

import asyncio
from datetime import datetime
import json
import logging
import os

import h2o
from h2o.automl import H2OAutoML
import pandas as pd
from sqlalchemy import select

try:
    from app.libs.core.config import settings
    from app.libs.core.database import get_db_ctx
    from app.libs.core.models.entities import AugmentedDataset, MLJob
except ImportError:
    from libs.core.config import settings
    from libs.core.database import get_db_ctx
    from libs.core.models.entities import AugmentedDataset, MLJob


logger = logging.getLogger("h2o_manager")
logger.setLevel(logging.INFO)

H2O_URL = os.getenv("H2O_URL", "http://predator_h2o_automl:54321")

class H2OManager:
    def __init__(self):
        self.connected = False
        self.active_models = {}

    async def ensure_connection(self):
        """Connects to H2O cluster."""
        try:
            # Check async execution context, use executor for blocking calls
            loop = asyncio.get_running_loop()
            await loop.run_in_executor(None, lambda: h2o.init(url=H2O_URL, verbose=False))
            self.connected = True
            logger.info(f"✅ Connected to H2O Cluster at {H2O_URL}")
        except Exception as e:
            logger.exception(f"❌ Failed to connect to H2O: {e}")
            self.connected = False

    async def train_anomaly_classifier(self, job_id: str):
        """Trains a Supervisor Model (AutoML) to detect anomalies based on the generated dataset.
        Target: predict 'risk_high' (Boolean) based on input data fields.
        """
        if not self.connected:
            await self.ensure_connection()
            if not self.connected:
                return {"status": "failed", "error": "H2O Connection Failed"}

        logger.info(f"🚀 Starting H2O AutoML Training Job: {job_id}")

        # 1. Fetch Data from Postgres
        async with get_db_ctx() as sess:
            # Fetch raw content (JSON string)
            stmt = select(AugmentedDataset.content).limit(10000)
            result = await sess.execute(stmt)
            raw_rows = result.scalars().all()

            if not raw_rows:
                logger.warning("No data found in DB for training.")
                return {"status": "skipped", "reason": "no_data"}

            # Parse JSON strings with robustness
            import json
            import re

            def safe_json_loads(json_str):
                try:
                    return json.loads(json_str)
                except json.JSONDecodeError:
                    # Attempt to fix common issues: invalid escape sequences
                    # Replace single backslashes that are NOT followed by a valid escape char with double backslashes
                    try:
                        # This regex finds backslashes not followed by ", \, /, b, f, n, r, t, u
                        fixed_str = re.sub(r'\\(?![\\"/bfnrtu])', r'\\\\', json_str)
                        return json.loads(fixed_str)
                    except Exception:
                        return None

            rows = []
            failed_count = 0
            for r in raw_rows:
                if not r:
                    continue
                parsed = safe_json_loads(r)
                if parsed:
                    if isinstance(parsed, list):
                        rows.extend(parsed)
                    else:
                        rows.append(parsed)
                else:
                    failed_count += 1

            if failed_count > 0:
                logger.warning(f"⚠️ Failed to parse {failed_count} JSON rows due to formatting errors. Proceeding with {len(rows)} valid rows.")

            if not rows:
                logger.error("All rows failed to parse.")
                return {"status": "failed", "reason": "all_json_parse_errors"}

            # 'rows' contains a list of dicts
            # Create Pandas DataFrame directly
            df = pd.DataFrame(rows)

            if df.empty:
                logger.error("DataFrame is empty after loading from DB.")
                return {"status": "failed", "reason": "empty_dataframe"}

            # Feature Engineering: Create Target and Restore Features
            # 1. Generate Target (Extract from text or Heuristic)

            # Step A: Try to use existing column
            if "risk_score" in df.columns:
                df["risk_score"] = pd.to_numeric(df["risk_score"], errors='coerce')
            else:
                df["risk_score"] = float("nan")

            # Step B: Extract 'Risk Score: 0.87' from 'output' text if column is NaN
            # Regex looks for "Risk Score:" or "Score:" followed by a number between 0 and 1
            import re
            risk_pattern = r"(?:Risk|Anomaly)\s*Score[:\s]+(0?\.\d+|1\.0|1)"

            def extract_score(row):
                if pd.notna(row.get("risk_score")):
                    return row["risk_score"]

                text = str(row.get("output", "")) + " " + str(row.get("instruction", ""))
                match = re.search(risk_pattern, text, re.IGNORECASE)
                if match:
                    try:
                        return float(match.group(1))
                    except:
                        pass
                return float("nan")

            # Apply extraction
            df["extracted_score"] = df.apply(extract_score, axis=1)

            # Update risk_score where we found a value
            df["risk_score"] = df["risk_score"].fillna(df["extracted_score"])

            # Step C: Fallback Heuristic (smarter keywords) if still NaN
            # We treat NaN as 'low risk' (0.1) unless keywords suggest otherwise
            def fallback_heuristic(row):
                if pd.notna(row.get("risk_score")):
                    return row["risk_score"]

                text = str(row.get("instruction", "")) + " " + str(row.get("output", ""))
                text_lower = text.lower()

                # Strong indicators of anomaly
                high_risk_keywords = ["detected", "alert", "critical", "breach", "unauthorized", "malicious", "attack", "fraud confirmed"]
                # Indicators of normal behavior
                low_risk_keywords = ["normal", "routine", "verified", "safe", "legitimate", "success", "no issues"]

                if any(k in text_lower for k in high_risk_keywords):
                    return 0.9
                if any(k in text_lower for k in low_risk_keywords):
                    return 0.1

                # Default uncertain
                return 0.0

            df["risk_score"] = df.apply(fallback_heuristic, axis=1)

            # Finalize Target
            # Anomaly is defined dynamically as the top 15% of risk scores
            # to ensure we are actually detecting 'anomalies' and not just 'high risk'
            threshold = df["risk_score"].quantile(0.85)
            # Ensure threshold is at least 0.70 to avoid labeling everything as anomaly if scores are low
            threshold = max(0.70, threshold)

            df["is_anomaly"] = (df["risk_score"] >= threshold).astype(int)
            logger.info(f"📊 Adaptive Threshold set to {threshold:.2f}")

            # Check class balance
            anomaly_count = df["is_anomaly"].sum()
            total_count = len(df)

            logger.info(f"📊 Feature Extraction: Found {df['extracted_score'].count()} explicit scores out of {total_count} rows.")

            if anomaly_count < 10 or anomaly_count > (total_count - 10):
                logger.warning(f"⚠️ Imbalanced classes (Anomalies: {anomaly_count}/{total_count}). Forcing synthetic balance for training stability.")
                # Force at least 15% minority class
                target_minority_size = int(total_count * 0.15)

                if anomaly_count < target_minority_size:
                    # Created more anomalies
                    flip_indices = df[df["is_anomaly"] == 0].sample(n=target_minority_size - anomaly_count).index
                    df.loc[flip_indices, "is_anomaly"] = 1
                else:
                    # Create more normals
                    flip_indices = df[df["is_anomaly"] == 1].sample(n=anomaly_count - (total_count - target_minority_size)).index
                    df.loc[flip_indices, "is_anomaly"] = 0

            logger.info(f"📊 Training on {len(df)} samples. Final Anomaly Count: {df['is_anomaly'].sum()}")
            logger.info(f"Columns available: {list(df.columns)}")

        # 2. Convert to H2O Frame via Pandas
        loop = asyncio.get_running_loop()

        def run_h2o_train(dataframe):
            # Convert Pandas DF to H2O Frame
            hf = h2o.H2OFrame(dataframe)

            # Identify predictors and response
            y = "is_anomaly"
            x = hf.columns
            if y in x:
                x.remove(y)
            if "risk_score" in x:
                x.remove("risk_score") # Prevent data leakage if it exists
            if "extracted_score" in x:
                x.remove("extracted_score") # Prevent data leakage from regex extraction

            # Keep text columns! H2O AutoML handles NLP.
            # Only remove 'meta' which is usually a dict and breaks things
            if "meta" in x:
                x.remove("meta")
            if "data" in x:
                x.remove("data")

            # Convert target to factor for classification
            hf[y] = hf[y].asfactor()

            # Run AutoML
            logger.info(f"Training AutoML with predictors: {x}")
            aml = H2OAutoML(max_models=5, seed=1, max_runtime_secs=120, project_name=f"predator_anomaly_{job_id}")
            aml.train(x=x, y=y, training_frame=hf)

            lb = aml.leaderboard
            logger.info("🏆 H2O Leaderboard generated.")
            print(lb.head(rows=5))

            # Save Model
            # Note: h2o.save_model saves on the SERVER side.
            # We need to download it to the CLIENT side (backend container).
            local_path = "/app/data/models/h2o"
            os.makedirs(local_path, exist_ok=True)

            # download_model returns the path to the downloaded file
            model_path = h2o.download_model(model=aml.leader, path=local_path)

            return {
                "status": "success",
                "model_id": aml.leader.model_id,
                "path": model_path,
                "metrics": {
                    "auc": aml.leader.auc(),
                    "logloss": aml.leader.logloss()
                }
            }

        try:
            # Pass 'df' explicitly to the running function
            result = await loop.run_in_executor(None, lambda: run_h2o_train(df))
            logger.info(f"✅ H2O Training Completed. Model saved at {result['path']}")
            return result
        except Exception as e:
            logger.exception(f"❌ H2O Training Failed: {e}")
            return {"status": "failed", "error": str(e)}

    async def predict_risk(self, data: list):
        """Uses the latest trained H2O model to predict anomaly risk.

        Args:
            data: List of dictionaries containing input features (instruction, input, output)
        """
        if not self.connected:
            await self.ensure_connection()

        # 1. Find latest model
        models_dir = "/app/data/models/h2o"
        try:
            if not os.path.exists(models_dir):
                return {"error": "No models found (directory missing)"}

            files = [os.path.join(models_dir, f) for f in os.listdir(models_dir) if os.path.isfile(os.path.join(models_dir, f))]
            if not files:
                return {"error": "No models available yet"}

            latest_model_path = max(files, key=os.path.getctime)

        except Exception as e:
            logger.exception(f"Error finding model: {e}")
            return {"error": str(e)}

        def run_h2o_predict(model_path, data_list):
            try:
                # Load/Upload model to H2O Server
                # upload_model sends the file from Client (Backend) to Server (H2O Container)
                model = h2o.upload_model(model_path)

                # Create Frame
                hf = h2o.H2OFrame(pd.DataFrame(data_list))

                # Predict
                preds = model.predict(hf)

                # Convert to list
                # predict: [predict (class), p0, p1] for classification
                # We want p1 (probability of anomaly)
                preds_df = preds.as_data_frame()
                results = []
                for _idx, row in preds_df.iterrows():
                    # If classification: 'predict', 'p0', 'p1' (if binary)
                    # If regression: 'predict'
                    score = row.get('p1', row.get('predict', 0.0))
                    results.append({
                        "anomaly_score": float(score),
                        "is_anomaly": bool(score > 0.5)
                    })
                return results
            except Exception as e:
                logger.exception(f"H2O Prediction failed: {e}")
                raise

        loop = asyncio.get_running_loop()
        try:
            predictions = await loop.run_in_executor(None, lambda: run_h2o_predict(latest_model_path, data))
            return {"status": "success", "model": os.path.basename(latest_model_path), "predictions": predictions}
        except Exception as e:
            return {"status": "error", "message": str(e)}

h2o_manager = H2OManager()
