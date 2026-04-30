from __future__ import annotations

from datetime import datetime, timedelta
import json
import os
import random
import re
import uuid

SEEDS_FILE = "/app/data/seeds/analytic_scenarios_100.md"
OUTPUT_FILE = "/app/data/training_data.jsonl"

def parse_scenarios(file_path):
    with open(file_path, encoding='utf-8') as f:
        content = f.read()

    # Regex to find scenarios like "1. **Title**"
    # This is a heuristic parser tailored to the provided MD format
    scenarios = []

    # Split by waves or numbers
    blocks = re.split(r'^\d+\.\s+\*\*', content, flags=re.MULTILINE)

    for block in blocks[1:]: # Skip preamble
        lines = block.strip().split('\n')
        title = lines[0].strip('*').strip('"')

        desc = "N/A"
        fields = []
        app = "N/A"

        for line in lines:
            if "Опис:" in line:
                desc = line.split("Опис:")[1].strip()
            if "Поля:" in line:
                fields_raw = line.split("Поля:")[1].strip()
                fields = [f.strip() for f in fields_raw.split(',')]
            if "Застосування:" in line:
                app = line.split("Застосування:")[1].strip()

        if title:
            scenarios.append({
                "id": str(uuid.uuid4()),
                "title": title,
                "description": desc,
                "fields": fields,
                "application": app
            })

    return scenarios

def generate_synthetic_record(scenario):
    """Generates a realistic synthetic JSON record based on scenario fields."""
    record = {
        "scenario_id": scenario['title'],
        "timestamp": datetime.now().isoformat(),
        "risk_score": round(random.uniform(0.7, 0.99), 2),
        "data": {}
    }

    # Dynamic field generation based on field names
    for field in scenario['fields']:
        key = field.lower().replace(" ", "_").replace("/", "_")
        val = None

        if "дата" in key or "date" in key:
            val = (datetime.now() - timedelta(days=random.randint(0, 365))).strftime("%Y-%m-%d")
        elif "код" in key or "code" in key:
            val = f"{random.randint(1000, 9999)}{random.randint(10, 99)}"
        elif "вартість" in key or "price" in key or "сума" in key:
            val = round(random.uniform(10000, 5000000), 2)
        elif "обсяг" in key or "volume" in key or "вага" in key:
            val = round(random.uniform(100, 50000), 2)
        elif "єдрпоу" in key or "company" in key:
            val = f"{random.randint(10000000, 99999999)}"
        elif "країна" in key or "country" in key:
            val = random.choice(["China", "Turkey", "Poland", "Germany", "Vietnam", "Cyprus", "UAE"])
        else:
            val = f"synthetic_val_{random.randint(1, 1000)}"

        record["data"][key] = val

    # Add a high-quality instruction-tuning pair for Llama
    prompt = f"Analyze the following customs declaration data for anomalies: {json.dumps(record['data'])}"
    response = f"DETECTED ANOMALY: {scenario['title']}. Logic: {scenario['description']}. Risk Score: {record['risk_score']}. Recommendation: Immediate audit of entity {record['data'].get('єдрпоу', 'unknown')}."

    return {
        "instruction": prompt,
        "input": "",
        "output": response,
        "meta": {
            "source": "AZR_Synthetic_Gen_v1",
            "scenario": scenario['title']
        }
    }

def main():

    if not os.path.exists(SEEDS_FILE):
        return

    scenarios = parse_scenarios(SEEDS_FILE)

    total_records = 0
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f_out:
        for scenario in scenarios:
            # Generate 10 variations per scenario -> 100 * 10 = 1000 records
            for _ in range(10):
                record = generate_synthetic_record(scenario)
                f_out.write(json.dumps(record, ensure_ascii=False) + '\n')
                total_records += 1


if __name__ == "__main__":
    main()
