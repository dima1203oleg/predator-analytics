import os
import yaml
import httpx
from fastapi import FastAPI, BackgroundTasks
import subprocess

app = FastAPI(title="Claw Code Agent Orchestrator", version="1.0.0")

CONFIG_PATH = os.getenv("CLAW_CONFIG_PATH", "config.yaml")

def load_config():
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH, "r") as f:
            return yaml.safe_load(f)
    return {}

@app.get("/health")
async def health_check():
    config = load_config()
    return {"status": "ok", "agent": config.get("agent", {}).get("name", "ClawCode")}

@app.post("/trigger/refactor")
async def trigger_refactor(background_tasks: BackgroundTasks):
    background_tasks.add_task(run_claw_refactor)
    return {"status": "accepted", "message": "Refactoring task started in background."}

def run_claw_refactor():
    print("Starting Claw Code Refactoring via DeepSeek-R1...")
    config = load_config()
    llm_url = config.get("llm", {}).get("base_url", "http://host.docker.internal:11434")
    model = config.get("llm", {}).get("model", "deepseek-r1:latest")
    
    # Check if Ollama is accessible
    try:
        r = httpx.get(f"{llm_url}/api/tags")
        if r.status_code == 200:
            print(f"Ollama connected. Model: {model}")
    except Exception as e:
        print(f"Failed to connect to Ollama: {e}")

    # For now, we mock the execution of claw-code
    # In reality, we would call the rust binary: subprocess.run(["/opt/claw-code/target/release/claw-code", "--analyze"])
    print("Claw Code completed refactoring task.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8005, reload=True)
