import pandas as pd
import numpy as np
import logging
from sklearn.model_selection import train_test_split
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import roc_auc_score, f1_score
import lightgbm as lgb
import optuna

logger = logging.getLogger(__name__)

class OsintAutoML:
    def __init__(self):
        self.scaler = StandardScaler()
        self.anomaly_detector = IsolationForest(n_estimators=100, contamination=0.1, random_state=42)
        self.risk_model = None

    def _extract_features(self, raw_data: list) -> pd.DataFrame:
        """
        Flatten nested JSON OSINT data into a tabular DataFrame.
        """
        records = []
        for d in raw_data:
            record = {
                'id': d.get('id', 'unknown'),
                'type': d.get('type', 'person'),
            }
            # Financial & Tax
            taxes = d.get('taxes', {})
            record['tax_paid'] = float(str(taxes.get('paid', '0')).replace('UAH', '').replace(',', '').strip()) if taxes else 0.0
            record['tax_debt'] = float(str(taxes.get('debt', '0')).replace('UAH', '').replace(',', '').strip()) if taxes else 0.0
            
            # Legal & Courts
            courts = d.get('courts', {})
            record['total_cases'] = int(courts.get('totalCases', 0)) if courts else 0
            record['criminal_cases'] = int(courts.get('criminalCases', 0)) if courts else 0
            
            # Cyber & Leaks
            cyber = d.get('cyber', {})
            record['open_ports'] = len(cyber.get('openPorts', [])) if cyber else 0
            record['vulnerabilities'] = len(cyber.get('vulnerabilities', [])) if cyber else 0
            record['darknet_mentions'] = int(cyber.get('darknetMentions', 0)) if cyber else 0
            record['has_onion_links'] = 1 if cyber and cyber.get('hasOnionLinks') else 0
            
            leaks = d.get('leaks', {})
            record['total_breaches'] = int(leaks.get('totalBreaches', 0)) if leaks else 0
            record['compromised_passwords'] = 1 if leaks and leaks.get('compromisedPasswords') else 0

            # Interpol
            interpol = d.get('interpol', {})
            record['interpol_wanted'] = 1 if interpol and interpol.get('isWanted') else 0

            # Label (for mock supervised training)
            record['is_high_risk'] = d.get('is_high_risk', 0)
            
            records.append(record)
            
        df = pd.DataFrame(records)
        return df

    def detect_anomalies(self, raw_data: list):
        """
        Unsupervised anomaly detection using Isolation Forest.
        """
        logger.info("Extracting features for anomaly detection...")
        df = self._extract_features(raw_data)
        
        features = df.drop(columns=['id', 'type', 'is_high_risk'])
        
        # Handle Missing or NULL Values
        features = features.fillna(0)
        
        logger.info("Scaling features...")
        X_scaled = self.scaler.fit_transform(features)
        
        logger.info("Fitting Isolation Forest...")
        preds = self.anomaly_detector.fit_predict(X_scaled)
        
        # IsolationForest returns -1 for anomalies, 1 for normal
        df['is_anomaly'] = (preds == -1).astype(int)
        
        anomalies = df[df['is_anomaly'] == 1]
        logger.info(f"Detected {len(anomalies)} anomalies out of {len(df)} records.")
        return anomalies

    def train_risk_model(self, raw_data: list, n_trials: int = 10):
        """
        Supervised LightGBM model training with Optuna for hyperparameter optimization.
        """
        df = self._extract_features(raw_data)
        
        if df['is_high_risk'].sum() == 0:
            logger.warning("No high risk examples found in data. Cannot train supervised model.")
            return None

        # Handle Missing or NULL Values
        df = df.fillna(0)

        # Split data before applying preprocessing
        X = df.drop(columns=['id', 'type', 'is_high_risk'])
        y = df['is_high_risk']
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        
        # Scale separately
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        def objective(trial):
            params = {
                'objective': 'binary',
                'metric': 'auc',
                'boosting_type': 'gbdt',
                'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3),
                'num_leaves': trial.suggest_int('num_leaves', 20, 100),
                'max_depth': trial.suggest_int('max_depth', 3, 12),
                'min_data_in_leaf': trial.suggest_int('min_data_in_leaf', 5, 50),
                'verbose': -1
            }
            
            train_data = lgb.Dataset(X_train_scaled, label=y_train)
            
            # Simple CV or direct train
            model = lgb.train(params, train_data, num_boost_round=50)
            preds = model.predict(X_test_scaled)
            auc = roc_auc_score(y_test, preds)
            return auc

        logger.info("Starting Optuna hyperparameter optimization...")
        optuna.logging.set_verbosity(optuna.logging.WARNING)
        study = optuna.create_study(direction="maximize")
        study.optimize(objective, n_trials=n_trials)
        
        best_params = study.best_params
        best_params['objective'] = 'binary'
        best_params['verbose'] = -1
        
        logger.info(f"Best Optuna params: {best_params}")
        
        logger.info("Training final LightGBM model with best params...")
        train_data = lgb.Dataset(X_train_scaled, label=y_train)
        self.risk_model = lgb.train(best_params, train_data, num_boost_round=100)
        
        # Evaluate on test set
        preds_prob = self.risk_model.predict(X_test_scaled)
        preds_class = (preds_prob > 0.5).astype(int)
        
        auc = roc_auc_score(y_test, preds_prob)
        f1 = f1_score(y_test, preds_class)
        
        logger.info(f"Final Model Evaluation - ROC-AUC: {auc:.4f}, F1-Score: {f1:.4f}")
        return {"roc_auc": auc, "f1": f1, "params": best_params}
