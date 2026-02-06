from __future__ import annotations

import time

import psutil


print("--- Testing System Stats (GLOBAL) ---")
# cpu_percent with interval IS blocking and usually accurate
print(f"Global CPU (1s check): {psutil.cpu_percent(interval=1)}%")
print(f"Global Memory: {psutil.virtual_memory().percent}%")

print("\n--- Testing Process Stats (snapshot) ---")
# This usually returns 0.0 on first call
for proc in list(psutil.process_iter(['name', 'cpu_percent']))[:5]:
    print(f"{proc.info['name']}: {proc.info['cpu_percent']}%")

print("\n--- Testing Process Stats (Correct Method) ---")
# To get real process CPU, we must check, sleep, check again (or rely on interval=0.1 on the object)
procs = []
for p in psutil.process_iter():
    try:
        # First call initiates measurement
        p.cpu_percent()
    except:
        pass

time.sleep(1)

print("Reading values after 1s wait...")
for p in psutil.process_iter(['name', 'pid']):
    try:
        # Second call returns usage since last call
        cpu = p.cpu_percent()
        if cpu > 0.0:
            print(f"{p.info['name']} ({p.info['pid']}): {cpu}%")
            procs.append((p.info['name'], cpu))
    except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
        pass

procs.sort(key=lambda x: x[1], reverse=True)
print(f"\nTop 5 Active Processes:\n{procs[:5]}")
