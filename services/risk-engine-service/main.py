import os
import json
import logging
from datetime import datetime, timezone
from kafka import KafkaConsumer, KafkaProducer
from kafka.errors import NoBrokersAvailable
import time
import random

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("risk-engine")

KAFKA_BROKER = os.getenv("KAFKA_BROKER", "localhost:29092")
INPUT_TOPICS = ["entity.created", "entity.updated"]
OUTPUT_TOPIC = "risk.updated"

def calculate_risk(entity_data: dict) -> float:
    # A placeholder algorithm for MVP
    # In production, this would load weights, check ML models, or graph topological features.
    base_risk = 0.1
    country = entity_data.get("country", "").lower()
    
    # High-risk jurisdictions penalty
    if country in ["cyprus", "panama", "bvi"]:
        base_risk += 0.5
        
    # Transaction volume penalty
    volume = entity_data.get("tx_volume", 0)
    if volume > 1_000_000:
        base_risk += 0.3
        
    # Introduce some stochastic behavior to simulate complex ML for the UI
    fuzz = random.uniform(-0.05, 0.05)
    
    final_risk = min(1.0, max(0.0, base_risk + fuzz))
    return round(final_risk, 3)

def get_kafka_clients():
    retries = 10
    while retries > 0:
        try:
            consumer = KafkaConsumer(
                *INPUT_TOPICS,
                bootstrap_servers=[KAFKA_BROKER],
                group_id="risk-engine-group",
                value_deserializer=lambda x: json.loads(x.decode('utf-8'))
            )
            producer = KafkaProducer(
                bootstrap_servers=[KAFKA_BROKER],
                value_serializer=lambda v: json.dumps(v).encode('utf-8')
            )
            logger.info("Successfully connected to Redpanda.")
            return consumer, producer
        except NoBrokersAvailable:
            logger.warning(f"Redpanda not available. Retrying... ({retries} left)")
            time.sleep(5)
            retries -= 1
    raise Exception("Failed to connect to Redpanda.")

def main():
    logger.info("Starting Risk Engine Service...")
    consumer, producer = get_kafka_clients()
    
    for message in consumer:
        try:
            payload = message.value.get("payload", {})
            entity_id = payload.get("id")
            
            if not entity_id:
                continue
                
            risk_score = calculate_risk(payload)
            
            output_event = {
                "event": OUTPUT_TOPIC,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "payload": {
                    "entity_id": entity_id,
                    "risk_score": risk_score
                }
            }
            
            producer.send(OUTPUT_TOPIC, output_event)
            producer.flush()
            logger.info(f"Calculated risk for {entity_id}: {risk_score}")
            
        except Exception as e:
            logger.error(f"Error processing message: {e}")

if __name__ == "__main__":
    time.sleep(5) # wait for redpanda
    main()
