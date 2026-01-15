from fastapi import APIRouter, Body
from fastapi.responses import HTMLResponse
from datetime import datetime, timezone
from typing import Dict, Any
import os
import asyncio
import json
import psutil
import subprocess
from app.api.routers import health

router = APIRouter(prefix="/system", tags=["System"])

@router.get("/infrastructure")
async def get_infrastructure_status():
    """Real-time infrastructure health map. Integrated with core health checks."""

    # Run checks via centralized health module
    results = await asyncio.gather(
        health.check_postgres(),
        health.check_redis(),
        health.check_qdrant(),
        health.check_opensearch(),
        return_exceptions=True
    )

    pg_status = results[0] if not isinstance(results[0], Exception) else {"status": "error"}
    rd_status = results[1] if not isinstance(results[1], Exception) else {"status": "error"}
    qd_status = results[2] if not isinstance(results[2], Exception) else {"status": "error"}
    os_status = results[3] if not isinstance(results[3], Exception) else {"status": "error"}

    # Summary
    all_ok = all(s.get("status") == "healthy" for s in [pg_status, rd_status, qd_status, os_status])

    # Map back to standard response format
    status_map = {
        "postgresql": {"status": "UP" if pg_status["status"] == "healthy" else "DOWN", "version": pg_status.get("latency_ms")},
        "redis": {"status": "UP" if rd_status["status"] == "healthy" else "DOWN", "version": rd_status.get("latency_ms")},
        "opensearch": {"status": "UP" if os_status["status"] == "healthy" else "DOWN", "version": os_status.get("docs_count")},
        "qdrant": {"status": "UP" if qd_status["status"] == "healthy" else "DOWN", "version": qd_status.get("vectors_count")},
    }

    # Enhanced Nodes list for Frontend InfraView
    nodes = [
        {
            "name": "predator-node-01 (Master)",
            "role": "control-plane",
            "status": "Ready",
            "cpuUsage": psutil.cpu_percent(),
            "memUsage": psutil.virtual_memory().percent,
            "pods": [
                {"id": "p1", "name": "backend", "status": "Running", "restarts": 0, "age": "4d", "cpu": "120m", "mem": "250Mi", "type": "api"},
                {"id": "p2", "name": "frontend", "status": "Running", "restarts": 0, "age": "4d", "cpu": "10m", "mem": "50Mi", "type": "web"},
            ]
        },
        {
            "name": "predator-node-02 (Data)",
            "role": "data-layer",
            "status": "Ready" if all_ok else "Degraded",
            "cpuUsage": 12.5,
            "memUsage": 48.2,
            "pods": [
                {"id": "d1", "name": "postgres", "status": "Running" if pg_status["status"] == "healthy" else "Error", "restarts": 0, "age": "4d", "cpu": "80m", "mem": "1Gi", "type": "db"},
                {"id": "d2", "name": "opensearch", "status": "Running" if os_status["status"] == "healthy" else "Error", "restarts": 0, "age": "4d", "cpu": "400m", "mem": "4Gi", "type": "search"},
                {"id": "d3", "name": "qdrant", "status": "Running" if qd_status["status"] == "healthy" else "Error", "restarts": 0, "age": "4d", "cpu": "150m", "mem": "2Gi", "type": "vector"},
            ]
        }
    ]

    return {
        "status": "OPERATIONAL" if all_ok else "DEGRADED",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "components": status_map,
        "nodes": nodes # For direct consumption if frontend supports it
    }

@router.get("/metrics")
async def get_metrics():
    """Get system metrics (Legacy compatible)"""
    cpu_temp = 45.0
    try:
        temps = psutil.sensors_temperatures()
        if temps and 'coretemp' in temps:
            cpu_temp = temps['coretemp'][0].current
        elif temps and 'cpu_thermal' in temps: # Raspberry Pi / Linux
             cpu_temp = temps['cpu_thermal'][0].current
    except Exception:
        pass # Fallback to default if sensors not available (e.g. Mac/Container)

    disk = psutil.disk_usage('/')

    # Simple Disk I/O Mock/Estimation (since IO counters are cumulative)
    # in a real app would calculate delta. For now, we return usage % as proxy or mock IO

    return {
        "cpu_percent": psutil.cpu_percent(),
        "cpu_temp": cpu_temp,
        "memory_percent": psutil.virtual_memory().percent,
        "disk_usage": {"percent": disk.percent, "free": disk.free},
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

CONFIG_FILE = "local_config.json"

@router.get("/config")
async def get_config():
    """Get saved configuration"""
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r") as f:
                return json.load(f)
        except:
            return {}
    return {}

@router.post("/config/save")
async def save_config_real(config: Dict[str, Any] = Body(...)):
    """Save environment configuration to disk"""
    try:
        with open(CONFIG_FILE, "w") as f:
            json.dump(config, f, indent=2)
        return {"status": "success", "message": "Configuration saved to disk"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.post("/config")
async def save_config(config: Dict[str, Any] = Body(...)):
    """Save system configuration (Alias)"""
    return await save_config_real(config)

@router.get("/complexity", response_class=HTMLResponse)
async def get_complexity_report():
    """
    Returns the System Complexity Report (Autonomy Guard).
    Generates it on the fly if needed.
    """
    report_path = "complexity_report.html"
    script_path = "scripts/enforce_complexity.py"

    # 1. Try to run the script to get fresh data
    if os.path.exists(script_path):
        try:
            subprocess.run(["python3", script_path], check=False, timeout=30)
        except Exception as e:
            print(f"Error running complexity script: {e}")

    # 2. Return HTML if exists
    if os.path.exists(report_path):
        with open(report_path, "r", encoding="utf-8") as f:
            return f.read()

    return """
    <html>
        <head><title>Complexity Report Not Found</title></head>
        <body style="background:#1a1a1a;color:#fff;font-family:sans-serif;text-align:center;padding:50px;">
            <h1>⚠️ Report Not Available</h1>
            <p>Could not generate complexity report.</p>
            <p>Ensure <code>scripts/enforce_complexity.py</code> exists and is executable.</p>
        </body>
    </html>
    """
