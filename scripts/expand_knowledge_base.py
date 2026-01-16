import asyncio
import os
import sys
import json
from typing import List, Dict
from orchestrator.agents.synthetic_data import SyntheticDataAgent

# Predator Knowledge Base Expansion v29.1
# Reads scenarios from markdown and generates synthetic training data.

SCENARIOS_FILE = "data/seeds/hyper_complex_scenarios_v29.md"
OUTPUT_DIR = "data/training/synthetic_v29"

def parse_scenarios(file_path: str) -> List[Dict]:
    scenarios = []
    if not os.path.exists(file_path):
        return scenarios

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    parts = content.split('---')
    if len(parts) < 2:
        return scenarios

    body = parts[1]
    items = body.split('\n\n')

    for item in items:
        item = item.strip()
        if not item:
            continue

        lines = item.split('\n')
        title_line = lines[0].strip()
        # Format: 101. “Title”
        title = title_line.split('“')[1].split('”')[0] if '“' in title_line else title_line

        desc = ""
        fields = ""
        example = ""

        for line in lines[1:]:
            if line.startswith('Опис:'):
                desc = line.replace('Опис:', '').strip()
            elif line.startswith('Поля:'):
                fields = line.replace('Поля:', '').strip()
            elif line.startswith('Застосування:'):
                example = line.replace('Застосування:', '').strip()

        scenarios.append({
            "id": title_line.split('.')[0].strip(),
            "title": title,
            "description": desc,
            "fields": fields,
            "example": example,
            "label": "fraud" if "схема" in desc.lower() or "шахрайство" in desc.lower() else "suspicious"
        })

    return scenarios

async def expand():
    print("🧠 [PREDATOR KNOWLEDGE EXPANSION] Starting...")

    scenarios = parse_scenarios(SCENARIOS_FILE)
    print(f"📖 Loaded {len(scenarios)} scenarios from {SCENARIOS_FILE}")

    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    agent = SyntheticDataAgent(output_dir=OUTPUT_DIR)

    for scenario in scenarios:
        print(f"🚀 Generating data for: {scenario['title']}...")
        data = await agent.generate_dataset(scenario, count=5)

        if data:
            filename = f"{OUTPUT_DIR}/scenario_{scenario['id']}.json"
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"✅ Saved {len(data)} samples to {filename}")

            # Generate adversarial examples too
            print(f"🛡️ Generating adversarial examples for: {scenario['title']}...")
            adv_data = await agent.generate_adversarial_examples(data)
            if adv_data:
                adv_filename = f"{OUTPUT_DIR}/scenario_{scenario['id']}_adv.json"
                with open(adv_filename, 'w', encoding='utf-8') as f:
                    json.dump(adv_data, f, ensure_ascii=False, indent=2)
                print(f"✅ Saved {len(adv_data)} adversarial samples to {adv_filename}")
        else:
            print(f"❌ Failed to generate data for {scenario['title']}")

if __name__ == "__main__":
    asyncio.run(expand())
