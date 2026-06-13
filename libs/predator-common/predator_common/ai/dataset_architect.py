import logging
from typing import Dict, Any, List
from predator_common.ai.deepseek_core import DeepSeekCore

logger = logging.getLogger("dataset_architect")

class DatasetArchitect:
    """
    Data Fabric AI Layer.
    Uses DeepSeek R1 to design dataset strategies, detect schema evolution,
    label anomalies automatically, and perform semantic clustering logic.
    """

    def __init__(self):
        self.core = DeepSeekCore(model_name="cognitive_core")

    async def generate_dataset_blueprint(self, raw_tables: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Takes raw schema/metadata and generates an ETL blueprint.
        """
        logger.info("Generating Dataset Blueprint via DeepSeek R1...")
        decision = await self.core.design_dataset({"raw_tables": raw_tables})
        
        blueprint = {
            "blueprint_name": decision.decision,
            "rationale": decision.rationale,
            "confidence": decision.confidence,
            "feature_engineering": decision.parameters.get("feature_engineering", []),
            "imbalance_strategy": decision.parameters.get("imbalance_strategy", "none"),
            "synthetic_data_needs": decision.parameters.get("synthetic_data_needs", False)
        }
        
        logger.info(f"Blueprint generated: {blueprint['blueprint_name']} (Confidence: {blueprint['confidence']})")
        return blueprint

    async def detect_schema_evolution(self, old_schema: Dict[str, Any], new_schema: Dict[str, Any]) -> Dict[str, Any]:
        """
        Checks if the database schema has evolved in a way that impacts ML.
        """
        prompt = (
            "Analyze the old schema and new schema. Identify ML-impacting schema evolutions. "
            "Return JSON with 'breaking_changes' (list of strings), 'recommendations' (string)."
        )
        data = {"old_schema": old_schema, "new_schema": new_schema}
        
        res = await self.core._invoke(
            system_prompt="You are the Data Fabric AI Schema Evolution Detector.",
            user_prompt=f"{prompt}\nData: {data}",
            temperature=0.1
        )
        return res

    async def label_anomalies(self, data_samples: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Automatically labels anomalous data samples.
        """
        prompt = (
            "Analyze these data samples for anomalies. "
            "Return a list of dictionaries with 'id', 'is_anomaly' (boolean), and 'reason'."
        )
        res = await self.core._invoke(
            system_prompt="You are the Data Quality AI.",
            user_prompt=f"{prompt}\nData: {data_samples}",
            temperature=0.1
        )
        # Assuming the response contains a key 'anomalies'
        return res.get("anomalies", [])
