
import os
import subprocess
import sys
import time


# Add project root and service root to path
ROOT_DIR = "/Users/dima-mac/Documents/Predator_21"
SERVICE_DIR = os.path.join(ROOT_DIR, "services/api_gateway")

sys.path.insert(0, ROOT_DIR)
sys.path.insert(0, SERVICE_DIR)

# Minimal dependencies check
try:
    import fastapi
    import uvicorn
    print("Found dependencies in system python.")
except ImportError:
    print("Dependencies missing in system python.")

# Try to run uvicorn
cmd = [
    "/usr/bin/python3", "-m", "uvicorn",
    "app.main:app",
    "--host", "0.0.0.0",
    "--port", "8090"
]

print(f"Running: {' '.join(cmd)}")
env = os.environ.copy()
env['PYTHONPATH'] = f"{ROOT_DIR}:{SERVICE_DIR}"

with open("backend_startup.log", "w") as f:
    process = subprocess.Popen(cmd, cwd=SERVICE_DIR, env=env, stdout=f, stderr=f)
    print(f"Started backend with PID {process.pid}")

time.sleep(2)
if process.poll() is None:
    print("Backend process is still running.")
else:
    print(f"Backend process exited with code {process.returncode}")
