import os
import sys
import shutil
from pathlib import Path

def switch_node(node_name):
    node_name = node_name.upper()
    env_file = Path(".env")
    
    nodes = {
        "NVIDIA": {
            "IP": "194.177.1.240",
            "DB_PASS": "nvidia-prod-password",
            "NEO_PASS": "nvidia-prod-password",
            "URL": "https://predator.share.zrok.io"
        },
        "IMAC": {
            "IP": "178.214.200.25",
            "DB_PASS": "predator",
            "NEO_PASS": "predator",
            "URL": "http://178.214.200.25:8000"
        },
        "COLAB": {
            "IP": "136.118.146.84",
            "DB_PASS": "nvidia-prod-password",
            "NEO_PASS": "nvidia-prod-password",
            "URL": "https://z7onbbru9393.share.zrok.io"
        }
    }
    
    if node_name not in nodes:
        print(f"❌ Unknown node: {node_name}. Available: {list(nodes.keys())}")
        return

    node = nodes[node_name]
    print(f"🚀 Switching to node: {node_name} ({node['IP']})...")
    
    if not env_file.exists():
        print("❌ .env file not found!")
        return

    with open(env_file, "r") as f:
        lines = f.readlines()

    new_lines = []
    for line in lines:
        if line.startswith("PREDATOR_NODE="):
            new_lines.append(f'PREDATOR_NODE="{node_name}"\n')
        elif "194.177.1.240" in line or "178.214.200.25" in line or "136.118.146.84" in line or "z7onbbru9393.share.zrok.io" in line:
            # Replace IP/Host
            l = line.replace("194.177.1.240", node["IP"])
            l = l.replace("178.214.200.25", node["IP"])
            l = l.replace("136.118.146.84", node["IP"])
            # Special case for zrok URLs if they are used as whole hosts
            if "share.zrok.io" in l and node_name == "COLAB":
                l = l.replace("predator.share.zrok.io", "z7onbbru9393.share.zrok.io")
            elif "share.zrok.io" in l and node_name == "NVIDIA":
                l = l.replace("z7onbbru9393.share.zrok.io", "predator.share.zrok.io")
            new_lines.append(l)
        elif "nvidia-prod-password" in line or "predator" in line:
            if "POSTGRES_PASSWORD" in line or "DATABASE_URL" in line:
                 l = line.replace("nvidia-prod-password", node["DB_PASS"]).replace("predator", node["DB_PASS"])
                 new_lines.append(l)
            elif "NEO4J_PASSWORD" in line:
                 l = line.replace("nvidia-prod-password", node["NEO_PASS"]).replace("predator", node["NEO_PASS"])
                 new_lines.append(l)
            else:
                new_lines.append(line)
        else:
            new_lines.append(line)

    with open(env_file, "w") as f:
        f.writelines(new_lines)

    print(f"✅ .env updated for {node_name}.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python switch_node.py [NVIDIA|IMAC|COLAB]")
    else:
        switch_node(sys.argv[1])
