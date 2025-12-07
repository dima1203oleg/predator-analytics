import requests
import time
import platform
import psutil
import argparse
import sys

# Colors
GREEN = '\033[92m'
BLUE = '\033[94m'
RED = '\033[91m'
RESET = '\033[0m'

def print_status(msg, type="info"):
    if type == "success":
        print(f"{GREEN}✅ {msg}{RESET}")
    elif type == "error":
        print(f"{RED}❌ {msg}{RESET}")
    else:
        print(f"{BLUE}ℹ️  {msg}{RESET}")

def register(server_url):
    node_id = f"node-{platform.node()}"
    payload = {
        "node_id": node_id,
        "hostname": platform.node(),
        "os": f"{platform.system()} {platform.release()}",
        "capabilities": ["python-runtime", "file-scanner", "inference-cpu"],
        "resources": {
            "cpu_cores": psutil.cpu_count(),
            "ram_gb": round(psutil.virtual_memory().total / (1024**3), 2),
            "cpu_freq": round(psutil.cpu_freq().max, 2) if psutil.cpu_freq() else 0
        }
    }
    
    # Bypass auth for local demo
    headers = {"Authorization": "Bearer dev-token-bypass"}
    
    try:
        print_status(f"Connecting to Mothership at {server_url}...", "info")
        resp = requests.post(f"{server_url}/register", json=payload, headers=headers)
        if resp.status_code == 200:
            print_status(f"Registered successfully as {node_id}", "success")
            return node_id
        else:
            # Try to print helpful error
            print_status(f"Registration failed: {resp.status_code} - {resp.text}", "error")
            return None
    except requests.exceptions.ConnectionError:
        print_status(f"Could not connect to server at {server_url}. Is the backend running?", "error")
        return None
    except Exception as e:
        print_status(f"Connection error: {e}", "error")
        return None

def main_loop(server_url, node_id):
    print_status("Edge Node Agent Active. Waiting for tasks from Hivemind...", "info")
    print(f"   [Press Ctrl+C to stop]")
    
    while True:
        try:
            # Heartbeat & Load Report
            load = psutil.cpu_percent(interval=1)
            resp = requests.post(f"{server_url}/heartbeat/{node_id}?load={load}")
            
            if resp.status_code == 200:
                data = resp.json()
                tasks = data.get("tasks", [])
                if tasks:
                    print_status(f"Recieved {len(tasks)} tasks!", "success")
                else:
                    sys.stdout.write("•")
                    sys.stdout.flush()
            elif resp.status_code == 404:
                print("\n")
                print_status("Node lost registration. Re-registering...", "error")
                register(server_url)
            
        except KeyboardInterrupt:
            print("\nShutting down.")
            break
        except Exception as e:
            print(f"\nDisconnection: {e}")
            time.sleep(5)
            
        time.sleep(5)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Predator Edge Node Agent")
    parser.add_argument("--server", default="http://localhost:8000/api/v1/federation", help="Server API URL")
    args = parser.parse_args()
    
    print("\n🦁 PREDATOR EDGE NODE AGENT v1.0\n")
    node_id = register(args.server)
    if node_id:
        try:
            main_loop(args.server, node_id)
        except KeyboardInterrupt:
             print("\nBye.")
