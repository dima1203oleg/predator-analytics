import os
import json
import time
import random
import logging
from datetime import datetime, timezone
from kafka import KafkaProducer
from kafka.errors import NoBrokersAvailable

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mock-generator")

KAFKA_BROKER = os.getenv("KAFKA_BROKER", "localhost:29092")

def get_producer():
    retries = 10
    while retries > 0:
        try:
            producer = KafkaProducer(
                bootstrap_servers=[KAFKA_BROKER],
                value_serializer=lambda v: json.dumps(v).encode('utf-8')
            )
            logger.info("Successfully connected to Redpanda.")
            return producer
        except NoBrokersAvailable:
            logger.warning(f"Redpanda not available yet. Retrying in 5s... ({retries} left)")
            time.sleep(5)
            retries -= 1
    raise Exception("Failed to connect to Redpanda.")

def main():
    producer = get_producer()
    
    # We will simulate risk updates and new nodes on existing graph
    # to avoid blowing up the graph with too many nodes in MVP.
    target_nodes = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "c1", "c2", "offshore1", "offshore2"]
    
    events = [
        "risk.updated",
        "system.state.changed"
    ]
    
    logger.info("Starting mock event generation...")
    
    while True:
        try:
            event_type = random.choices(events, weights=[0.9, 0.1])[0]
            
            payload = {}
            if event_type == "risk.updated":
                entity_id = random.choice(target_nodes)
                # Randomize risk spike
                risk_score = random.uniform(0.1, 0.95)
                if random.random() > 0.8:
                    risk_score = random.uniform(0.8, 1.0) # Anomaly
                
                payload = {
                    "entity_id": entity_id,
                    "risk_score": risk_score
                }
            elif event_type == "system.state.changed":
                states = ["calm", "exploration", "storm", "overload", "insight"]
                new_state = random.choice(states)
                payload = {
                    "weather": new_state
                }
            
            message = {
                "event": event_type,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "payload": payload
            }
            
            # Send to topic matching event name
            producer.send(event_type, message)
            producer.flush()
            logger.info(f"Generated event: {event_type} | Payload: {payload}")
            
            # Sleep 1-3 seconds to simulate human-readable stream pace
            time.sleep(random.uniform(1.0, 3.0))
            
        except Exception as e:
            logger.error(f"Error generating event: {e}")
            time.sleep(5)

if __name__ == "__main__":
    # Wait a bit for topics to be created or API to start
    time.sleep(5)
    main()
