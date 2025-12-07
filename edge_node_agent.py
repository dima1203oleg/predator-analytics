import requests
import time
import platform
import psutil
import argparse
import sys
import csv
import os

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
            print_status(f"Registration failed: {resp.status_code} - {resp.text}", "error")
            return None
    except requests.exceptions.ConnectionError:
        print_status(f"Could not connect to server at {server_url}. Is the backend running?", "error")
        return None
    except Exception as e:
        print_status(f"Connection error: {e}", "error")
        return None

def process_task(task, server_url, node_id):
    t_type = task.get("type")
    payload = task.get("payload", {})
    t_id = task.get("task_id")
    
    print("\n------------------------------------------------")
    print_status(f"Executing Task {t_id}: {t_type}", "info")
    
    result_data = {}
    status = "failed"
    
    try:
        # TASK: SCAN CSV
        if t_type == "scan_csv":
            file_path = payload.get("path")
            if not file_path:
                raise ValueError("No path provided in payload")
            
            if not os.path.exists(file_path):
                 raise FileNotFoundError(f"File not found: {file_path}")

            print(f"   📂 Reading {file_path}...")
            count = 0
            preview = []
            
            # Simple read
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    count += 1
                    if count <= 5:
                        preview.append(row)
                    
                    if count % 1000 == 0:
                        sys.stdout.write(f"\r   Processing row {count}...")
                        sys.stdout.flush()

            print(f"\n")
            result_data = {
                "rows_processed": count,
                "preview": preview,
                "file_size_bytes": os.path.getsize(file_path),
                "columns": reader.fieldnames
            }
            status = "completed"
            print_status(f"Processed {count} rows successfully.", "success")
            
        else:
             print_status(f"Unknown task type: {t_type}", "error")
             status = "ignored"
             
    except Exception as e:
        print_status(f"Task Execution Failed: {e}", "error")
        result_data = {"error": str(e)}
        
    # Submit result
    submit_payload = {
        "task_id": t_id,
        "node_id": node_id,
        "result": result_data,
        "status": status
    }
    
    try:
        resp = requests.post(f"{server_url}/submit_result", json=submit_payload)
        if resp.status_code == 200:
             print_status("Result uploaded to Mothership ☁️", "success")
        else:
             print_status(f"Upload failed: {resp.text}", "error")
    except Exception as e:
        print_status(f"Failed to submit result: {e}", "error")
    print("------------------------------------------------\n")

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
                    print_status(f"Received {len(tasks)} tasks!", "success")
                    for task in tasks:
                        process_task(task, server_url, node_id)
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
