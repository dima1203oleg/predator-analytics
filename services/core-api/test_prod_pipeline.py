import subprocess
import time
import sys
import json

def run_prod_test():
    print("🚀 Triggering Production Pipeline on NVIDIA Server...")
    
    # 1. Start pipeline in background on the server
    cmd_start = [
        "ssh", "nvidia-server",
        "cd ~/Predator_60/services/core-api && source .venv/bin/activate && nohup python3 -c 'from app.routers.deepseek_tuning import full_tuning_pipeline; full_tuning_pipeline()' > pipeline.log 2>&1 &"
    ]
    try:
        subprocess.run(cmd_start, check=True)
        print("✅ Pipeline started successfully in the background on the server.")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to start pipeline on server: {e}")
        sys.exit(1)

    print("⏳ Monitoring status (polling server)...")
    while True:
        try:
            # 2. Check latest_report.json on the server
            cmd_check = [
                "ssh", "nvidia-server",
                "cat ~/Predator_60/services/core-api/artifacts/datasets/deepseek/latest_report.json 2>/dev/null || echo 'NOT_FOUND'"
            ]
            result = subprocess.run(cmd_check, capture_output=True, text=True)
            output = result.stdout.strip()
            
            if output and output != "NOT_FOUND":
                report = json.loads(output)
                status = report.get("status")
                cycle = report.get("cycle")
                print(f"[{time.strftime('%X')}] Cycle {cycle} - Status: {status}")
                
                if status in ["COMPLETED", "FAILED"]:
                    print("\n🎉 Pipeline Finished!")
                    print(json.dumps(report, indent=2, ensure_ascii=False))
                    break
            else:
                print(f"[{time.strftime('%X')}] Waiting for cycle to finish and generate report...")
                
        except json.JSONDecodeError:
            print(f"[{time.strftime('%X')}] Report is currently being written, invalid JSON. Retrying...")
        except Exception as e:
            print(f"[{time.strftime('%X')}] Error checking status: {e}")
            
        time.sleep(30)

if __name__ == "__main__":
    run_prod_test()
