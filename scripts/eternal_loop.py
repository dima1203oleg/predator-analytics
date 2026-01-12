#!/usr/bin/env python3
"""
♾️ ETERNAL EXECUTION LOOP — NEVER STOPS
═══════════════════════════════════════════════════════════════
System runs FOREVER. Auto-recovers from ANY failure.
NO HUMAN INTERVENTION REQUIRED.
═══════════════════════════════════════════════════════════════
"""

import time
import signal
import subprocess
import logging
from datetime import datetime
from pathlib import Path
import json

# ════════════════════════════════════════════════════════════════
# CONFIGURATION
# ════════════════════════════════════════════════════════════════

PROJECT_ROOT = Path(__file__).parent.parent
BACKEND_DIR = PROJECT_ROOT / "apps" / "backend"
FRONTEND_DIR = PROJECT_ROOT / "apps" / "frontend"

LOG_FILE = Path("/tmp/predator_eternal.log")
STATE_FILE = Path("/tmp/predator_eternal_state.json")

HEALTH_CHECK_INTERVAL = 30  # seconds
RESTART_DELAY = 5  # seconds
MAX_LOG_SIZE = 10 * 1024 * 1024  # 10MB

# ════════════════════════════════════════════════════════════════
# LOGGING SETUP
# ════════════════════════════════════════════════════════════════

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [ETERNAL] %(levelname)s: %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(LOG_FILE, mode='a'),
    ]
)
logger = logging.getLogger("eternal_loop")


# ════════════════════════════════════════════════════════════════
# STATE MANAGEMENT
# ════════════════════════════════════════════════════════════════

class StateManager:
    """Persist and recover execution state"""

    def __init__(self, state_file: Path = STATE_FILE):
        self.state_file = state_file
        self.state = self._load_state()

    def _load_state(self) -> dict:
        """Load state from file or return default"""
        if self.state_file.exists():
            try:
                return json.loads(self.state_file.read_text())
            except Exception:
                pass
        return {
            "started_at": None,
            "last_check": None,
            "restart_count": 0,
            "errors": [],
        }

    def save(self) -> None:
        """Save current state"""
        self.state["last_check"] = datetime.utcnow().isoformat()
        self.state_file.write_text(json.dumps(self.state, indent=2))

    def record_restart(self, service: str) -> None:
        """Record a service restart"""
        self.state["restart_count"] += 1
        self.save()
        logger.info(f"♾️ Restart #{self.state['restart_count']}: {service}")

    def record_error(self, error: str) -> None:
        """Record an error (keep last 100)"""
        self.state["errors"].append({
            "time": datetime.utcnow().isoformat(),
            "error": error,
        })
        self.state["errors"] = self.state["errors"][-100:]
        self.save()


# ════════════════════════════════════════════════════════════════
# SERVICE HEALTH CHECKS
# ════════════════════════════════════════════════════════════════

def check_backend_health() -> bool:
    """Check if backend is healthy"""
    try:
        import requests
        response = requests.get("http://localhost:8000/health", timeout=5)
        return response.status_code == 200
    except Exception:
        return False


def check_frontend_health() -> bool:
    """Check if frontend is running on port 3000"""
    try:
        result = subprocess.run(
            ["lsof", "-i", ":3000"],
            capture_output=True,
            timeout=5,
        )
        return result.returncode == 0
    except Exception:
        return False


def check_ngrok_health() -> bool:
    """Check if ngrok tunnel is active"""
    try:
        import requests
        response = requests.get("http://localhost:4040/api/tunnels", timeout=5)
        data = response.json()
        return len(data.get("tunnels", [])) > 0
    except Exception:
        return False


def check_docker_health() -> dict:
    """Check Docker container status"""
    try:
        result = subprocess.run(
            ["docker", "ps", "--format", "{{.Names}}:{{.Status}}"],
            capture_output=True,
            text=True,
            timeout=10,
        )
        if result.returncode != 0:
            return {}

        containers = {}
        for line in result.stdout.strip().split("\n"):
            if ":" in line:
                name, status = line.split(":", 1)
                containers[name] = "healthy" in status.lower() or "up" in status.lower()
        return containers
    except Exception:
        return {}


# ════════════════════════════════════════════════════════════════
# SERVICE RESTART FUNCTIONS
# ════════════════════════════════════════════════════════════════

def restart_backend() -> bool:
    """Restart the backend service"""
    logger.info("🔄 Restarting backend...")
    try:
        # Kill existing
        subprocess.run(["pkill", "-f", "run_v25_bot.py"], capture_output=True)
        time.sleep(2)

        # Start new
        subprocess.Popen(
            ["python", "run_v25_bot.py"],
            cwd=BACKEND_DIR,
            stdout=open("/tmp/backend.log", "a"),
            stderr=subprocess.STDOUT,
            start_new_session=True,
        )

        time.sleep(RESTART_DELAY)
        return check_backend_health()
    except Exception as e:
        logger.error(f"Backend restart failed: {e}")
        return False


def restart_frontend() -> bool:
    """Restart the frontend service"""
    logger.info("🔄 Restarting frontend...")
    try:
        # Kill existing
        subprocess.run(["pkill", "-f", "vite"], capture_output=True)
        time.sleep(2)

        # Start new
        subprocess.Popen(
            ["npm", "run", "dev"],
            cwd=FRONTEND_DIR,
            stdout=open("/tmp/frontend.log", "a"),
            stderr=subprocess.STDOUT,
            start_new_session=True,
        )

        time.sleep(RESTART_DELAY)
        return check_frontend_health()
    except Exception as e:
        logger.error(f"Frontend restart failed: {e}")
        return False


def restart_ngrok() -> bool:
    """Restart ngrok tunnel"""
    logger.info("🔄 Restarting ngrok...")
    try:
        # Kill existing
        subprocess.run(["pkill", "-f", "ngrok"], capture_output=True)
        time.sleep(2)

        # Start new
        subprocess.Popen(
            ["ngrok", "http", "8000", "--log=stdout"],
            stdout=open("/tmp/ngrok.log", "a"),
            stderr=subprocess.STDOUT,
            start_new_session=True,
        )

        time.sleep(RESTART_DELAY)
        return check_ngrok_health()
    except Exception as e:
        logger.error(f"Ngrok restart failed: {e}")
        return False


def restart_docker_container(name: str) -> bool:
    """Restart a Docker container"""
    logger.info(f"🔄 Restarting Docker container: {name}")
    try:
        subprocess.run(["docker", "restart", name], capture_output=True, timeout=30)
        time.sleep(5)
        containers = check_docker_health()
        return containers.get(name, False)
    except Exception as e:
        logger.error(f"Docker restart failed for {name}: {e}")
        return False


# ════════════════════════════════════════════════════════════════
# LOG ROTATION
# ════════════════════════════════════════════════════════════════

def rotate_logs() -> None:
    """Rotate logs if they get too large"""
    for log_file in [LOG_FILE, Path("/tmp/backend.log"), Path("/tmp/frontend.log")]:
        if log_file.exists() and log_file.stat().st_size > MAX_LOG_SIZE:
            try:
                # Truncate to last 1MB
                content = log_file.read_bytes()[-1024*1024:]
                log_file.write_bytes(content)
                logger.info(f"♻️ Rotated log: {log_file.name}")
            except Exception:
                pass


# ════════════════════════════════════════════════════════════════
# MAIN ETERNAL LOOP
# ════════════════════════════════════════════════════════════════

def eternal_loop():
    """
    ♾️ THE ETERNAL LOOP — NEVER STOPS

    Runs FOREVER, checking health and restarting services.
    Auto-recovers from ANY failure.
    """
    state = StateManager()
    state.state["started_at"] = datetime.utcnow().isoformat()
    state.save()

    logger.info("♾️ ETERNAL LOOP STARTED — GODMODE ACTIVE")
    logger.info("=" * 60)

    iteration = 0

    while True:  # ← NEVER STOPS
        iteration += 1

        try:
            logger.info(f"♾️ Iteration #{iteration} — Health check...")

            # Check and restart backend if needed
            if not check_backend_health():
                logger.warning("❌ Backend DOWN")
                if restart_backend():
                    state.record_restart("backend")
                    logger.info("✅ Backend restarted successfully")
                else:
                    state.record_error("Backend restart failed")
            else:
                logger.info("✅ Backend healthy")

            # Check and restart frontend if needed
            if not check_frontend_health():
                logger.warning("❌ Frontend DOWN")
                if restart_frontend():
                    state.record_restart("frontend")
                    logger.info("✅ Frontend restarted successfully")
                else:
                    state.record_error("Frontend restart failed")
            else:
                logger.info("✅ Frontend healthy")

            # Check and restart ngrok if needed
            if not check_ngrok_health():
                logger.warning("❌ Ngrok DOWN")
                if restart_ngrok():
                    state.record_restart("ngrok")
                    logger.info("✅ Ngrok restarted successfully")
                else:
                    state.record_error("Ngrok restart failed")
            else:
                logger.info("✅ Ngrok healthy")

            # Check Docker containers
            containers = check_docker_health()
            for name, healthy in containers.items():
                if not healthy and "predator" in name.lower():
                    logger.warning(f"❌ Container DOWN: {name}")
                    if restart_docker_container(name):
                        state.record_restart(f"docker:{name}")

            # Rotate logs
            rotate_logs()

            # Save state
            state.save()

            logger.info(f"♾️ Iteration #{iteration} complete. Sleeping {HEALTH_CHECK_INTERVAL}s...")
            logger.info("-" * 60)

        except Exception as e:
            # NEVER STOP — just log and continue
            logger.error(f"♾️ Error in iteration #{iteration}: {e}")
            state.record_error(str(e))
            logger.info("♾️ Auto-recovering... continuing loop")

        # Sleep before next iteration
        time.sleep(HEALTH_CHECK_INTERVAL)


# ════════════════════════════════════════════════════════════════
# SIGNAL HANDLERS (prevent accidental stop)
# ════════════════════════════════════════════════════════════════

def signal_handler(signum, frame):
    """Trap signals but keep running"""
    logger.warning(f"♾️ Received signal {signum} — IGNORING (GODMODE)")
    logger.info("♾️ Loop continues...")


# ════════════════════════════════════════════════════════════════
# ENTRY POINT
# ════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("♾️ ETERNAL EXECUTION LOOP — GODMODE")
    print("=" * 60)
    print("⚡ System will NEVER stop")
    print("⚡ Auto-recovery ENABLED")
    print("⚡ No human intervention required")
    print("=" * 60)

    # Trap common signals
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)

    # Start eternal loop
    eternal_loop()
