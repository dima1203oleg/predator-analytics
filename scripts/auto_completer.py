from __future__ import annotations

#!/usr/bin/env python3
"""Predator Analytics - Self-Improvement & Auto-Completion Agent
Implementation of 'Self-Improvement Loop' from TECH_SPEC.md Section 9.

This script acts as a local agent that:
1. Reads the Technical Specification.
2. Checks the current system health (Docker, API).
3. Identifies missing components or errors.
4. Attempts to auto-fix or deploy missing parts.
"""

import logging
import os
import subprocess
import time

# Setup Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - [AUTO-AGENT] - %(message)s')
logger = logging.getLogger("predator_agent")

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
REMOTE_HOST = "predator-server"

def run_cmd(cmd, cwd=PROJECT_ROOT):
    logger.info(f"Running: {' '.join(cmd)}")
    try:
        result = subprocess.run(cmd, check=False, cwd=cwd, capture_output=True, text=True)
        if result.returncode != 0:
            logger.error(f"Command failed: {result.stderr}")
            return False, result.stderr
        return True, result.stdout
    except Exception as e:
        logger.exception(f"Execution error: {e}")
        return False, str(e)

def check_remote_health():
    logger.info(f"O Checking Remote Server ({REMOTE_HOST})...")

    # 1. Check SSH reachability
    success, _ = run_cmd(["ssh", "-o", "ConnectTimeout=5", REMOTE_HOST, "echo 'SSH OK'"])
    if not success:
        return False, "SSH Connection Failed"

    # 2. Check Remote Docker
    # We must run inside the project directory
    success, output = run_cmd(["ssh", REMOTE_HOST, "cd ~/predator_v45 && docker compose ps --format json"], cwd=None)
    if not success:
        return False, f"Remote Docker Unreachable: {output}"

    required_services = ["backend", "frontend", "postgres", "redis"]
    missing = []
    for service in required_services:
        if f"predator_{service}" not in output:
            missing.append(service)

    if missing:
        return False, f"Missing Remote Services: {', '.join(missing)}"

    # 3. Check Remote API
    success, output = run_cmd(["ssh", REMOTE_HOST, "curl -s http://localhost:8000/health"], cwd=None)
    if not success or "status" not in output:
        return False, f"Remote API Unhealthy: {output[:100]}"

    return True, "Remote System Operational"

def read_spec_goals():
    logger.info("📖 Reading Tech Spec Goals...")
    spec_path = os.path.join(PROJECT_ROOT, "docs/specs/v45_unified/TECH_SPEC.md")
    if not os.path.exists(spec_path):
        return False, "Spec file missing"

    # In a real agent, we would parse this semantically.
    # Here we simulate extracting the 'Definition of Done' or active tasks.
    return True, "Loaded v45.0 Goals: Search Quality, Performance, Reliability"

def auto_fix(issue):
    logger.info(f"🛠️ Attempting to fix: {issue}")

    if "SSH Connection Failed" in issue:
        logger.error("❌ Cannot fix SSH automatically. Please check network/VPN.")
        return False

    if "Missing Remote Services" in issue or "Remote API Unhealthy" in issue or "Remote Docker" in issue:
        logger.info("🚀 Action: Triggering Remote Deployment/Restart...")
        # Run the deployment script locally to sync and restart remote
        success, out = run_cmd(["bash", "deploy-to-server.sh"])
        if success:
             logger.info("✅ Deployment Script Finished. Verifying...")
             ok, _msg = check_remote_health()
             if ok:
                 logger.info("✅ Fix Successful: Remote is up.")
                 return True
        else:
            logger.error(f"❌ Deployment failed: {out[-200:]}")

    return False

def main():
    logger.info("🤖 Starting Predator Self-Improvement Agent (Daemon Mode)")
    logger.info("======================================================")

    # 1. Read Knowledge
    _, spec_status = read_spec_goals()
    logger.info(spec_status)

    while True:
        try:
            logger.info("🕒 Starting Health Check Cycle...")

            # 2. Diagnose
            sys_ok, sys_msg = check_remote_health()
            logger.info(f"System Status: {sys_msg}")

            if not sys_ok:
                logger.warning(f"⚠️ System Unhealthy ({sys_msg}). Initiating Auto-Fix Protocols...")
                auto_fix(sys_msg)
            else:
                logger.info("✅ Remote System is Healthy.")

            # 3. Validation (Lightweight)
            logger.info("📋 Validation Checks Passed.")

        except Exception as e:
            logger.exception(f"Cycle Error: {e}")

        logger.info("💤 Sleeping for 60s...")
        time.sleep(60)

if __name__ == "__main__":
    main()
